import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Option = {
  id: string;
  name: string;
  price?: number | null;
  duration_months?: number | null;
  sessions_per_month?: number | null;
  class_ids?: string[];
};
export type PersonOption = {
  id: string;
  full_name: string;
  account_email?: string | null;
  profile_id?: string | null;
};
export type ClassRow = {
  id: string;
  name: string;
  subject_id: string | null;
  package_id: string | null;
  level: string | null;
  capacity: number;
  mentor_fee_per_session: number;
  description: string | null;
  subject_name: string;
  package_name: string | null;
  package_names: string[];
  package_groups: { id: string; name: string; student_names: string[] }[];
  package_price: number | null;
  package_duration_months: number | null;
  package_sessions_per_month: number | null;
  student_ids: string[];
  student_names: string[];
  mentor_ids: string[];
  mentor_names: string[];
  schedule_count: number;
  next_schedule_at: string | null;
  attendance_percent: number | null;
  recorded_attendance_count: number;
  total_attendance_slots: number;
};

export async function getClassWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: classes, error }, { data: subjects }, { data: packages }, { data: students }, { data: mentors }, { data: profiles }, { data: studentClasses }, { data: mentorAssignments }, { data: schedules }, { data: studentAttendance }, { data: packageClasses }] = await Promise.all([
    supabase.from("classes").select("*").order("name"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("packages").select("id, name, price, duration_months, sessions_per_month").order("name"),
    supabase.from("students").select("id, full_name, parent_id, package_id").order("full_name"),
    supabase.from("mentors").select("id, full_name, profile_id").order("full_name"),
    supabase.from("profiles").select("id, email").eq("role", "mentor"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("mentor_assignments").select("class_id, mentor_id"),
    supabase.from("schedules").select("id, class_id, starts_at, ends_at").order("starts_at"),
    supabase.from("student_attendance").select("schedule_id, status"),
    supabase.from("package_classes").select("package_id, class_id")
  ]);
  if (error) throw new Error(error.message);
  const subjectNames = new Map((subjects ?? []).map(x => [x.id, x.name]));
  const packageMap = new Map((packages ?? []).map(x => [x.id, x]));
  const profileEmails = new Map((profiles ?? []).map(x => [x.id, x.email]));
  const studentNames = new Map((students ?? []).map((x) => [x.id, x.full_name]));
  const mentorNames = new Map((mentors ?? []).map((x) => [x.id, x.full_name]));
  const parentIds = [...new Set((students ?? []).map((student) => student.parent_id).filter(Boolean))];
  const { data: parents } = parentIds.length
    ? await supabase.from("parents").select("id, package_id").in("id", parentIds)
    : { data: [] };
  const parentPackageIds = new Map((parents ?? []).map((parent) => [parent.id, parent.package_id]));
  const now = new Date();
  return {
    classes: (classes ?? []).map(item => {
      const packageItem = item.package_id ? packageMap.get(item.package_id) ?? null : null;
      const classPackageIds = (packageClasses ?? []).filter((row) => row.class_id === item.id).map((row) => row.package_id);
      const classSchedules = (schedules ?? []).filter((schedule) => schedule.class_id === item.id);
      const nextSchedule = classSchedules.find((schedule) => new Date(schedule.starts_at) >= now);
      const scheduleIds = new Set(classSchedules.map((schedule) => schedule.id));
      const attendanceRows = (studentAttendance ?? []).filter((attendance) => scheduleIds.has(attendance.schedule_id));
      const recordedAttendanceCount = attendanceRows.filter((attendance) => attendance.status === "present" || attendance.status === "late").length;
      const totalAttendanceSlots = attendanceRows.length;
      const manualStudentIds = (studentClasses ?? []).filter(x => x.class_id === item.id).map(x => x.student_id);
      const autoStudentIds = (students ?? [])
        .filter((student) => {
          const packageId = student.package_id ?? parentPackageIds.get(student.parent_id);
          return packageId ? classPackageIds.includes(packageId) : false;
        })
        .map((student) => student.id);
      const studentIds = [...new Set([...manualStudentIds, ...autoStudentIds])];
      const mentorIds = (mentorAssignments ?? []).filter(x => x.class_id === item.id).map(x => x.mentor_id);
      const packageGroups = classPackageIds.map((packageId) => ({
        id: packageId,
        name: packageMap.get(packageId)?.name ?? "Paket tidak ditemukan",
        student_names: (students ?? [])
          .filter((student) => (student.package_id ?? parentPackageIds.get(student.parent_id)) === packageId)
          .map((student) => student.full_name),
      }));

      return {
        ...item,
        subject_name: item.subject_id ? subjectNames.get(item.subject_id) ?? item.name : item.name,
        package_name: packageItem?.name ?? null,
        package_names: classPackageIds.map((id) => packageMap.get(id)?.name).filter(Boolean) as string[],
        package_groups: packageGroups,
        package_price: packageItem ? Number(packageItem.price ?? 0) : null,
        package_duration_months: packageItem?.duration_months ?? null,
        package_sessions_per_month: packageItem?.sessions_per_month ?? null,
        mentor_fee_per_session: Number(item.mentor_fee_per_session ?? 0),
        student_ids: studentIds,
        student_names: studentIds.map((id) => studentNames.get(id)).filter(Boolean) as string[],
        mentor_ids: mentorIds,
        mentor_names: mentorIds.map((id) => mentorNames.get(id)).filter(Boolean) as string[],
        schedule_count: classSchedules.length,
        next_schedule_at: nextSchedule?.starts_at ?? null,
        attendance_percent: totalAttendanceSlots ? Math.round((recordedAttendanceCount / totalAttendanceSlots) * 100) : null,
        recorded_attendance_count: recordedAttendanceCount,
        total_attendance_slots: totalAttendanceSlots,
      };
    }) as ClassRow[],
    subjects: subjects ?? [],
    packages: (packages ?? []).map((item) => ({
      ...item,
      price: Number(item.price ?? 0),
    })),
    students: students ?? [],
    mentors: (mentors ?? []).map((mentor) => ({
      ...mentor,
      account_email: mentor.profile_id ? profileEmails.get(mentor.profile_id) ?? null : null,
    })) as PersonOption[]
  };
}

export async function getScheduleWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: schedules, error }, { data: classes }, { data: mentors }, { data: subjects }, { data: packages }, { data: studentClasses }, { data: students }, { data: mentorAssignments }, { data: packageClasses }] = await Promise.all([
    supabase.from("schedules").select("*").order("starts_at"),
    supabase.from("classes").select("id, name, subject_id, package_id").order("name"),
    supabase.from("mentors").select("id, full_name").order("full_name"),
    supabase.from("subjects").select("id, name"),
    supabase.from("packages").select("id, name"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("students").select("id, full_name, parent_id, package_id"),
    supabase.from("mentor_assignments").select("class_id, mentor_id"),
    supabase.from("package_classes").select("package_id, class_id")
  ]);
  if (error) throw new Error(error.message);

  const classMap = new Map((classes ?? []).map(x => [x.id, x]));
  const mentorNames = new Map((mentors ?? []).map(x => [x.id, x.full_name]));
  const subjectNames = new Map((subjects ?? []).map(x => [x.id, x.name]));
  const packageNames = new Map((packages ?? []).map(x => [x.id, x.name]));
  const studentNames = new Map((students ?? []).map(x => [x.id, x.full_name]));
  const parentIds = [...new Set((students ?? []).map((student) => student.parent_id).filter(Boolean))];
  const { data: parents } = parentIds.length
    ? await supabase.from("parents").select("id, package_id").in("id", parentIds)
    : { data: [] };
  const parentPackageIds = new Map((parents ?? []).map((parent) => [parent.id, parent.package_id]));
  const now = new Date();

  return {
    schedules: (schedules ?? []).map(item => {
      const classRow = classMap.get(item.class_id);
      const packageNamesForClass = (packageClasses ?? [])
        .filter((row) => row.class_id === item.class_id)
        .map((row) => packageNames.get(row.package_id))
        .filter(Boolean) as string[];
      const packageId = item.package_id ?? null;
      const names = (studentClasses ?? [])
        .filter(row => row.class_id === item.class_id)
        .filter((row) => {
          if (!packageId) return true;
          const student = (students ?? []).find((item) => item.id === row.student_id);
          return student ? (student.package_id ?? parentPackageIds.get(student.parent_id)) === packageId : false;
        })
        .map(row => studentNames.get(row.student_id))
        .filter(Boolean) as string[];
      return {
        ...item,
        class_name: classRow?.name ?? "-",
        mentor_name: mentorNames.get(item.mentor_id) ?? "-",
        subject_name: classRow?.subject_id ? subjectNames.get(classRow.subject_id) ?? classRow.name : classRow?.name ?? "-",
        package_name: packageId ? packageNames.get(packageId) ?? "Paket tidak ditemukan" : packageNamesForClass.length ? packageNamesForClass.join(", ") : "Belum masuk paket",
        student_names: names,
        status_label: new Date(item.ends_at) < now ? "Selesai" : "Terjadwal"
      };
    }),
    classes: (classes ?? []).map((item) => ({
      ...item,
      mentor_ids: (mentorAssignments ?? []).filter((row) => row.class_id === item.id).map((row) => row.mentor_id),
      packages: (packageClasses ?? [])
        .filter((row) => row.class_id === item.id)
        .map((row) => ({ id: row.package_id, name: packageNames.get(row.package_id) ?? "Paket tidak ditemukan" })),
    })),
    mentors: mentors ?? []
  };
}
