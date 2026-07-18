import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getParentSchedules(userId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Get parent
  const { data: parent } = await supabase.from("parents").select("id").eq("profile_id", userId).maybeSingle();
  if (!parent) return [];
  
  // Get children (students)
  const { data: students } = await supabase.from("students").select("id, full_name").eq("parent_id", parent.id);
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
      starts_at,
      ends_at,
      room,
      classes ( name, subject_id, package_id ),
      mentors ( full_name )
    `)
    .in("class_id", classIds)
    .order("starts_at", { ascending: true });
    
  const subjectIds = [...new Set((schedules ?? []).map((s: any) => s.classes?.subject_id).filter(Boolean))];
  const packageIds = [...new Set((schedules ?? []).map((s: any) => s.classes?.package_id).filter(Boolean))];
  const [{ data: subjects }, { data: packages }] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] }),
    packageIds.length ? supabase.from("packages").select("id, name").in("id", packageIds) : Promise.resolve({ data: [] }),
  ]);
  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row.name]));
  const packageMap = new Map((packages ?? []).map((row) => [row.id, row.name]));
  const studentMap = new Map((students ?? []).map((row) => [row.id, row.full_name]));

  return (schedules ?? []).map((s: any) => ({
    id: s.id,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    room: s.room,
    class_name: s.classes?.name || "Kelas Tidak Diketahui",
    mentor_name: s.mentors?.full_name || "Tanpa Mentor",
    subject_name: s.classes?.subject_id ? subjectMap.get(s.classes.subject_id) ?? "-" : "-",
    package_name: s.classes?.package_id ? packageMap.get(s.classes.package_id) ?? "-" : "-",
    student_names: (enrollments ?? [])
      .filter((row) => row.class_id === s.class_id)
      .map((row) => studentMap.get(row.student_id))
      .filter(Boolean),
  }));
}
