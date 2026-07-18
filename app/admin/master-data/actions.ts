"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppLoginMessage } from "@/lib/whatsapp";

export type MasterEntity = "students" | "mentors" | "parents" | "packages" | "subjects";
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
  students: z.object({ full_name: z.string().min(2), student_number: z.string().optional(), birth_date: z.string().optional(), school_name: z.string().optional(), grade: z.string().optional(), parent_id: optionalUuid, parent_phone: z.string().optional(), package_id: optionalUuid, address: z.string().optional() }),
  mentors: z.object({ full_name: z.string().min(2), phone: z.string().min(8), specialization: z.string().optional(), address: z.string().optional(), ...accountFields }),
  parents: z.object({ full_name: z.string().min(2), phone: z.string().min(8), address: z.string().optional(), ...accountFields }),
  packages: z.object({
    name: z.string().min(2),
    level: z.string().optional(),
    subject_id: optionalUuid,
    duration_months: z.coerce.number().int().positive(),
    sessions_per_month: z.coerce.number().int().positive(),
    price: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0)),
    mentor_fee_per_session: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0)),
    status: z.enum(["active", "inactive"]),
    description: z.string().optional()
  }),
  subjects: z.object({ name: z.string().min(2), level: z.string().min(2), description: z.string().optional() })
} as const;

const paths: Record<MasterEntity, string> = { students: "/admin/siswa", mentors: "/admin/mentor", parents: "/admin/orang-tua", packages: "/admin/paket", subjects: "/admin/mata-pelajaran" };
const nullable = (value: unknown) => value === "" || value === undefined ? null : value;
const accountEntities = new Set<MasterEntity>(["mentors", "parents"]);
const adminAuthError = (message?: string) => {
  const lowerMessage = message?.toLowerCase() ?? "";
  if (lowerMessage.includes("invalid api key")) {
    return "Secret key Supabase ditolak. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY berasal dari project Supabase yang sama, lalu restart server.";
  }
  return message ?? "Akun login gagal dibuat.";
};

export async function saveMasterData(entity: MasterEntity, id: string | null, raw: Record<string, unknown>): Promise<ActionResult> {
  await requireRole(["admin"]);
  const result = schemas[entity].safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Mohon lengkapi data dengan format yang benar." };

  const values = Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, nullable(value)])) as Record<string, unknown>;
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

  const query = id ? supabase.from(entity).update(values).eq("id", id) : supabase.from(entity).insert(values);
  const { error } = await query;
  if (error) {
    if (createdUserId) {
      try { await createSupabaseAdminClient().auth.admin.deleteUser(createdUserId); } catch { /* Keep the original data error. */ }
    }
    return { error: error.code === "23505" ? "Data atau akun tersebut sudah digunakan." : error.message };
  }
  if (createdUserId && email && password && phone) {
    const roleLabel = entity === "mentors" ? "mentor" : "orang tua";
    const whatsapp = await sendWhatsAppLoginMessage({ email, name: fullName, password, phone, roleLabel });
    if (whatsapp.error) {
      revalidatePath(paths[entity]);
      return { success: true, warning: `Data tersimpan, tetapi WhatsApp gagal dikirim: ${whatsapp.error}` };
    }
  }
  revalidatePath(paths[entity]);
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

  revalidatePath(paths[entity]);
  return { success: true };
}
