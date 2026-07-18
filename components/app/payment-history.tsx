"use client";

import { useMemo, useState } from "react";
import { Search, CreditCard, Banknote, QrCode, MoreHorizontal } from "lucide-react";
import type { PaymentRecapRow } from "@/app/billing/page-data";

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const methodLabels: Record<string, string> = {
  cash: "Tunai", transfer: "Transfer Bank", qris: "QRIS", other: "Lainnya"
};

const methodIcons: Record<string, React.ReactNode> = {
  cash:     <Banknote size={14} />,
  transfer: <CreditCard size={14} />,
  qris:     <QrCode size={14} />,
  other:    <MoreHorizontal size={14} />,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(amount);
}

export function PaymentHistory({ payments }: { payments: PaymentRecapRow[] }) {
  const [query, setQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchQuery =
        p.student_name.toLowerCase().includes(query.toLowerCase()) ||
        (p.reference_number ?? "").toLowerCase().includes(query.toLowerCase());
      const matchMethod = filterMethod === "all" || p.method === filterMethod;
      return matchQuery && matchMethod;
    });
  }, [payments, query, filterMethod]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Revenue per method
  const revenueByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of payments) {
      map[p.method] = (map[p.method] ?? 0) + p.amount;
    }
    return map;
  }, [payments]);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="app-title-primary">Rekap Pembayaran</h1>
        <p className="mt-1 text-sm text-slate-500">
          Riwayat seluruh transaksi pembayaran bimbel.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-apple-soft lg:col-span-2">
          <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <CreditCard size={15} strokeWidth={2.2} />
          </div>
          <p className="text-sm font-semibold text-ink">Pendapatan</p>
          <p className="mt-5 text-[28px] font-semibold leading-none text-ink">{formatCurrency(totalRevenue)}</p>
          <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">{payments.length} transaksi diterima</p>
        </div>
        {Object.entries(revenueByMethod).map(([method, amount]) => (
          <div key={method} className="rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-apple-soft">
            <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              {methodIcons[method]}
            </div>
            <p className="text-sm font-semibold text-ink">{methodLabels[method] ?? method}</p>
            <p className="mt-5 text-[28px] font-semibold leading-none text-ink">{formatCurrency(amount)}</p>
            <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">Metode pembayaran</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-apple-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "cash", "transfer", "qris", "other"].map((m) => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filterMethod === m
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m === "all" ? "Semua" : (methodLabels[m] ?? m)}
              </button>
            ))}
          </div>
          <label className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 focus-within:border-brand/50 focus-within:bg-white">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari siswa atau referensi..."
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Siswa</th>
                <th className="px-5 py-3 font-semibold">Periode Invoice</th>
                <th className="px-5 py-3 font-semibold">Metode</th>
                <th className="px-5 py-3 font-semibold">Referensi</th>
                <th className="px-5 py-3 font-semibold">Tanggal Bayar</th>
                <th className="px-5 py-3 text-right font-semibold">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-ink">{p.student_name}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {MONTHS[p.invoice_month - 1]} {p.invoice_year}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      {methodIcons[p.method]}
                      {methodLabels[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{p.reference_number ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(p.paid_at))}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <CreditCard size={32} className="mx-auto mb-3 text-slate-300" />
                    Belum ada data pembayaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
