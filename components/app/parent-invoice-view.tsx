"use client";

import { useMemo, useState } from "react";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import type { InvoiceRow } from "@/app/billing/page-data";
import { DataTableShell } from "./data-table-shell";
import { EmptyStateRow } from "./empty-state";
import { KpiCard } from "./kpi-card";

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const statusConfig = {
  unpaid:    { label: "Belum Dibayar", icon: AlertCircle,   color: "bg-red-50 text-red-600 border-red-200" },
  paid:      { label: "Lunas",          icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

function StatusBadge({ status }: { status: InvoiceRow["status"] }) {
  const cfg = statusConfig[status] ?? statusConfig.unpaid;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(amount);
}

export function ParentInvoiceView({ invoices }: { invoices: InvoiceRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return invoices.filter((inv) =>
      inv.student_name.toLowerCase().includes(query.toLowerCase()) ||
      `${MONTHS[inv.month - 1]} ${inv.year}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [invoices, query]);

  const stats = useMemo(() => ({
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_paid, 0),
    unpaid: invoices.filter((i) => i.status === "unpaid")
      .reduce((sum, i) => sum + (i.amount - i.total_paid), 0),
  }), [invoices]);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="app-title-primary">Invoice SPP</h1>
        <p className="mt-1 text-sm text-slate-500">
          Daftar tagihan bimbel anak Anda.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KpiCard icon={FileText} label="Invoice" value={String(invoices.length)} detail="Tagihan terdaftar" tone="payroll" />
        <KpiCard icon={CheckCircle2} label="Terbayar" value={formatCurrency(stats.paid)} detail="Pembayaran diterima" tone="income" />
        <KpiCard icon={AlertCircle} label="Sisa Tagihan" value={formatCurrency(stats.unpaid)} detail="Belum dibayar" tone="expense" />
      </div>

      <DataTableShell
        icon={FileText}
        title="Database Invoice"
        totalCount={invoices.length}
        totalLabel="invoice terdaftar"
        shownCount={filtered.length}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Cari invoice..."
      >

        {/* Mobile card view */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filtered.map((inv) => {
            const remaining = inv.amount - inv.total_paid;
            const progress = Math.min(100, (inv.total_paid / inv.amount) * 100);
            return (
              <div key={inv.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{inv.student_name}</p>
                    <p className="text-xs text-slate-500">{inv.invoice_number ?? "-"} - {MONTHS[inv.month - 1]} {inv.year}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{formatCurrency(inv.total_paid)} / {formatCurrency(inv.amount)}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-400">
                    Jatuh tempo: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(inv.due_date))}
                  </span>
                  {remaining > 0 && (
                    <span className="text-red-500 font-medium">Sisa: {formatCurrency(remaining)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[13px] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Siswa</th>
                <th className="px-5 py-3 font-semibold">No. Invoice</th>
                <th className="px-5 py-3 font-semibold">Periode</th>
                <th className="px-5 py-3 font-semibold">Paket</th>
                <th className="px-5 py-3 font-semibold">Tagihan</th>
                <th className="px-5 py-3 font-semibold">Terbayar</th>
                <th className="px-5 py-3 font-semibold">Jatuh Tempo</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-ink">{inv.student_name}</td>
                  <td className="px-5 py-4 font-semibold text-slate-600">{inv.invoice_number ?? "-"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {MONTHS[inv.month - 1]} {inv.year}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{inv.package_name ?? "—"}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-5 py-4 text-emerald-600 font-medium">
                    {formatCurrency(inv.total_paid)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                      new Date(inv.due_date)
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <EmptyStateRow
                  colSpan={8}
                  icon={FileText}
                  title="Belum ada invoice"
                  description="Invoice anak akan muncul setelah admin membuat tagihan."
                />
              )}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    </>
  );
}
