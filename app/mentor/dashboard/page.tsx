import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { requireRole } from "@/lib/auth/session";
import { getMentorMetrics } from "@/lib/dashboard/data";

export default async function MentorDashboardPage() {
  const user = await requireRole(["mentor"]);
  const metrics = await getMentorMetrics(user.id);

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Mentor">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Jadwal Hari Ini" value={String(metrics.today)} detail="Sesi yang dijadwalkan" />
        <SummaryCard label="Kelas Aktif" value={String(metrics.classes)} detail="Kelas yang diampu" />
        <SummaryCard label="Absensi Hari Ini" value={String(metrics.attendance)} detail="Kehadiran tercatat" />
        <SummaryCard label="Evaluasi Belum Diisi" value="0" detail="Menunggu modul evaluasi" />
      </div>
    </AppShell>
  );
}
