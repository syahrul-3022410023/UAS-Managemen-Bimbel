"use client";

import {
  BarChart, Bar, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
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
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Tidak ada data absensi pada periode ini
      </div>
    );
  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-50/70 to-white px-2 pb-2 pt-4">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 px-2">
        <ChartPill color="bg-emerald-500" label="Hadir" />
        <ChartPill color="bg-amber-400" label="Izin/Sakit" />
        <ChartPill color="bg-red-400" label="Tidak Hadir" />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={8} barCategoryGap="32%" margin={{ top: 8, right: 18, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="hadirGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="izinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="absenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ECEEF5" strokeDasharray="4 8" />
          <XAxis
            dataKey="tanggal"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8A96AA", fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8A96AA", fontWeight: 600 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(57, 71, 255, 0.045)", radius: 16 }}
            content={<AbsensiTooltip />}
          />
          <Bar dataKey="hadir" fill="url(#hadirGrad)" radius={[12, 12, 4, 4]} maxBarSize={42} />
          <Bar dataKey="izin" fill="url(#izinGrad)" radius={[12, 12, 4, 4]} maxBarSize={42} />
          <Bar dataKey="tidak_hadir" fill="url(#absenGrad)" radius={[12, 12, 4, 4]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function AbsensiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const names: Record<string, string> = {
    hadir: "Hadir",
    izin: "Izin/Sakit",
    tidak_hadir: "Tidak Hadir",
  };
  const colors: Record<string, string> = {
    hadir: "#10B981",
    izin: "#F59E0B",
    tidak_hadir: "#EF4444",
  };

  return (
    <div className="min-w-[160px] rounded-2xl border border-slate-100 bg-white/95 p-3 text-xs backdrop-blur">
      <p className="mb-2 font-bold text-ink">Tanggal {label}</p>
      <div className="space-y-1.5">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[item.dataKey] ?? "#94A3B8" }} />
              {names[item.dataKey] ?? item.name}
            </span>
            <span className="font-bold text-ink">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pembayaran Line Chart ────────────────────────────────────────────────────

type PembayaranPoint = {
  bulan: string;
  pendapatan: number;
  jumlah_transaksi: number;
};

export function PembayaranLineChart({ data }: { data: PembayaranPoint[] }) {
  if (!data.length)
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Tidak ada data pembayaran pada periode ini
      </div>
    );

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-50/70 to-white px-2 pb-2 pt-4">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 px-2">
        <ChartPill color="bg-brand" label="Pendapatan" />
        <ChartPill color="bg-emerald-500" label="Jumlah Transaksi" />
      </div>
      <ResponsiveContainer width="100%" height={310}>
        <ComposedChart data={data} margin={{ top: 10, right: 18, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="pendapatanLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="pendapatanArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ECEEF5" strokeDasharray="4 8" />
          <XAxis
            dataKey="bulan"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8A96AA", fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8A96AA", fontWeight: 600 }}
            tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#8A96AA", fontWeight: 600 }}
            allowDecimals={false}
          />
          <Tooltip cursor={{ stroke: "#D8DCFF", strokeWidth: 1 }} content={<PembayaranTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="pendapatan"
            stroke="url(#pendapatanLine)"
            strokeWidth={3}
            fill="url(#pendapatanArea)"
            dot={{ r: 4, fill: "#ffffff", stroke: "#2563EB", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#2563EB", stroke: "#ffffff", strokeWidth: 3 }}
            isAnimationActive
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="jumlah_transaksi"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ffffff", stroke: "#10B981", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
            strokeDasharray="6 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function PembayaranTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const uniquePayload = Array.from(
    new Map(payload.map((item: any) => [String(item.dataKey ?? item.name), item])).values()
  );

  return (
    <div className="min-w-[190px] rounded-2xl border border-slate-100 bg-white/95 p-3 text-xs backdrop-blur">
      <p className="mb-2 font-bold text-ink">{label}</p>
      <div className="space-y-1.5">
        {uniquePayload.map((item: any, index) => {
          const isRevenue = item.dataKey === "pendapatan";
          return (
            <div key={`${item.dataKey ?? item.name}-${index}`} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isRevenue ? "#2563EB" : "#10B981" }} />
                {isRevenue ? "Pendapatan" : "Transaksi"}
              </span>
              <span className="font-bold text-ink">
                {isRevenue ? formatRp(Number(item.value)) : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
