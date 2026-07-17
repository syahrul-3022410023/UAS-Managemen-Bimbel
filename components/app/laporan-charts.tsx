"use client";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// ─── Currency formatter ───────────────────────────────────────────────────────
function formatRp(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ─── Absensi Bar Chart ────────────────────────────────────────────────────────

type AbsensiPoint = {
  tanggal: string;
  hadir: number;
  tidak_hadir: number;
  izin: number;
};

export function AbsensiBarChart({ data }: { data: AbsensiPoint[] }) {
  if (!data.length)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Tidak ada data absensi pada periode ini
      </div>
    );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #e2e8f0" }}
          formatter={(v, name) => [v, name === "hadir" ? "Hadir" : name === "izin" ? "Izin/Sakit" : "Tidak Hadir"]}
          labelFormatter={(l) => `Tanggal: ${l}`}
        />
        <Legend formatter={(v) => v === "hadir" ? "Hadir" : v === "izin" ? "Izin/Sakit" : "Tidak Hadir"} />
        <Bar dataKey="hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="izin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="tidak_hadir" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Pembayaran Line Chart ────────────────────────────────────────────────────

type PembayaranPoint = {
  bulan: string;
  pendapatan: number;
  jumlah_transaksi: number;
};

export function PembayaranLineChart({ data }: { data: PembayaranPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
        />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #e2e8f0" }}
          formatter={(v, name) =>
            name === "pendapatan" ? [formatRp(Number(v)), "Pendapatan"] : [v, "Transaksi"]
          }
        />
        <Legend formatter={(v) => v === "pendapatan" ? "Pendapatan" : "Jumlah Transaksi"} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="pendapatan"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#6366f1" }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="jumlah_transaksi"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: "#10b981" }}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
