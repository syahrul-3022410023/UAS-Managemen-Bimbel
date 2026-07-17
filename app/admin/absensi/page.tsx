import { AppShell } from "@/components/app/app-shell";
import { AttendanceRecap } from "@/components/app/attendance-recap";
import { requireRole } from "@/lib/auth/session";
import { getAdminAttendanceRecap } from "@/app/attendance/page-data";

export default async function AdminAttendancePage() {
  const user = await requireRole(["admin"]);
  const rows = await getAdminAttendanceRecap();
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Absensi" activeNav="Absensi">
      <AttendanceRecap rows={rows} />
    </AppShell>
  );
}
