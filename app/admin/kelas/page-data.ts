import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Option = { id: string; name: string };
export type ClassRow = {
  id: string;
  name: string;
  subject_id: string;
  package_id: string | null;
  level: string | null;
  capacity: number;
  description: string | null;
  subject_name: string;
  package_name: string | null;
  student_ids: string[];
  mentor_ids: string[];
};

export async function getClassWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: classes, error }, { data: subjects }, { data: packages }, { data: students }, { data: mentors }, { data: studentClasses }, { data: mentorAssignments }] = await Promise.all([
    supabase.from("classes").select("*").order("name"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("packages").select("id, name").order("name"),
    supabase.from("students").select("id, full_name").order("full_name"),
    supabase.from("mentors").select("id, full_name").order("full_name"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("mentor_assignments").select("class_id, mentor_id")
  ]);
  if (error) throw new Error(error.message);
  const subjectNames = new Map((subjects ?? []).map(x => [x.id, x.name]));
  const packageNames = new Map((packages ?? []).map(x => [x.id, x.name]));
  return {
    classes: (classes ?? []).map(item => ({
      ...item,
      subject_name: subjectNames.get(item.subject_id) ?? "-",
      package_name: item.package_id ? packageNames.get(item.package_id) ?? null : null,
      student_ids: (studentClasses ?? []).filter(x => x.class_id === item.id).map(x => x.student_id),
      mentor_ids: (mentorAssignments ?? []).filter(x => x.class_id === item.id).map(x => x.mentor_id)
    })) as ClassRow[],
    subjects: subjects ?? [],
    packages: packages ?? [],
    students: students ?? [],
    mentors: mentors ?? []
  };
}

export async function getScheduleWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: schedules, error }, { data: classes }, { data: mentors }, { data: subjects }, { data: packages }, { data: studentClasses }, { data: students }] = await Promise.all([
    supabase.from("schedules").select("*").order("starts_at"),
    supabase.from("classes").select("id, name, subject_id, package_id").order("name"),
    supabase.from("mentors").select("id, full_name").order("full_name"),
    supabase.from("subjects").select("id, name"),
    supabase.from("packages").select("id, name"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("students").select("id, full_name")
  ]);
  if (error) throw new Error(error.message);

  const classMap = new Map((classes ?? []).map(x => [x.id, x]));
  const mentorNames = new Map((mentors ?? []).map(x => [x.id, x.full_name]));
  const subjectNames = new Map((subjects ?? []).map(x => [x.id, x.name]));
  const packageNames = new Map((packages ?? []).map(x => [x.id, x.name]));
  const studentNames = new Map((students ?? []).map(x => [x.id, x.full_name]));
  const now = new Date();

  return {
    schedules: (schedules ?? []).map(item => {
      const classRow = classMap.get(item.class_id);
      const names = (studentClasses ?? [])
        .filter(row => row.class_id === item.class_id)
        .map(row => studentNames.get(row.student_id))
        .filter(Boolean) as string[];
      return {
        ...item,
        class_name: classRow?.name ?? "-",
        mentor_name: mentorNames.get(item.mentor_id) ?? "-",
        subject_name: classRow?.subject_id ? subjectNames.get(classRow.subject_id) ?? "-" : "-",
        package_name: classRow?.package_id ? packageNames.get(classRow.package_id) ?? "Semua Paket" : "Semua Paket",
        student_names: names,
        status_label: new Date(item.ends_at) < now ? "Selesai" : "Terjadwal"
      };
    }),
    classes: classes ?? [],
    mentors: mentors ?? []
  };
}
