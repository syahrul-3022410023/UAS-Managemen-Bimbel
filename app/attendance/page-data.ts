import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AttendanceStudent = {
  id: string;
  full_name: string;
  status: string;
  notes: string;
};

/** Used by mentor fill-in form */
export type AttendanceSchedule = {
  id: string;
  starts_at: string;
  ends_at: string;
  class_id: string;
  package_id: string | null;
  mentor_id: string;
  class_name: string;
  package_name: string | null;
  mentor_status: string;
  students: AttendanceStudent[];
};

/** Used by admin recap table */
export type AttendanceRecapRow = {
  schedule_id: string;
  class_id: string;
  package_id: string | null;
  package_options: { id: string; name: string }[];
  starts_at: string;
  class_name: string;
  package_name: string | null;
  mentor_name: string;
  mentor_status: string;
  student_names: string[];
  total_students: number;
  count_present: number;
  count_late: number;
  count_excused: number;
  count_absent: number;
};

// ─── Admin: recap all sessions ────────────────────────────────────────────────

export async function getAdminAttendanceRecap(): Promise<AttendanceRecapRow[]> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: schedules, error },
    { data: classes },
    { data: mentors },
    { data: packages },
    { data: enrollments },
    { data: students },
    { data: parents },
    { data: packageClasses },
    { data: studentAttendance },
    { data: mentorAttendance },
  ] = await Promise.all([
    supabase.from("schedules").select("id, class_id, package_id, mentor_id, starts_at, ends_at").order("starts_at", { ascending: false }),
    supabase.from("classes").select("id, name"),
    supabase.from("mentors").select("id, full_name"),
    supabase.from("packages").select("id, name"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("students").select("id, full_name, parent_id, package_id"),
    supabase.from("parents").select("id, package_id"),
    supabase.from("package_classes").select("package_id, class_id"),
    supabase.from("student_attendance").select("schedule_id, student_id, status, notes"),
    supabase.from("mentor_attendance").select("schedule_id, mentor_id, status"),
  ]);

  if (error) throw new Error(error.message);

  const classNames = new Map((classes ?? []).map((x) => [x.id, x.name]));
  const mentorNames = new Map((mentors ?? []).map((x) => [x.id, x.full_name]));
  const packageNames = new Map((packages ?? []).map((x) => [x.id, x.name]));
  const studentNames = new Map((students ?? []).map((student) => [student.id, student.full_name ?? "Siswa"]));
  const studentPackages = new Map((students ?? []).map((student) => [student.id, student.package_id ?? (parents ?? []).find((parent) => parent.id === student.parent_id)?.package_id ?? null]));
  const attendanceRows = studentAttendance ?? [];
  const mentorAttendanceRows = mentorAttendance ?? [];
  const enrollmentsByClass = new Map<string, string[]>();
  const packageOptionsByClass = new Map<string, { id: string; name: string }[]>();
  const attendanceBySchedule = new Map<string, typeof attendanceRows>();
  const mentorAttendanceBySchedule = new Map<string, (typeof mentorAttendanceRows)[number]>();

  for (const enrollment of enrollments ?? []) {
    const current = enrollmentsByClass.get(enrollment.class_id) ?? [];
      current.push(enrollment.student_id);
    enrollmentsByClass.set(enrollment.class_id, current);
  }

  for (const item of packageClasses ?? []) {
    const packageId = item.package_id;
    const packageName = packageNames.get(packageId);
    if (!packageName) continue;
    const current = packageOptionsByClass.get(item.class_id) ?? [];
    if (!current.some((option) => option.id === packageId)) {
      current.push({ id: packageId, name: packageName });
    }
    packageOptionsByClass.set(item.class_id, current);
  }

  for (const enrollment of enrollments ?? []) {
    const packageId = studentPackages.get(enrollment.student_id);
    const packageName = packageId ? packageNames.get(packageId) : null;
    if (!packageId || !packageName) continue;
    const current = packageOptionsByClass.get(enrollment.class_id) ?? [];
    if (!current.some((option) => option.id === packageId)) {
      current.push({ id: packageId, name: packageName });
    }
    packageOptionsByClass.set(enrollment.class_id, current);
  }

  for (const attendance of attendanceRows) {
    const current = attendanceBySchedule.get(attendance.schedule_id) ?? [];
    current.push(attendance);
    attendanceBySchedule.set(attendance.schedule_id, current);
  }

  for (const attendance of mentorAttendanceRows) {
    mentorAttendanceBySchedule.set(`${attendance.schedule_id}:${attendance.mentor_id}`, attendance);
  }

  return (schedules ?? []).map((schedule) => {
    const studentsInClass = (enrollmentsByClass.get(schedule.class_id) ?? [])
      .filter((studentId) => !schedule.package_id || studentPackages.get(studentId) === schedule.package_id);
    const studentIdsInClass = new Set(studentsInClass);
    const records = (attendanceBySchedule.get(schedule.id) ?? []).filter((record) => studentIdsInClass.has(record.student_id));
    const count = (status: string) =>
      records.filter((r) => r.status === status).length;

    const mentorRecord = mentorAttendanceBySchedule.get(`${schedule.id}:${schedule.mentor_id}`);

    return {
      schedule_id: schedule.id,
      class_id: schedule.class_id,
      package_id: schedule.package_id ?? null,
      package_options: (packageOptionsByClass.get(schedule.class_id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      starts_at: schedule.starts_at,
      class_name: classNames.get(schedule.class_id) ?? "Kelas",
      package_name: schedule.package_id ? packageNames.get(schedule.package_id) ?? "Paket" : null,
      mentor_name: mentorNames.get(schedule.mentor_id) ?? "Mentor",
      mentor_status: mentorRecord?.status ?? "unrecorded",
      student_names: studentsInClass.map((studentId) => studentNames.get(studentId)).filter(Boolean) as string[],
      total_students: studentsInClass.length,
      count_present: count("present"),
      count_late: count("late"),
      count_excused: count("excused"),
      count_absent: count("absent"),
    };
  });
}

// ─── Mentor: only their own schedules ────────────────────────────────────────

export async function getMentorAttendanceWorkspace(
  mentorProfileId: string
): Promise<AttendanceSchedule[]> {
  const supabase = await createSupabaseServerClient();

  // Get mentor record ID from profile ID
  const { data: mentorRecord } = await supabase
    .from("mentors")
    .select("id")
    .eq("profile_id", mentorProfileId)
    .maybeSingle();

  if (!mentorRecord) return [];

  const [
    { data: schedules, error },
    { data: classes },
    { data: packages },
    { data: enrollments },
    { data: students },
    { data: parents },
    { data: studentAttendance },
    { data: mentorAttendance },
  ] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, class_id, package_id, mentor_id, starts_at, ends_at")
      .eq("mentor_id", mentorRecord.id)
      .order("starts_at", { ascending: false }),
    supabase.from("classes").select("id, name"),
    supabase.from("packages").select("id, name"),
    supabase.from("student_classes").select("class_id, student_id"),
    supabase.from("students").select("id, full_name, parent_id, package_id"),
    supabase.from("parents").select("id, package_id"),
    supabase.from("student_attendance").select("schedule_id, student_id, status, notes"),
    supabase.from("mentor_attendance").select("schedule_id, mentor_id, status"),
  ]);

  if (error) throw new Error(error.message);

  const classNames = new Map((classes ?? []).map((x) => [x.id, x.name]));
  const packageNames = new Map((packages ?? []).map((x) => [x.id, x.name]));
  const studentNames = new Map((students ?? []).map((x) => [x.id, x.full_name]));
  const studentPackages = new Map((students ?? []).map((student) => [student.id, student.package_id ?? (parents ?? []).find((parent) => parent.id === student.parent_id)?.package_id ?? null]));

  return (schedules ?? []).map((schedule) => ({
    ...schedule,
    class_name: classNames.get(schedule.class_id) ?? "Kelas",
    package_name: schedule.package_id ? packageNames.get(schedule.package_id) ?? "Paket" : null,
    students: (enrollments ?? [])
      .filter((e) => e.class_id === schedule.class_id)
      .filter((e) => !schedule.package_id || studentPackages.get(e.student_id) === schedule.package_id)
      .map((e) => {
        const saved = (studentAttendance ?? []).find(
          (a) => a.schedule_id === schedule.id && a.student_id === e.student_id
        );
        return {
          id: e.student_id,
          full_name: studentNames.get(e.student_id) ?? "Siswa",
          status: saved?.status ?? "present",
          notes: saved?.notes ?? "",
        };
      }),
    mentor_status:
      (mentorAttendance ?? []).find(
        (m) => m.schedule_id === schedule.id && m.mentor_id === schedule.mentor_id
      )?.status ?? "present",
  })) as AttendanceSchedule[];
}
