import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getParentScope } from "@/lib/parents/scope";

export async function getParentSchedules(userId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { parent, parentIds } = await getParentScope(supabase, userId);
  if (!parent) return [];
  
  // Get children (students)
  const [{ data: students }, { data: parents }] = await Promise.all([
    supabase.from("students").select("id, full_name, parent_id, package_id").in("parent_id", parentIds),
    supabase.from("parents").select("id, package_id").in("id", parentIds),
  ]);
  const studentIds = (students ?? []).map(s => s.id);
  if (!studentIds.length) return [];
  
  // Get class enrollments for all children
  const { data: enrollments } = await supabase.from("student_classes").select("student_id, class_id").in("student_id", studentIds);
  const classIds = [...new Set((enrollments ?? []).map(e => e.class_id))];
  if (!classIds.length) return [];
  
  // Get schedules for these classes
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      id,
      class_id,
      package_id,
      starts_at,
      ends_at,
      room,
      classes ( name, subject_id, package_id ),
      mentors ( full_name )
    `)
    .in("class_id", classIds)
    .order("starts_at", { ascending: true });
    
  const subjectIds = [...new Set((schedules ?? []).map((s: any) => s.classes?.subject_id).filter(Boolean))];
  const packageIds = [...new Set((schedules ?? []).map((s: any) => s.package_id ?? s.classes?.package_id).filter(Boolean))];
  const [{ data: subjects }, { data: packages }] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] }),
    packageIds.length ? supabase.from("packages").select("id, name").in("id", packageIds) : Promise.resolve({ data: [] }),
  ]);
  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row.name]));
  const packageMap = new Map((packages ?? []).map((row) => [row.id, row.name]));
  const studentMap = new Map((students ?? []).map((row) => [row.id, row.full_name]));
  const parentPackageMap = new Map((parents ?? []).map((row) => [row.id, row.package_id]));
  const studentPackageMap = new Map((students ?? []).map((row) => [row.id, row.package_id ?? parentPackageMap.get(row.parent_id)]));

  return (schedules ?? [])
    .filter((s: any) => !s.package_id || (enrollments ?? []).some((row) => row.class_id === s.class_id && studentPackageMap.get(row.student_id) === s.package_id))
    .map((s: any) => ({
    id: s.id,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    room: s.room,
    class_name: s.classes?.name || "Kelas Tidak Diketahui",
    mentor_name: s.mentors?.full_name || "Tanpa Mentor",
    subject_name: s.classes?.subject_id ? subjectMap.get(s.classes.subject_id) ?? s.classes?.name ?? "Jadwal Kelas" : s.classes?.name ?? "Jadwal Kelas",
    package_name: s.package_id ? packageMap.get(s.package_id) ?? "-" : s.classes?.package_id ? packageMap.get(s.classes.package_id) ?? "-" : "-",
    student_names: (enrollments ?? [])
      .filter((row) => row.class_id === s.class_id)
      .filter((row) => !s.package_id || studentPackageMap.get(row.student_id) === s.package_id)
      .map((row) => studentMap.get(row.student_id))
      .filter(Boolean),
  }));
}
