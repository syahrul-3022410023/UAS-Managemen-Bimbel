"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppLoginMessage } from "@/lib/whatsapp";

export type MasterEntity = "students" | "mentors" | "parents" | "packages" | "subjects";
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type ActionResult = {
  success?: boolean;
  error?: string;
  warning?: string;
};

const optionalUuid = z.union([z.string().uuid(), z.literal("")]).optional();
const accountFields = {
  profile_id: optionalUuid,
  account_email: z.union([z.string().email("Email akun tidak valid."), z.literal("")]).optional(),
  account_password: z.union([z.string().min(8, "Password minimal 8 karakter."), z.literal("")]).optional()
};
const schemas = {
  students: z.object({ full_name: z.string().min(2), student_number: z.string().optional(), birth_date: z.string().optional(), school_name: z.string().optional(), grade: z.string().optional(), parent_id: optionalUuid, package_id: optionalUuid, address: z.string().optional() }),
  mentors: z.object({ full_name: z.string().min(2), phone: z.string().min(8), specialization: z.string().optional(), address: z.string().optional(), ...accountFields }),
  parents: z.object({ full_name: z.string().min(2), phone: z.string().min(8), package_id: z.string().uuid("Pilih paket bimbel untuk orang tua."), address: z.string().optional(), ...accountFields }),
  packages: z.object({
    name: z.string().min(2),
    level: z.string().optional(),
    class_ids: z.array(z.string().uuid()).min(1, "Pilih minimal satu kelas untuk paket."),
    duration_months: z.coerce.number().int().positive(),
    sessions_per_month: z.coerce.number().int().positive(),
    price: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0)),
    status: z.enum(["active", "inactive"]),
    description: z.string().optional()
  }),
  subjects: z.object({ name: z.string().min(2), level: z.string().min(2), description: z.string().optional() })
} as const;

const paths: Record<MasterEntity, string> = { students: "/admin/siswa", mentors: "/admin/mentor", parents: "/admin/orang-tua", packages: "/admin/paket", subjects: "/admin/mata-pelajaran" };
const nullable = (value: unknown) => value === "" || value === undefined ? null : value;
const accountEntities = new Set<MasterEntity>(["mentors", "parents"]);
const revalidateMasterChanges = (entity: MasterEntity) => {
  revalidatePath(paths[entity]);
  if (entity === "students" || entity === "parents") {
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/kelas");
    revalidatePath("/orang-tua/dashboard");
    revalidatePath("/orang-tua/jadwal");
    revalidatePath("/orang-tua/absensi");
    revalidatePath("/orang-tua/invoice");
  }
  if (entity === "mentors") {
    revalidatePath("/admin/kelas");
    revalidatePath("/admin/jadwal");
    revalidatePath("/mentor/dashboard");
    revalidatePath("/mentor/kelas");
    revalidatePath("/mentor/jadwal");
  }
  if (entity === "packages" || entity === "subjects") {
    revalidatePath("/admin/kelas");
    revalidatePath("/admin/jadwal");
    revalidatePath("/admin/orang-tua");
    revalidatePath("/admin/siswa");
    revalidatePath("/admin/invoice");
    revalidatePath("/orang-tua/dashboard");
    revalidatePath("/orang-tua/jadwal");
    revalidatePath("/orang-tua/absensi");
  }
};
const adminAuthError = (message?: string) => {
  const lowerMessage = message?.toLowerCase() ?? "";
  if (lowerMessage.includes("invalid api key")) {
    return "Secret key Supabase ditolak. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY berasal dari project Supabase yang sama, lalu restart server.";
  }
  return message ?? "Akun login gagal dibuat.";
};

async function syncParentPackageStudents(supabase: SupabaseServerClient, parentId: string, packageId: string) {
  const [{ data: students }, { data: packageClasses }] = await Promise.all([
    supabase.from("students").select("id").eq("parent_id", parentId),
    supabase.from("package_classes").select("class_id").eq("package_id", packageId),
  ]);
  const studentIds = (students ?? []).map((student) => student.id);
  const classIds = (packageClasses ?? []).map((item) => item.class_id);

  if (studentIds.length) {
    await supabase.from("students").update({ package_id: packageId }).in("id", studentIds);
    await supabase.from("student_classes").delete().in("student_id", studentIds);
  }
  if (studentIds.length && classIds.length) {
    const values = studentIds.flatMap((studentId) => classIds.map((classId) => ({ student_id: studentId, class_id: classId })));
    await supabase.from("student_classes").insert(values);
  }
}

