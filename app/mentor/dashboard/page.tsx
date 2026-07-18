import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { requireRole } from "@/lib/auth/session";
import { getMentorMetrics } from "@/lib/dashboard/data";

export default async function MentorDashboardPage() {
  const user = await requireRole(["mentor"]);
  const metrics = await getMentorMetrics(user.id);
  const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  const latestSlip = metrics.latestPayroll ? `${metrics.latestPayroll.month}/${metrics.latestPayroll.year}` : "-";

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Mentor">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Jadwal Hari Ini" value={String(metrics.today)} detail="Sesi terjadwal" />
        <SummaryCard label="Kelas Aktif" value={String(metrics.classes)} detail="Kelas yang diampu" />
        <SummaryCard label="Siswa" value={String(metrics.students)} detail="Siswa aktif di kelas" />
        <SummaryCard label="Slip Terbaru" value={latestSlip} detail={metrics.latestPayroll ? `Nominal ${formatRp(metrics.latestPayroll.total_amount)}` : "Belum ada slip"} />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-ink">Jadwal Mengajar Terdekat</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {metrics.upcomingSchedules.map((schedule) => (
            <div key={schedule.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)_220px] sm:items-center">
              <div>
                <p className="text-sm font-bold text-ink">{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(schedule.starts_at))}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(schedule.starts_at))} - {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(schedule.ends_at))}</p>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{schedule.subject_name}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{schedule.class_name}{schedule.room ? ` - ${schedule.room}` : ""}</p>
              </div>
              <p className="text-sm text-slate-600">{schedule.student_names.length ? schedule.student_names.join(", ") : "-"}</p>
            </div>
          ))}
          {metrics.upcomingSchedules.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-500">Belum ada jadwal mengajar terdekat.</div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
