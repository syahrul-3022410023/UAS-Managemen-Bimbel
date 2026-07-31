"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OperationPoint = {
  name: string;
  value: number;
  color: string;
};

type FinancePoint = {
  month: string;
  income: number;
  expense: number;
};

const demoRevenueData = [
  { month: "Jan", income: 35, expense: 20 },
  { month: "Feb", income: 48, expense: 26 },
  { month: "Mar", income: 40, expense: 22 },
  { month: "Apr", income: 62, expense: 31 },
  { month: "Mei", income: 55, expense: 29 },
  { month: "Jun", income: 70, expense: 36 },
  { month: "Jul", income: 88, expense: 42 },
];

function formatRupiahTick(value: number) {
  if (value <= 0) return "Rp 0";
  if (value >= 1_000_000) return `Rp ${Math.round(value / 1_000_000)}jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
  return `Rp ${value}`;
}

function roundUpTick(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / power) * power;
}

function FinanceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const names: Record<string, string> = {
    income: "Penerimaan",
    expense: "Pengeluaran",
  };

  const colors: Record<string, string> = {
    income: "#1688F0",
    expense: "#67D4FF",
  };

  return (
    <div className="min-w-[190px] rounded-2xl border border-slate-100 bg-white/95 p-3 text-xs shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
      <p className="mb-2 font-semibold text-ink">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-5">
            <span className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[item.dataKey] ?? "#94A3B8" }} />
              {names[item.dataKey] ?? item.name}
            </span>
            <span className="font-semibold text-ink">{formatRupiahTick(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentClassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 text-xs shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-slate-500">{payload[0].value} data aktif</p>
    </div>
  );
}

export function DashboardFinanceChart({ data, height = 220 }: { data: FinancePoint[]; height?: number }) {
  const isEmpty = data.every((item) => item.income === 0 && item.expense === 0);
  const maxAmount = roundUpTick(Math.max(...data.flatMap((item) => [item.income, item.expense]), 0));
  const lastPoint = data.at(-1);

  return (
    <div className="relative h-full min-h-[232px] w-full overflow-hidden pb-1">
      <ResponsiveContainer width="100%" height={Math.max(height, 224)}>
        <AreaChart data={data} margin={{ top: 22, right: 12, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id="dashboardIncomeLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="dashboardIncomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1688F0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1688F0" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="dashboardExpenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67D4FF" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#67D4FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E7EDF7" strokeDasharray="0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748B", fontWeight: 500 }}
            dy={12}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#48617F", fontWeight: 500 }}
            tickFormatter={formatRupiahTick}
            domain={[0, maxAmount]}
            width={68}
          />
          <Tooltip cursor={{ stroke: "#94A3B8", strokeDasharray: "3 4" }} content={<FinanceTooltip />} />
          <Area
            type="monotone"
            dataKey="expense"
            fill="url(#dashboardExpenseFill)"
            stroke="#67D4FF"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#67D4FF", stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="income"
            fill="url(#dashboardIncomeFill)"
            stroke="url(#dashboardIncomeLine)"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ r: 6, fill: "#1688F0", stroke: "#ffffff", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {!isEmpty && lastPoint ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-bl-2xl rounded-tr-xl bg-[#BDEBFF] px-4 py-1.5 text-xs font-semibold text-[#075985]">
          {formatRupiahTick(lastPoint.income)}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-400">
          Belum ada transaksi
        </div>
      ) : null}
    </div>
  );
}

export function DashboardFinanceOverview({ data, height = 224 }: { data: FinancePoint[]; height?: number }) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const visibleData = useMemo(() => {
    if (period === "monthly") return data.slice(-6);
    return data.slice(-12);
  }, [data, period]);

  const tabs = [
    { key: "monthly", label: "Bulanan" },
    { key: "yearly", label: "Tahunan" },
  ] as const;

  return (
    <>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-ink">Ringkasan Pendapatan</h2>
          <p className="mt-1 text-xs text-slate-500">
            {period === "monthly" ? "Performa 6 bulan terakhir" : "Performa 12 bulan terakhir"}
          </p>
        </div>
        <div className="flex w-fit max-w-full items-center overflow-x-auto rounded-full bg-[#F4F7FB] p-1 text-[11px] font-medium text-slate-500">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPeriod(tab.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1 transition ${
                period === tab.key
                  ? "bg-white text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)]"
                  : "hover:text-brand"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1">
        <DashboardFinanceChart data={visibleData} height={height} />
        <div className="mt-1 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#1688F0]" />Penerimaan</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#67D4FF]" />Pengeluaran</span>
        </div>
      </div>
    </>
  );
}

export function DashboardStudentClassChart({ data, height = 270 }: { data: OperationPoint[]; height?: number }) {
  const visibleData = data.slice(0, 2).map((item) => ({
    ...item,
    fill: item.name === "Siswa" ? "#1688F0" : "#4F63F6",
  }));

  return (
    <div className="flex flex-1 flex-col justify-center" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={visibleData} margin={{ top: 16, right: 18, left: -8, bottom: 0 }} barCategoryGap="34%">
          <defs>
            <linearGradient id="studentBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1688F0" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="classBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F63F6" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E7EDF7" strokeDasharray="4 8" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748B", fontWeight: 500 }}
            width={32}
          />
          <Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.045)", radius: 18 }} content={<StudentClassTooltip />} />
          <Bar dataKey="value" radius={[16, 16, 6, 6]} maxBarSize={76}>
            {visibleData.map((entry) => (
              <Cell key={entry.name} fill={entry.name === "Siswa" ? "url(#studentBarFill)" : "url(#classBarFill)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-500">
        {visibleData.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DashboardOperationsChart({ data, height = 200 }: { data: OperationPoint[]; height?: number }) {
  return <DashboardStudentClassChart data={data} height={height} />;
}

export function DashboardRevenueChart({ height = 140 }: { height?: number }) {
  return (
    <DashboardFinanceChart
      height={height}
      data={demoRevenueData}
    />
  );
}
