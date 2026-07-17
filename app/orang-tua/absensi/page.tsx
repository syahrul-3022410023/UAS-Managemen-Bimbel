import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ParentAttendanceView } from "@/components/app/parent-attendance-view";

export default async function ParentAttendancePage() {
  const user = await requireRole(["parent"]);
  const supabase = await createSupabaseServerClient();

  // 1. Get parent record from profile
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

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

  // 2. Get children of this parent
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("parent_id", parent.id);

  const childIds = (students ?? []).map((s) => s.id);
  const childNames = new Map((students ?? []).map((s) => [s.id, s.full_name]));

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

  // 3. Get attendance records only for this parent's children + schedule info
  const [
    { data: attendance },
    { data: schedules },
    { data: classes },
  ] = await Promise.all([
    supabase
      .from("student_attendance")
      .select("student_id, schedule_id, status, notes, recorded_at")
      .in("student_id", childIds)
      .order("recorded_at", { ascending: false }),
    supabase.from("schedules").select("id, class_id, starts_at"),
    supabase.from("classes").select("id, name"),
  ]);

  const scheduleMap = new Map((schedules ?? []).map((s) => [s.id, s]));
  const classMap = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const rows = (attendance ?? []).map((item) => {
    const schedule = scheduleMap.get(item.schedule_id ?? "");
    const className = schedule ? classMap.get(schedule.class_id) ?? "—" : "—";
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
      <ParentAttendanceView rows={rows} children={(students ?? []).map((s) => s.full_name)} />
    </AppShell>
  );
}
