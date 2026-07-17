import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getParentSchedules(userId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Get parent
  const { data: parent } = await supabase.from("parents").select("id").eq("profile_id", userId).maybeSingle();
  if (!parent) return [];
  
  // Get children (students)
  const { data: students } = await supabase.from("students").select("id").eq("parent_id", parent.id);
  const studentIds = (students ?? []).map(s => s.id);
  if (!studentIds.length) return [];
  
  // Get class enrollments for all children
  const { data: enrollments } = await supabase.from("student_classes").select("class_id").in("student_id", studentIds);
  const classIds = [...new Set((enrollments ?? []).map(e => e.class_id))];
  if (!classIds.length) return [];
  
  // Get schedules for these classes
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      id,
      starts_at,
      ends_at,
      room,
      classes ( name ),
      mentors ( full_name )
    `)
    .in("class_id", classIds)
    .order("starts_at", { ascending: true });
    
  return (schedules ?? []).map((s: any) => ({
    id: s.id,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    room: s.room,
    class_name: s.classes?.name || "Kelas Tidak Diketahui",
    mentor_name: s.mentors?.full_name || "Tanpa Mentor"
  }));
}
