"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MasterEntity = "students" | "mentors" | "parents" | "packages" | "subjects";

const optionalUuid = z.union([z.string().uuid(), z.literal("")]).optional();
const accountFields = {
  profile_id: optionalUuid,
  account_email: z.union([z.string().email("Email akun tidak valid."), z.literal("")]).optional(),
  account_password: z.union([z.string().min(8, "Password minimal 8 karakter."), z.literal("")]).optional()
};
const schemas = {
  students: z.object({ full_name: z.string().min(2), student_number: z.string().min(2), birth_date: z.string().optional(), school_name: z.string().optional(), grade: z.string().optional(), parent_id: optionalUuid, package_id: optionalUuid, address: z.string().optional() }),
  mentors: z.object({ full_name: z.string().min(2), phone: z.string().min(8), specialization: z.string().optional(), address: z.string().optional(), ...accountFields }),
  parents: z.object({ full_name: z.string().min(2), phone: z.string().min(8), address: z.string().optional(), ...accountFields }),
  packages: z.object({ name: z.string().min(2), duration_months: z.coerce.number().int().positive(), sessions_per_month: z.coerce.number().int().positive(), price: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0)), description: z.string().optional() }),
  subjects: z.object({ name: z.string().min(2), level: z.string().min(2), description: z.string().optional() })
} as const;

const paths: Record<MasterEntity, string> = { students: "/admin/siswa", mentors: "/admin/mentor", parents: "/admin/orang-tua", packages: "/admin/paket", subjects: "/admin/mata-pelajaran" };
const nullable = (value: unknown) => value === "" || value === undefined ? null : value;
const accountEntities = new Set<MasterEntity>(["mentors", "parents"]);

export async function saveMasterData(entity: MasterEntity, id: string | null, raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const result = schemas[entity].safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Mohon lengkapi data dengan format yang benar." };

  const values = Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, nullable(value)])) as Record<string, unknown>;
  const email = typeof values.account_email === "string" ? values.account_email : null;
  const password = typeof values.account_password === "string" ? values.account_password : null;
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
        if (error || !data.user) return { error: error?.message ?? "Akun login gagal dibuat." };
        createdUserId = data.user.id;
        profileId = data.user.id;
      } catch {
        return { error: "Akun otomatis memerlukan SUPABASE_SERVICE_ROLE_KEY di .env.local." };
      }
    } else if (!id && !profileId) {
      return { error: "Pilih akun yang ada atau isi email dan password untuk membuat akun baru." };
    } else if (profileId) {
      const admin = createSupabaseAdminClient();
      const { data: profile, error: profileError } = await admin.from("profiles").select("id").eq("id", profileId).eq("role", role).maybeSingle();
      if (profileError || !profile) return { error: `Pilih akun login dengan role ${role} yang valid.` };
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
  revalidatePath(paths[entity]);
  return { success: true };
}

export async function deleteMasterData(entity: MasterEntity, id: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from(entity).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(paths[entity]);
  return { success: true };
}
