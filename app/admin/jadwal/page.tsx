import { AppShell } from "@/components/app/app-shell";
import { ScheduleCalendar } from "@/components/app/schedule-calendar";
import { requireRole } from "@/lib/auth/session";
import { getScheduleWorkspace } from "../kelas/page-data";

export default async function SchedulesPage() { const user = await requireRole(["admin"]); const data = await getScheduleWorkspace(); return <AppShell role={user.role} email={user.email} name={user.name} title="Jadwal Kelas" activeNav="Jadwal"><ScheduleCalendar schedules={data.schedules} classes={data.classes} mentors={data.mentors}/></AppShell>; }
