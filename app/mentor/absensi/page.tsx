import { AppShell } from "@/components/app/app-shell";
import { AttendanceManager } from "@/components/app/attendance-manager";
import { requireRole } from "@/lib/auth/session";
import { getMentorAttendanceWorkspace } from "@/app/attendance/page-data";

export default async function MentorAttendancePage() {
  const user = await requireRole(["mentor"]);
  const schedules = await getMentorAttendanceWorkspace(user.id);
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Absensi" activeNav="Absensi">
      <AttendanceManager schedules={schedules} />
    </AppShell>
  );
}
