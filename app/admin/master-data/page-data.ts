import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MasterEntity } from "./actions";
import type { MasterRecord } from "@/components/app/master-data-manager";

export async function getMasterRows(entity: MasterEntity) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(entity).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MasterRecord[];
}

export async function getPackageRows() {
  const supabase = await createSupabaseServerClient();
  const [{ data: packages, error }, { data: classes }, { data: packageClasses }] = await Promise.all([
    supabase.from("packages").select("*").order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name").order("name"),
    supabase.from("package_classes").select("package_id, class_id")
  ]);
  if (error) throw new Error(error.message);
  const classNames = new Map((classes ?? []).map(item => [item.id, item.name]));
  return (packages ?? []).map(item => ({
    ...item,
    class_ids: (packageClasses ?? []).filter((row) => row.package_id === item.id).map((row) => row.class_id),
    class_names: (packageClasses ?? []).filter((row) => row.package_id === item.id).length
      ? (packageClasses ?? [])
          .filter((row) => row.package_id === item.id)
          .map((row) => classNames.get(row.class_id) ?? "Kelas tidak ditemukan")
          .join(", ")
      : "Belum ada kelas",
    status_label: item.status === "inactive" ? "Nonaktif" : "Aktif"
  })) as MasterRecord[];
}

export async function getPackageOptions() {
  const supabase = await createSupabaseServerClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("name");
  return {
    classes: (classes ?? []).map(item => ({ value: item.id, label: item.name }))
  };
}

async function getAccountWorkspace(entity: "mentors" | "parents", role: "mentor" | "parent") {
  const supabase = await createSupabaseServerClient();
  const [{ data: people, error: peopleError }, { data: profiles, error: profilesError }, { data: packages }] = await Promise.all([
    supabase.from(entity).select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, full_name").eq("role", role).order("email"),
    entity === "parents" ? supabase.from("packages").select("id, name").eq("status", "active").order("name") : Promise.resolve({ data: [] })
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
  const packageNames = new Map((packages ?? []).map((item) => [item.id, item.name]));

  return {
    rows: (people ?? []).map(person => {
      const linked = person.profile_id ? profileMap.get(person.profile_id) : null;
      return {
        ...person,
        account_name: linked?.label ?? (person.profile_id ? "Akun tidak ditemukan" : null),
        package_name: person.package_id ? packageNames.get(person.package_id) ?? "Paket tidak ditemukan" : null,
        // Pre-fill email dari profile yang terhubung agar form Edit menampilkan email yang benar
        account_email: linked?.email ?? null,
      };
    }) as MasterRecord[],
    accounts: (profiles ?? []).map(profile => ({
      value: profile.id,
      label: profileMap.get(profile.id)?.label ?? profile.email,
    })),
    packages: (packages ?? []).map(item => ({ value: item.id, label: item.name }))
  };
}

export const getMentorWorkspace = () => getAccountWorkspace("mentors", "mentor");
export const getParentWorkspace = () => getAccountWorkspace("parents", "parent");

export async function getStudentRows() {
  const supabase = await createSupabaseServerClient();
  const [{ data: students, error }, { data: parents }, { data: packages }] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase.from("parents").select("id, full_name, phone, package_id"),
    supabase.from("packages").select("id, name")
  ]);
  if (error) throw new Error(error.message);
  const parentNames = new Map((parents ?? []).map(parent => [parent.id, parent.full_name]));
  const parentPhones = new Map((parents ?? []).map(parent => [parent.id, parent.phone]));
  const parentPackageIds = new Map((parents ?? []).map(parent => [parent.id, parent.package_id]));
  const packageNames = new Map((packages ?? []).map(item => [item.id, item.name]));
  return (students ?? []).map(student => ({
    ...student,
    parent_name: parentNames.get(student.parent_id) ?? null,
    parent_phone: parentPhones.get(student.parent_id) ?? null,
    parent_contact: parentPhones.get(student.parent_id) ?? null,
    package_name: packageNames.get(student.package_id ?? parentPackageIds.get(student.parent_id)) ?? null
  }));
}

export async function getStudentOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: parents }, { data: packages }, { data: profiles }] = await Promise.all([
    supabase.from("parents").select("id, full_name, phone, profile_id").order("full_name"),
    supabase.from("packages").select("id, name").eq("status", "active").order("name"),
    supabase.from("profiles").select("id, email").eq("role", "parent")
  ]);
  const profileEmails = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]));
  return {
    parents: (parents ?? []).map(item => {
      const email = item.profile_id ? profileEmails.get(item.profile_id) : null;
      const contact = email ?? item.phone;
      return { value: item.id, label: contact ? `${item.full_name} - ${contact}` : `${item.full_name} - belum ada akun login` };
    }),
    packages: (packages ?? []).map(item => ({ value: item.id, label: item.name }))
  };
}
