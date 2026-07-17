import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { requireRole } from "@/lib/auth/session";
import { getAdminMetrics } from "@/lib/dashboard/data";
import Link from "next/link";
import { AlertCircle, TrendingUp, ReceiptText } from "lucide-react";

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

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Dashboard Admin">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Selamat Datang, Admin 👋
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan operasional bimbel hari ini.
        </p>
      </div>

      {/* Quick Alert: Unpaid Invoices */}
      {metrics.unpaidInvoices > 0 && (
        <Link
          href="/admin/invoice"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 hover:bg-red-100 transition"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>
            Terdapat <strong>{metrics.unpaidInvoices} invoice</strong> yang belum lunas.{" "}
            <span className="underline">Lihat invoice →</span>
          </span>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Siswa Aktif" value={String(metrics.students)} detail="Data siswa terdaftar" />
        <SummaryCard label="Mentor" value={String(metrics.mentors)} detail="Data mentor terdaftar" />
        <SummaryCard label="Kelas" value={String(metrics.classes)} detail="Kelas aktif" />
        <SummaryCard label="Absensi Tercatat" value={String(metrics.attendance)} detail="Total kehadiran siswa" />
        <SummaryCard
          label="Invoice Belum Lunas"
          value={String(metrics.unpaidInvoices)}
          detail="Belum dibayar / sebagian"
        />
        <SummaryCard
          label="Pendapatan Bulan Ini"
          value={formatCurrency(metrics.revenueThisMonth)}
          detail="Total pembayaran diterima"
        />
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/invoice"
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft hover:shadow-md transition group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
            <ReceiptText size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Manajemen Invoice</p>
            <p className="text-sm text-slate-500">Generate & kelola tagihan siswa</p>
          </div>
        </Link>
        <Link
          href="/admin/pembayaran"
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft hover:shadow-md transition group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Rekap Pembayaran</p>
            <p className="text-sm text-slate-500">Riwayat seluruh transaksi masuk</p>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
