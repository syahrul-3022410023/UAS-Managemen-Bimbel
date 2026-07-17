import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { requireRole } from "@/lib/auth/session";
import { getParentMetrics } from "@/lib/dashboard/data";
import { Users, CalendarDays, CheckCircle2, TrendingUp } from "lucide-react";

export default async function ParentDashboardPage() {
  const user = await requireRole(["parent"]);
  const metrics = await getParentMetrics(user.id);

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Orang Tua">

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <SummaryCard label="Status Pembayaran" value={metrics.paymentStatus} detail={metrics.paymentDetail} />
        <SummaryCard label="Jadwal Anak Hari Ini" value={String(metrics.schedule)} detail={`${metrics.children} anak terdaftar`} />
        <SummaryCard label="Kehadiran Anak" value={metrics.attendance} detail="Akumulasi kehadiran" />
        <SummaryCard label="Nilai Terbaru" value="-" detail="Menunggu modul evaluasi" />
      </div>

      {/* Children Detail Section */}
      {metrics.childrenDetail.length > 0 && (
        <section className="rounded-2xl border border-slate-100 bg-white shadow-apple-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-ink">Data Anak Terdaftar</h2>
            <p className="text-sm text-slate-500 mt-0.5">Ringkasan kehadiran setiap anak</p>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.childrenDetail.map((child) => {
              const pct = child.total > 0 ? Math.round((child.present / child.total) * 100) : null;
              const barColor =
                pct === null ? "bg-slate-200"
                : pct >= 80 ? "bg-emerald-500"
                : pct >= 60 ? "bg-amber-500"
                : "bg-red-500";

              return (
                <div key={child.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-sm">
                    {child.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{child.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {child.total === 0
                        ? "Belum ada data absensi"
                        : `${child.present} hadir dari ${child.total} sesi`}
                    </p>
                    {/* Progress bar */}
                    {child.total > 0 && (
                      <div className="mt-2 h-1.5 w-full max-w-[200px] rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Percentage */}
                  <div className="text-right shrink-0">
                    <span className={`text-lg font-bold ${
                      pct === null ? "text-slate-400"
                      : pct >= 80 ? "text-emerald-600"
                      : pct >= 60 ? "text-amber-600"
                      : "text-red-500"
                    }`}>
                      {pct !== null ? `${pct}%` : "—"}
                    </span>
                    <p className="text-xs text-slate-400">kehadiran</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {metrics.childrenDetail.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">Belum ada data anak yang terdaftar untuk akun ini.</p>
        </div>
      )}
    </AppShell>
  );
}
