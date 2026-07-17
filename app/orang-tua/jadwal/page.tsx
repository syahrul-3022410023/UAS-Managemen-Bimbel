import { AppShell } from "@/components/app/app-shell";
import { ReadonlyCalendar } from "@/components/app/readonly-calendar";
import { requireRole } from "@/lib/auth/session";
import { getParentSchedules } from "./page-data";
import { CalendarDays } from "lucide-react";

export default async function ParentSchedulePage() {
  const user = await requireRole(["parent"]);
  const schedules = await getParentSchedules(user.id);

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Jadwal Anak" activeNav="Jadwal Anak">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-title-primary">Jadwal Anak</h1>
          <p className="mt-1 text-sm text-slate-500">Lihat jadwal kelas dan kegiatan belajar anak Anda.</p>
        </div>
      </div>

      {schedules.length > 0 ? (
        <ReadonlyCalendar schedules={schedules} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays size={32} className="mx-auto mb-3 text-slate-300" />
          <h2 className="text-lg font-bold text-ink">Belum ada jadwal</h2>
          <p className="text-sm text-slate-500 mt-1">Anak Anda belum memiliki jadwal kelas apa pun saat ini.</p>
        </div>
      )}
    </AppShell>
  );
}
