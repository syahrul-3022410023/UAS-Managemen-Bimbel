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
        <SummaryCard label="Jadwal Hari Ini" value={String(metrics.today)} detail="Sesi yang dijadwalkan" />
        <SummaryCard label="Kelas Aktif" value={String(metrics.classes)} detail="Kelas yang diampu" />
        <SummaryCard label="Slip Gaji Terbaru" value={latestSlip} detail={metrics.latestPayroll ? formatRp(metrics.latestPayroll.total_amount) : "Belum ada slip"} />
        <SummaryCard label="Pendapatan Bulan Ini" value={formatRp(metrics.incomeThisMonth)} detail="Berdasarkan payroll bulan berjalan" />
      </div>
    </AppShell>
  );
}
