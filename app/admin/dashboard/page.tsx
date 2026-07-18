import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { requireRole } from "@/lib/auth/session";
import { getAdminMetrics } from "@/lib/dashboard/data";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Layers,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

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

  const operations = [
    { label: "Siswa", value: metrics.students, detail: "Data siswa aktif", color: "from-[#3947FF] to-[#7771FF]" },
    { label: "Mentor", value: metrics.mentors, detail: "Pengajar terdaftar", color: "from-[#10B981] to-[#34D399]" },
    { label: "Kelas", value: metrics.classes, detail: "Kelas berjalan", color: "from-[#8B5CF6] to-[#A78BFA]" },
    { label: "Absensi", value: metrics.attendance, detail: "Record presensi", color: "from-[#0EA5E9] to-[#38BDF8]" },
  ];
  const maxOperation = Math.max(...operations.map((item) => item.value), 1);

  const quickActions = [
    {
      title: "Invoice SPP",
      detail: "Generate dan kelola tagihan SPP siswa",
      href: "/admin/invoice",
      icon: ReceiptText,
      tone: "bg-[#EEF0FF] text-brand",
    },
    {
      title: "Rekap Pembayaran",
      detail: "Pantau transaksi pembayaran masuk",
      href: "/admin/pembayaran",
      icon: CreditCard,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Kelola Jadwal",
      detail: "Atur sesi belajar dan mentor",
      href: "/admin/jadwal",
      icon: CalendarDays,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      title: "Manajemen Kelas",
      detail: "Susun kelas, siswa, dan mentor",
      href: "/admin/kelas",
      icon: Layers,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Admin">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overview</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan operasional bimbel hari ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-brand"
          >
            Laporan <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/admin/jadwal"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brandHover"
          >
            Jadwal <CalendarDays size={14} />
          </Link>
        </div>
      </div>

      {metrics.unpaidInvoices > 0 && (
        <Link
          href="/admin/invoice"
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 transition hover:bg-red-100"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Kas Masuk" value={formatCurrency(metrics.totalCashIn)} detail="SPP dan pemasukan kas" />
        <SummaryCard label="Total Kas Keluar" value={formatCurrency(metrics.totalCashOut)} detail="Payroll dan pengeluaran" />
        <SummaryCard label="Saldo Kas" value={formatCurrency(metrics.cashBalance)} detail="Kas masuk dikurangi keluar" />
        <SummaryCard label="Payroll Bulan Ini" value={formatCurrency(metrics.payrollThisMonth)} detail="Estimasi gaji mentor" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink">Aktivitas Operasional</h2>
              <p className="mt-1 text-xs text-slate-500">Perbandingan data inti bimbel.</p>
            </div>
            <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Real-time
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50/70 to-white p-5">
              <div className="pointer-events-none absolute inset-x-5 top-10 bottom-16 flex flex-col justify-between">
                {[0, 1, 2, 3].map((line) => (
                  <span key={line} className="border-t border-dashed border-slate-200/80" />
                ))}
              </div>
              <div className="relative flex h-64 items-end justify-around gap-4 pb-8 pt-8">
                {operations.map((item) => {
                  const height = Math.max(14, Math.round((item.value / maxOperation) * 100));
                  return (
                    <div key={item.label} className="group flex min-w-0 flex-1 flex-col items-center">
                      <div className="mb-3 rounded-full border border-slate-100 bg-white px-2.5 py-1 text-xs font-bold text-ink opacity-0 transition group-hover:opacity-100">
                        {item.value}
                      </div>
                      <div className="flex h-40 w-full max-w-[52px] items-end rounded-[18px] border border-slate-100 bg-white p-1.5">
                        <div
                          className={`w-full rounded-[14px] bg-gradient-to-t ${item.color} transition-all duration-500 group-hover:brightness-105`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {operations.map((item) => {
                const width = Math.max(8, Math.round((item.value / maxOperation) * 100));
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.detail}</p>
                      </div>
                      <span className="text-sm font-bold text-ink">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Invoice perlu tindakan" value={String(metrics.unpaidInvoices)} />
            <MiniStat label="Pendapatan bulan ini" value={formatCurrency(metrics.revenueThisMonth)} />
            <MiniStat label="Saldo kas berjalan" value={formatCurrency(metrics.cashBalance)} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Pendapatan Bulan Ini</p>
              <h2 className="mt-2 text-3xl font-bold text-ink">{formatCurrency(metrics.revenueThisMonth)}</h2>
              <p className="mt-1 text-xs font-semibold text-emerald-600">Total pembayaran diterima</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-brand">
              <TrendingUp size={18} />
            </div>
          </div>

          <svg className="mt-7 h-36 w-full overflow-visible rounded-3xl bg-gradient-to-b from-slate-50/80 to-white p-3" viewBox="0 0 280 130" fill="none" aria-hidden="true">
            <path d="M10 96 C36 72 52 80 72 58 C96 31 118 46 142 40 C170 32 186 16 214 34 C240 51 254 30 270 22" stroke="#3947FF" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 96 C36 72 52 80 72 58 C96 31 118 46 142 40 C170 32 186 16 214 34 C240 51 254 30 270 22 V120 H10 Z" fill="url(#revenueFill)" />
            <circle cx="270" cy="22" r="5" fill="#3947FF" stroke="white" strokeWidth="4" />
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="110">
                <stop stopColor="#3947FF" stopOpacity="0.18" />
                <stop offset="1" stopColor="#3947FF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Status Invoice</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${metrics.unpaidInvoices > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {metrics.unpaidInvoices > 0 ? "Perlu follow-up" : "Terkendali"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {metrics.unpaidInvoices > 0
                ? `${metrics.unpaidInvoices} invoice SPP belum lunas.`
                : "Tidak ada invoice tertunggak saat ini."}
            </p>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-ink">Workflow Cepat</h2>
            <p className="mt-1 text-xs text-slate-500">Akses modul operasional yang paling sering dipakai.</p>
          </div>
          <Link href="/admin/laporan" className="text-xs font-bold text-brand hover:underline">
            Laporan
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                </div>
                <ArrowUpRight size={16} className="text-slate-300" />
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
