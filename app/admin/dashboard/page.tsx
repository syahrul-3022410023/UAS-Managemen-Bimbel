import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { getAdminMetrics } from "@/lib/dashboard/data";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  History,
  Layers,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardFinanceOverview, DashboardStudentClassChart } from "@/components/app/dashboard-charts";
import { KpiCard } from "@/components/app/kpi-card";

export const metadata = {
  title: "Dashboard Admin | BimbelPro",
};

export default async function AdminDashboardPage() {
  const user = await requireRole(["admin"]);
  const metrics = await getAdminMetrics();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const quickActions = [
    {
      title: "Invoice SPP",
      detail: "Generate dan kelola tagihan SPP siswa",
      href: "/admin/invoice",
      icon: ReceiptText,
      tone: "bg-[#EEF0FF] text-brand",
    },
    {
      title: "Laporan Keuangan",
      detail: "Pantau pembayaran masuk dan arus kas",
      href: "/admin/laporan",
      icon: TrendingUp,
      tone: "bg-[#EAF9FF] text-[#0891B2]",
    },
    {
      title: "Kelola Jadwal",
      detail: "Atur sesi belajar dan mentor",
      href: "/admin/jadwal",
      icon: CalendarDays,
      tone: "bg-[#EAF4FF] text-[#1688F0]",
    },
    {
      title: "Manajemen Kelas",
      detail: "Susun kelas, siswa, dan mentor",
      href: "/admin/kelas",
      icon: Layers,
      tone: "bg-[#EEF2FF] text-[#4F63F6]",
    },
  ];

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Admin" activeNav="Dashboard">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="app-title-primary">Dashboard Admin</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/laporan"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F4F7FB] px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-[#EEF2FF] hover:text-brand"
            >
              Laporan <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/admin/jadwal"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-medium text-white transition hover:bg-brandHover"
            >
              Jadwal <CalendarDays size={14} />
            </Link>
          </div>
        </div>

        <section className="rounded-[20px] bg-white p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Ringkasan Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Ringkasan operasional dan keuangan bimbel hari ini.</p>
          </div>

          <div className="mt-4 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={CircleDollarSign}
              label="Penerimaan"
              value={formatCurrency(metrics.totalCashIn)}
              detail={`SPP ${formatCurrency(metrics.paymentIncome)} + kas manual ${formatCurrency(metrics.cashIncome)}`}
              tone="income"
            />
            <MetricCard
              icon={ReceiptText}
              label="Pengeluaran"
              value={formatCurrency(metrics.totalCashOut)}
              detail={`Payroll ${formatCurrency(metrics.paidPayrollExpense)} + kas manual ${formatCurrency(metrics.cashExpense)}`}
              tone="expense"
            />
            <MetricCard
              icon={Banknote}
              label="Saldo Bersih"
              value={formatCurrency(metrics.cashBalance)}
              detail="Penerimaan - pengeluaran"
              tone="balance"
            />
            <MetricCard
              icon={WalletCards}
              label="Payroll Bulan Ini"
              value={formatCurrency(metrics.payrollThisMonth)}
              detail="Total payroll periode ini"
              tone="payroll"
            />
          </div>
        </section>

        {metrics.unpaidInvoices > 0 && (
          <Link
            href="/admin/invoice"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#EEF2FF] px-4 py-3 text-sm text-[#4F63F6] transition hover:bg-[#E7ECFF]"
          >
            <span className="inline-flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>
                <strong>{metrics.unpaidInvoices} invoice</strong> belum lunas.
              </span>
            </span>
            <span className="text-xs font-bold">Lihat</span>
          </Link>
        )}

        <div className="grid w-full items-stretch gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
          <section className="flex min-h-[420px] flex-col overflow-hidden rounded-[20px] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.035)] sm:p-6">
            <DashboardFinanceOverview data={metrics.financeTrend} height={270} />
          </section>

          <section className="flex min-h-[420px] flex-col rounded-[20px] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-normal text-ink">Siswa & Kelas</h2>
                <p className="mt-1 text-xs text-slate-500">Ringkasan operasional aktif</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <DashboardStudentClassChart
                height={270}
                data={[
                  { name: "Siswa", value: metrics.students, color: "#1688F0" },
                  { name: "Kelas", value: metrics.classes, color: "#4F63F6" },
                ]}
              />
            </div>
          </section>
        </div>

        <div className="grid w-full items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-[320px] flex-col rounded-[20px] bg-white p-4 sm:p-5 xl:h-[420px]">
            <div className="shrink-0 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">Aktivitas</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">Riwayat Aktivitas</h2>
                <p className="mt-1 text-xs text-slate-500">Aktivitas keuangan terbaru yang sudah tercatat.</p>
              </div>
              <span className="rounded-full bg-[#F4F7FB] px-2.5 py-1 text-xs font-medium text-slate-500">
                {metrics.financeActivities.length} terbaru
              </span>
            </div>

            {metrics.financeActivities.length > 0 ? (
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2.5">
                  {metrics.financeActivities.map((activity) => (
                    <div key={activity.id} className="flex min-h-[82px] items-center gap-3 rounded-2xl bg-[#F8FAFE] px-4 py-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.type === "income" ? "bg-[#EAFBF4] text-[#0F9F6E]" : "bg-[#EEF2FF] text-[#4F63F6]"}`}>
                        {activity.type === "income" ? <TrendingUp size={18} /> : <ReceiptText size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{activity.title}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{activity.detail}</p>
                          </div>
                          <p className={`shrink-0 text-sm font-semibold ${activity.type === "income" ? "text-[#0F9F6E]" : "text-[#4F63F6]"}`}>
                            {activity.type === "income" ? "+" : "-"}{formatCurrency(activity.amount)}
                          </p>
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-slate-400">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFE] px-6 py-10 text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 ring-1 ring-slate-100">
                    <History size={22} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink">Belum ada riwayat aktivitas</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Aktivitas akan muncul setelah pembayaran, kas, atau payroll dicatat.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="grid min-h-[320px] gap-4 xl:h-[420px]">
            <section className="flex h-full flex-col rounded-[20px] bg-white">
              <div className="shrink-0 px-5 py-4">
                <h2 className="text-base font-semibold text-ink">Workflow Cepat</h2>
                <p className="mt-1 text-xs text-slate-500">Akses modul operasional yang paling sering dipakai.</p>
              </div>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-[#F8FAFE]">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-300" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>

      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "income" | "expense" | "balance" | "payroll";
}) {
  return <KpiCard icon={Icon} label={label} value={value} detail={detail} tone={tone} />;
}
