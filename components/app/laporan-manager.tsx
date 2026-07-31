"use client";

import { useState } from "react";
import {
  Users, CalendarCheck, CreditCard,
  TrendingUp, CheckCircle2, XCircle,
  BarChart2, AlertCircle,
} from "lucide-react";
import { AbsensiBarChart } from "@/components/app/laporan-charts";
import { DashboardFinanceChart } from "@/components/app/dashboard-charts";
import { DataTableShell } from "@/components/app/data-table-shell";
import { EmptyStateRow } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { AppSelect } from "@/components/app/app-select";
import type {
  LaporanSiswaRow,
  LaporanAbsensiResult,
  LaporanPembayaranResult,
} from "@/lib/laporan/data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v);
}

function StatCard({
  label, value, sub, color = "brand",
}: {
  label: string; value: string; sub?: string; color?: "brand" | "emerald" | "amber" | "red";
}) {
  const tone = color === "emerald" ? "income" : color === "amber" ? "balance" : color === "red" ? "expense" : "payroll";
  const icon = label.includes("Pembayaran") || label.includes("Penerimaan") || label.includes("Pendapatan") ? CreditCard
    : label.includes("Absensi") || label.includes("Hadir") || label.includes("Sesi") ? CalendarCheck
    : label.includes("Tidak") || label.includes("Belum") ? AlertCircle
    : Users;

  return <KpiCard icon={icon} label={label} value={value} detail={sub ?? ""} tone={tone} />;
}

// ─── Tab: Laporan Siswa ───────────────────────────────────────────────────────