export async function saveMasterData(entity: MasterEntity, id: string | null, raw: Record<string, unknown>): Promise<ActionResult> {
  await requireRole(["admin"]);
  const result = schemas[entity].safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Mohon lengkapi data dengan format yang benar." };

  const values = Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, nullable(value)])) as Record<string, unknown>;
  const packageClassIds = entity === "packages" && "class_ids" in result.data ? result.data.class_ids : [];
  if (entity === "packages") {
    delete values.class_ids;
  }
  if (entity === "students" && !values.student_number) delete values.student_number;
  const email = typeof values.account_email === "string" ? values.account_email : null;
  const password = typeof values.account_password === "string" ? values.account_password : null;
  const phone = typeof values.phone === "string" ? values.phone : null;
  const fullName = typeof values.full_name === "string" ? values.full_name : "Pengguna";
  let profileId = typeof values.profile_id === "string" ? values.profile_id : null;
  delete values.account_email;
  delete values.account_password;

  const supabase = await createSupabaseServerClient();
  let createdUserId: string | null = null;

  if (entity === "students" && values.parent_id) {
    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("package_id")
      .eq("id", values.parent_id)
      .maybeSingle();
    if (parentError) return { error: parentError.message };
    values.package_id = parent?.package_id ?? null;
  }

  if (accountEntities.has(entity)) {
    const role = entity === "mentors" ? "mentor" : "parent";
    if (!profileId && (email || password)) {
      if (!email || !password) return { error: "Email dan password harus diisi bersama-sama." };
      try {
        const admin = createSupabaseAdminClient();
        const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: values.full_name, role } });
        if (error || !data.user) return { error: adminAuthError(error?.message) };
        createdUserId = data.user.id;
        profileId = data.user.id;
      } catch {
        return { error: "Akun otomatis memerlukan SUPABASE_SERVICE_ROLE_KEY di .env.local." };
      }
    } else if (profileId) {
      try {
        const admin = createSupabaseAdminClient();
        const { data: profile, error: profileError } = await admin.from("profiles").select("id").eq("id", profileId).eq("role", role).maybeSingle();
        if (profileError) return { error: adminAuthError(profileError.message) };
        if (profileError || !profile) return { error: `Pilih akun login dengan role ${role} yang valid.` };
      } catch {
        return { error: "Validasi akun login memerlukan SUPABASE_SERVICE_ROLE_KEY yang benar di .env.local." };
      }
    }
    if (profileId) values.profile_id = profileId;
    else if (id) delete values.profile_id;
  }

  const query = id
    ? supabase.from(entity).update(values).eq("id", id).select("id").single()
    : supabase.from(entity).insert(values).select("id").single();
  const { data: savedRow, error } = await query;
  if (error) {
    if (createdUserId) {
      try { await createSupabaseAdminClient().auth.admin.deleteUser(createdUserId); } catch { /* Keep the original data error. */ }
    }
    return { error: error.code === "23505" ? "Data atau akun tersebut sudah digunakan." : error.message };
  }
  if (entity === "packages") {
    const packageId = id ?? savedRow?.id;
    if (!packageId) return { error: "Paket tersimpan, tetapi relasi kelas gagal dibaca." };
    const { error: deleteError } = await supabase.from("package_classes").delete().eq("package_id", packageId);
    if (deleteError) return { error: deleteError.message };
    if (packageClassIds.length) {
      const { error: insertError } = await supabase
        .from("package_classes")
        .insert(packageClassIds.map((classId) => ({ package_id: packageId, class_id: classId })));
      if (insertError) return { error: insertError.message };
    }
    const { data: parents } = await supabase.from("parents").select("id").eq("package_id", packageId);
    for (const parent of parents ?? []) {
      await syncParentPackageStudents(supabase, parent.id, packageId);
    }
  }
  if (entity === "parents") {
    const parentId = id ?? savedRow?.id;
    const packageId = typeof values.package_id === "string" ? values.package_id : null;
    if (parentId && packageId) {
      await syncParentPackageStudents(supabase, parentId, packageId);
    }
  }
  if (entity === "students") {
    const parentId = typeof values.parent_id === "string" ? values.parent_id : null;
    const packageId = typeof values.package_id === "string" ? values.package_id : null;
    if (parentId && packageId) {
      await syncParentPackageStudents(supabase, parentId, packageId);
    }
  }
  if (createdUserId && email && password && phone) {
    const roleLabel = entity === "mentors" ? "mentor" : "orang tua";
    const whatsapp = await sendWhatsAppLoginMessage({ email, name: fullName, password, phone, roleLabel });
    if (whatsapp.error) {
      revalidateMasterChanges(entity);
      return { success: true, warning: `Data tersimpan, tetapi WhatsApp gagal dikirim: ${whatsapp.error}` };
    }
  }
  revalidateMasterChanges(entity);
  return { success: true };
}

export async function deleteMasterData(entity: MasterEntity, id: string): Promise<ActionResult> {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  let profileId: string | null = null;

  if (accountEntities.has(entity)) {
    const { data, error: lookupError } = await supabase
      .from(entity)
      .select("profile_id")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) return { error: lookupError.message };
    profileId = typeof data?.profile_id === "string" ? data.profile_id : null;
  }

  if (profileId) {
    const { error: authError } = await createSupabaseAdminClient().auth.admin.deleteUser(profileId);
    if (authError) return { error: `Akun autentikasi gagal dihapus: ${adminAuthError(authError.message)}` };
  }

  const { error } = await supabase.from(entity).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateMasterChanges(entity);
  return { success: true };
}
