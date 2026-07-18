"use client";

import { useState } from "react";
import {
  Users, CalendarCheck, CreditCard,
  TrendingUp, CheckCircle2, XCircle,
  BarChart2, AlertCircle,
} from "lucide-react";
import { AbsensiBarChart, PembayaranLineChart } from "@/components/app/laporan-charts";
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
  const bg = {
    brand: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  }[color];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${bg.split(" ")[1]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
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
        <StatCard label="Total Siswa" value={String(rows.length)} sub="Terdaftar di sistem" />
        <StatCard label="Siswa Aktif" value={String(siswaAktif)} sub="Memiliki riwayat absensi" color="emerald" />
        <StatCard label="Rata-rata Kehadiran" value={`${avgHadir}%`} sub="Dari seluruh sesi" color={avgHadir >= 75 ? "emerald" : "amber"} />
      </div>

      {/* Search + Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <Users size={16} className="text-slate-400" />
          <h3 className="font-semibold text-slate-700 text-sm">Detail Per Siswa</h3>
          <div className="ml-auto">
            <input
              type="text"
              placeholder="Cari nama siswa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Nama Siswa</th>
                <th className="px-4 py-3 text-left font-medium">Kelas / Tingkat</th>
                <th className="px-4 py-3 text-center font-medium">Total Sesi</th>
                <th className="px-4 py-3 text-center font-medium">Hadir</th>
                <th className="px-4 py-3 text-center font-medium">Tidak Hadir</th>
                <th className="px-4 py-3 text-center font-medium">Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {rows.length === 0 ? "Belum ada data siswa" : "Tidak ada hasil pencarian"}
                  </td>
                </tr>
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
      </div>
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

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={bulan}
          onChange={(e) => onBulan(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={tahun}
          onChange={(e) => onTahun(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-xs text-slate-400">
          Periode: {MONTHS[bulan - 1]} {tahun}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Sesi" value={String(data.totalSesi)} sub="Seluruh absensi" />
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

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={tahun}
          onChange={(e) => onTahun(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-xs text-slate-400">Tahun: {tahun}</span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Pendapatan"
          value={formatRp(data.totalPendapatan)}
          sub={`Tahun ${tahun}`}
          color="brand"
        />
        <StatCard label="Total Transaksi" value={String(data.totalTransaksi)} sub="Pembayaran diterima" color="emerald" />
        <StatCard label="Invoice Lunas" value={String(data.totalLunas)} sub={`dari ${data.totalInvoice} invoice`} color="emerald" />
        <StatCard label="Belum Lunas" value={String(data.totalBelumLunas)} sub="Belum dibayar" color={data.totalBelumLunas > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Kas Masuk" value={formatRp(data.totalKasMasuk)} sub="SPP + pemasukan arus kas" color="emerald" />
        <StatCard label="Kas Keluar" value={formatRp(data.totalKasKeluar)} sub="Payroll + pengeluaran arus kas" color="red" />
        <StatCard label="Saldo Kas" value={formatRp(data.saldoKas)} sub="Rekap laporan keuangan" color={data.saldoKas >= 0 ? "brand" : "red"} />
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
                Grafik Pendapatan - Tahun {tahun}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Tren pendapatan dan jumlah transaksi bulanan.</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            {data.chart.length} bulan
          </span>
        </div>
        <PembayaranLineChart data={data.chart} />
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan</h1>
        <p className="text-sm text-slate-500 mt-1">Rekap data operasional bimbel secara menyeluruh</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full max-w-full overflow-x-auto custom-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
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