function TabSiswa({ rows }: { rows: LaporanSiswaRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const avgHadir =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.persentase, 0) / rows.length)
      : 0;
  const siswaAktif = rows.filter((r) => r.total_sesi > 0).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Siswa" value={String(rows.length)} sub="Terdaftar di sistem" />
        <StatCard label="Siswa Aktif" value={String(siswaAktif)} sub="Memiliki riwayat absensi" color="emerald" />
        <StatCard label="Rata-rata Hadir" value={`${avgHadir}%`} sub="Dari seluruh sesi" color={avgHadir >= 75 ? "emerald" : "amber"} />
      </div>

      <DataTableShell
        icon={Users}
        title="Database Laporan Siswa"
        totalCount={rows.length}
        totalLabel="siswa dianalisis"
        shownCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama siswa..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[13px] text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left font-medium">Nama Siswa</th>
                <th className="px-4 py-3 text-left font-medium">Kelas / Tingkat</th>
                <th className="px-4 py-3 text-center font-medium">Total Sesi</th>
                <th className="px-4 py-3 text-center font-medium">Hadir</th>
                <th className="px-4 py-3 text-center font-medium">Tidak Hadir</th>
                <th className="px-4 py-3 text-center font-medium">Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <EmptyStateRow
                  colSpan={6}
                  icon={Users}
                  title={rows.length === 0 ? "Belum ada data siswa" : "Tidak ada hasil pencarian"}
                  description={rows.length === 0 ? "Data siswa akan muncul setelah siswa terdaftar." : "Coba ubah kata kunci pencarian."}
                />
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.kelas !== "-" ? r.kelas : "—"}{" "}
                      {r.grade !== "-" && (
                        <span className="ml-1 text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{r.grade}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{r.total_sesi}</td>
                    <td className="px-4 py-3 text-center text-emerald-600 font-medium">{r.hadir}</td>
                    <td className="px-4 py-3 text-center text-red-500">{r.tidak_hadir}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.persentase >= 75
                            ? "bg-emerald-50 text-emerald-700"
                            : r.persentase >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {r.total_sesi > 0 ? `${r.persentase}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {rows.length} siswa
          </div>
        )}
      </DataTableShell>
    </div>
  );
}

// ─── Tab: Laporan Absensi ─────────────────────────────────────────────────────

function TabAbsensi({
  data,
  bulan,
  tahun,
  onBulan,
  onTahun,
}: {
  data: LaporanAbsensiResult;
  bulan: number;
  tahun: number;
  onBulan: (v: number) => void;
  onTahun: (v: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const monthOptions = MONTHS.map((month, index) => ({ value: index + 1, label: month }));
  const yearOptions = years.map((year) => ({ value: year, label: String(year) }));

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <AppSelect value={bulan} options={monthOptions} onChange={(value) => onBulan(Number(value))} placeholder="" className="w-44" />
        <AppSelect value={tahun} options={yearOptions} onChange={(value) => onTahun(Number(value))} placeholder="" className="w-28" />
        <span className="text-xs text-slate-400">
          Periode: {MONTHS[bulan - 1]} {tahun}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Sesi" value={String(data.totalSesi)} sub="Seluruh absensi" />
        <StatCard label="Hadir" value={String(data.totalHadir)} sub="Hadir & terlambat" color="emerald" />
        <StatCard label="Izin / Sakit" value={String(data.totalIzin)} sub="Keterangan" color="amber" />
        <StatCard label="Tidak Hadir" value={String(data.totalTidakHadir)} sub="Tanpa keterangan" color="red" />
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-apple-soft">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF0FF] text-brand">
              <BarChart2 size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Grafik Kehadiran - {MONTHS[bulan - 1]} {tahun}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Distribusi status kehadiran per tanggal.</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            {data.chart.length} tanggal
          </span>
        </div>
        <AbsensiBarChart data={data.chart} />
      </div>
    </div>
  );
}

// ─── Tab: Laporan Pembayaran ──────────────────────────────────────────────────

function TabPembayaran({
  data,
  tahun,
  onTahun,
}: {
  data: LaporanPembayaranResult;
  tahun: number;
  onTahun: (v: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const yearOptions = years.map((year) => ({ value: year, label: String(year) }));
  const financeChartData = data.chart.map((point) => ({
    month: point.bulan,
    income: point.pendapatan,
    expense: point.pengeluaran,
  }));

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <AppSelect value={tahun} options={yearOptions} onChange={(value) => onTahun(Number(value))} placeholder="" className="w-28" />
        <span className="text-xs text-slate-400">Tahun: {tahun}</span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendapatan"
          value={formatRp(data.totalPendapatan)}
          sub={`Tahun ${tahun}`}
          color="brand"
        />
        <StatCard label="Transaksi" value={String(data.totalTransaksi)} sub="Pembayaran diterima" color="emerald" />
        <StatCard label="Invoice Lunas" value={String(data.totalLunas)} sub={`dari ${data.totalInvoice} invoice`} color="emerald" />
        <StatCard label="Belum Lunas" value={String(data.totalBelumLunas)} sub="Belum dibayar" color={data.totalBelumLunas > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Penerimaan" value={formatRp(data.totalKasMasuk)} sub="SPP + kas manual" color="emerald" />
        <StatCard label="Pengeluaran" value={formatRp(data.totalKasKeluar)} sub="Payroll + kas manual" color="red" />
        <StatCard label="Saldo Bersih" value={formatRp(data.saldoKas)} sub="Penerimaan - pengeluaran" color={data.saldoKas >= 0 ? "brand" : "red"} />
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-apple-soft">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF0FF] text-brand">
              <TrendingUp size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Grafik Keuangan - Tahun {tahun}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Penerimaan dan pengeluaran bulanan.</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            {data.chart.length} bulan
          </span>
        </div>
        <DashboardFinanceChart data={financeChartData} height={300} />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#1688F0]" />Penerimaan</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#67D4FF]" />Pengeluaran</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Invoice Tahun {tahun}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Lunas</span>
                <span className="font-medium text-emerald-600">{data.totalLunas}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: data.totalInvoice > 0 ? `${(data.totalLunas / data.totalInvoice) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Belum Dibayar</span>
                <span className="font-medium text-red-600">{data.totalBelumLunas}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all"
                  style={{ width: data.totalInvoice > 0 ? `${(data.totalBelumLunas / data.totalInvoice) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "siswa" | "absensi" | "pembayaran";

type LaporanManagerProps = {
  siswadata: LaporanSiswaRow[];
  absensiData: LaporanAbsensiResult;
  pembayaranData: LaporanPembayaranResult;
  initBulan: number;
  initTahun: number;
};

export function LaporanManager({
  siswadata,
  absensiData: initAbsensi,
  pembayaranData: initPembayaran,
  initBulan,
  initTahun,
}: LaporanManagerProps) {
  const [tab, setTab] = useState<Tab>("siswa");
  const [bulan, setBulan] = useState(initBulan);
  const [tahun, setTahun] = useState(initTahun);

  // For this client component, we use the server-fetched initial data.
  // Filters trigger a page reload via URL params in a full implementation,
  // but for MVP we display the pre-fetched data and note the filter state.
  const absensiData = initAbsensi;
  const pembayaranData = initPembayaran;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "siswa", label: "Laporan Siswa", icon: Users },
    { key: "absensi", label: "Laporan Absensi", icon: CalendarCheck },
    { key: "pembayaran", label: "Laporan Pembayaran", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="app-title-primary">Laporan</h1>
          <p className="mt-1 text-sm text-slate-500">Rekap data operasional bimbel secara menyeluruh</p>
        </div>
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 custom-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === key
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner if no supabase connection */}
      {siswadata.length === 0 && tab === "siswa" && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>Belum ada data. Pastikan Supabase sudah terhubung dan data telah diinput.</span>
        </div>
      )}

      {/* Tab Content */}
      {tab === "siswa" && <TabSiswa rows={siswadata} />}
      {tab === "absensi" && (
        <TabAbsensi
          data={absensiData}
          bulan={bulan}
          tahun={tahun}
          onBulan={setBulan}
          onTahun={setTahun}
        />
      )}
      {tab === "pembayaran" && (
        <TabPembayaran
          data={pembayaranData}
          tahun={tahun}
          onTahun={setTahun}
        />
      )}
    </div>
  );
}
