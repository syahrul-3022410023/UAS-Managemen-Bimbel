import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MasterEntity } from "./actions";
import type { MasterRecord } from "@/components/app/master-data-manager";

export async function getMasterRows(entity: MasterEntity) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(entity).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterRecord[];
}

async function getAccountWorkspace(entity: "mentors" | "parents", role: "mentor" | "parent") {
  const supabase = await createSupabaseServerClient();
  const [{ data: people, error: peopleError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from(entity).select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, full_name").eq("role", role).order("email")
  ]);

  if (peopleError) throw new Error(peopleError.message);
  if (profilesError) throw new Error(profilesError.message);

  // Map profile_id → { label, email } agar bisa pre-fill form edit
  const profileMap = new Map((profiles ?? []).map(profile => [
    profile.id,
    {
      label: profile.full_name ? `${profile.full_name} (${profile.email})` : profile.email,
      email: profile.email,
    }
  ]));

  return {
    rows: (people ?? []).map(person => {
      const linked = person.profile_id ? profileMap.get(person.profile_id) : null;
      return {
        ...person,
        account_name: linked?.label ?? (person.profile_id ? "Akun tidak ditemukan" : null),
        // Pre-fill email dari profile yang terhubung agar form Edit menampilkan email yang benar
        account_email: linked?.email ?? null,
      };
    }) as MasterRecord[],
    accounts: (profiles ?? []).map(profile => ({
      value: profile.id,
      label: profileMap.get(profile.id)?.label ?? profile.email,
    }))
  };
}

export const getMentorWorkspace = () => getAccountWorkspace("mentors", "mentor");
export const getParentWorkspace = () => getAccountWorkspace("parents", "parent");

export async function getStudentRows() {
  const supabase = await createSupabaseServerClient();
  const [{ data: students, error }, { data: parents }, { data: packages }] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase.from("parents").select("id, full_name"),
    supabase.from("packages").select("id, name")
  ]);
  if (error) throw new Error(error.message);
  const parentNames = new Map((parents ?? []).map(parent => [parent.id, parent.full_name]));
  const packageNames = new Map((packages ?? []).map(item => [item.id, item.name]));
  return (students ?? []).map(student => ({ ...student, parent_name: parentNames.get(student.parent_id) ?? null, package_name: packageNames.get(student.package_id) ?? null }));
}

export async function getStudentOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: parents }, { data: packages }] = await Promise.all([
    supabase.from("parents").select("id, full_name").order("full_name"),
    supabase.from("packages").select("id, name").order("name")
  ]);
  return { parents: (parents ?? []).map(item => ({ value: item.id, label: item.full_name })), packages: (packages ?? []).map(item => ({ value: item.id, label: item.name })) };
}
