import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { getParentScope } from "@/lib/parents/scope";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ParentAttendanceView } from "@/components/app/parent-attendance-view";

export const dynamic = "force-dynamic";

export default async function ParentAttendancePage() {
  const user = await requireRole(["parent"]);
  const supabase = await createSupabaseServerClient();

  const { parent, parentIds } = await getParentScope(supabase, user.id);

  if (!parent) {
    return (
      <AppShell role={user.role} email={user.email} name={user.name} title="Absensi Anak" activeNav="Absensi">
        <div className="mb-8">
          <h1 className="app-title-primary">Riwayat Absensi Anak</h1>
          <p className="mt-1 text-sm text-slate-500">Pantau kehadiran anak pada setiap sesi bimbingan.</p>
        </div>
        <p className="text-sm text-slate-400">Data orang tua tidak ditemukan.</p>
      </AppShell>
    );
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("parent_id", parentIds);

  const childIds = (students ?? []).map((student) => student.id);
  const childNames = new Map((students ?? []).map((student) => [student.id, student.full_name]));

  if (!childIds.length) {
    return (
      <AppShell role={user.role} email={user.email} name={user.name} title="Absensi Anak" activeNav="Absensi">
        <div className="mb-8">
          <h1 className="app-title-primary">Riwayat Absensi Anak</h1>
          <p className="mt-1 text-sm text-slate-500">Pantau kehadiran anak pada setiap sesi bimbingan.</p>
        </div>
        <p className="text-sm text-slate-400">Belum ada data siswa yang terdaftar untuk akun ini.</p>
      </AppShell>
    );
  }

  const [
    { data: attendance },
    { data: schedules },
    { data: classes },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("student_attendance")
      .select("student_id, schedule_id, status, notes, recorded_at")
      .in("student_id", childIds)
      .order("recorded_at", { ascending: false }),
    supabase.from("schedules").select("id, class_id, starts_at, classes(name)"),
    supabase.from("classes").select("id, name"),
    supabase.from("student_classes").select("student_id, class_id").in("student_id", childIds),
  ]);

  const scheduleMap = new Map((schedules ?? []).map((schedule) => [schedule.id, schedule]));
  const classMap = new Map((classes ?? []).map((classRow) => [classRow.id, classRow.name]));
  const childClassIds = new Set((enrollments ?? []).map((item) => item.class_id));

  const rows = (attendance ?? []).map((item) => {
    const schedule = scheduleMap.get(item.schedule_id ?? "");
    const joinedClass = (schedule as any)?.classes as { name?: string | null } | null;
    const className = schedule
      ? joinedClass?.name ?? classMap.get(schedule.class_id) ?? (childClassIds.has(schedule.class_id) ? "Kelas Anak" : "-")
      : "-";
    const sessionDate = schedule ? new Date(schedule.starts_at) : null;

    return {
      student_name: childNames.get(item.student_id) ?? "Siswa",
      class_name: className,
      session_date: sessionDate,
      recorded_at: item.recorded_at ? new Date(item.recorded_at) : null,
      status: item.status as string,
      notes: item.notes as string | null,
    };
  });

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Absensi Anak" activeNav="Absensi">
      <ParentAttendanceView rows={rows} children={(students ?? []).map((student) => student.full_name)} />
    </AppShell>
  );
}
