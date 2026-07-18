"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, CheckCircle2, AlertCircle,
  Plus, Trash2, X, CreditCard, Banknote, QrCode, MoreHorizontal, Printer
} from "lucide-react";
import Link from "next/link";
import { savePayment, updateInvoiceStatus, deletePayment } from "@/app/billing/actions";
import type { InvoiceDetail } from "@/app/billing/page-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const statusConfig = {
  unpaid:    { label: "Belum Dibayar", icon: AlertCircle,   color: "bg-red-50 text-red-600 border-red-200" },
  paid:      { label: "Lunas",          icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

const methodIcons: Record<string, React.ReactNode> = {
  cash:     <Banknote size={14} />,
  transfer: <CreditCard size={14} />,
  qris:     <QrCode size={14} />,
  other:    <MoreHorizontal size={14} />,
};

const methodLabels: Record<string, string> = {
  cash: "Tunai", transfer: "Transfer Bank", qris: "QRIS", other: "Lainnya"
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function StatusBadge({ status }: { status: InvoiceDetail["status"] }) {
  const cfg = statusConfig[status] ?? statusConfig.unpaid;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cfg.color}`}>
      <Icon size={14} />
      {cfg.label}
    </span>
  );
}

// ─── Payment Form ─────────────────────────────────────────────────────────────

function PaymentForm({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const remaining = invoice.amount - invoice.total_paid;

  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 16); // datetime-local

  const submit = (form: HTMLFormElement) => {
    startTransition(async () => {
      const raw = Object.fromEntries(new FormData(form));
      const result = await savePayment(invoice.id, raw);
      if (result.error) setMessage(result.error);
      else onClose();
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/40">
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-6">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}
        className="w-full bg-white p-6 rounded-t-3xl sm:max-w-lg sm:rounded-3xl sm:my-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Input Pembayaran</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sisa tagihan: <span className="font-semibold text-red-600">{formatCurrency(remaining)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {message && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nominal */}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Nominal Pembayaran (Rp)</span>
            <input
              name="amount"
              type="text"
              required
              defaultValue={remaining}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          {/* Metode */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Metode Pembayaran</span>
            <select
              name="method"
              defaultValue="cash"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              {Object.entries(methodLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>

          {/* Tanggal */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Pembayaran</span>
            <input
              name="paid_at"
              type="datetime-local"
              required
              defaultValue={defaultDate}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          {/* Nomor Referensi */}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Nomor Referensi (opsional)</span>
            <input
              name="reference_number"
              type="text"
              placeholder="Contoh: nomor bukti transfer"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          {/* Catatan */}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Catatan (opsional)</span>
            <textarea
              name="notes"
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="Catatan pembayaran..."
            />
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending || remaining <= 0}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "Simpan Pembayaran"}
          </button>
        </div>
      </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceDetailView({ invoice }: { invoice: InvoiceDetail }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const remaining = invoice.amount - invoice.total_paid;
  const progress = Math.min(100, (invoice.total_paid / invoice.amount) * 100);

  const handleStatusUpdate = (status: "unpaid" | "paid") => {
    if (!window.confirm(`Ubah status invoice menjadi "${statusConfig[status].label}"?`)) return;
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, status);
      if (result.error) setMessage(result.error);
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!window.confirm("Hapus pembayaran ini?")) return;
    startTransition(async () => {
      const result = await deletePayment(paymentId, invoice.id);
      if (result.error) setMessage(result.error);
    });
  };

  return (
    <>
      {/* Back */}
      <Link
        href="/admin/invoice"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-brand print:hidden"
      >
        <ArrowLeft size={16} />
        Kembali ke Daftar Invoice
      </Link>

      {/* Error message */}
      {message && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 print:hidden">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 print:block">
        {/* Left: Invoice Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-apple-soft print:rounded-none print:border-slate-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3">
                  <StatusBadge status={invoice.status} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">{invoice.student_name}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {invoice.invoice_number ?? "Invoice SPP"} - {MONTHS[invoice.month - 1]} {invoice.year}
                  {invoice.package_name && ` · ${invoice.package_name}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Nomor Dokumen</p>
                <p className="mb-3 text-sm font-bold text-slate-700">{invoice.invoice_number ?? "INV-DRAFT"}</p>
                <p className="text-xs text-slate-400">Total Tagihan</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>Progres Pembayaran</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-emerald-600">Terbayar: {formatCurrency(invoice.total_paid)}</span>
                <span className="text-red-500">Sisa: {formatCurrency(remaining)}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs text-slate-400">Jatuh Tempo</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(invoice.due_date))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Dibuat</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(invoice.created_at))}
                </p>
              </div>
              {invoice.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400">Catatan</p>
                  <p className="mt-0.5 text-sm text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-apple-soft print:rounded-none print:border-slate-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Riwayat Pembayaran</h2>
              {invoice.status !== "paid" && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brandHover print:hidden"
                >
                  <Plus size={14} /> Input Pembayaran
                </button>
              )}
            </div>

            {invoice.payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard size={32} className="mx-auto mb-3 text-slate-300" />
                Belum ada pembayaran tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                      <th className="px-5 py-3 text-left font-semibold">Metode</th>
                      <th className="px-5 py-3 text-left font-semibold">Referensi</th>
                      <th className="px-5 py-3 text-right font-semibold">Nominal</th>
                      <th className="px-5 py-3 text-right font-semibold print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 text-slate-600">
                          {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(p.paid_at))}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            {methodIcons[p.method]}
                            {methodLabels[p.method] ?? p.method}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{p.reference_number ?? "—"}</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-5 py-3 text-right print:hidden">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            disabled={isPending}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label="Hapus pembayaran"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4 print:hidden">
          <button onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brandHover">
            <Printer size={17} /> Cetak Invoice
          </button>
          {/* Quick Action */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft">
            <h3 className="mb-4 font-semibold text-slate-900">Ubah Status Invoice</h3>
            <div className="space-y-2">
              {(["unpaid", "paid"] as const).map((s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const isActive = invoice.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(s)}
                    disabled={isActive || isPending}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? `${cfg.color} border cursor-default opacity-80`
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <Icon size={16} />
                    {cfg.label}
                    {isActive && <span className="ml-auto text-xs opacity-60">Aktif</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft space-y-3">
            <h3 className="font-semibold text-slate-900">Ringkasan</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Tagihan</span>
              <span className="font-medium">{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Terbayar</span>
              <span className="font-medium text-emerald-600">{formatCurrency(invoice.total_paid)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Sisa Tagihan</span>
              <span className="font-bold text-red-600">{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          invoice={invoice}
          onClose={() => setShowPaymentForm(false)}
        />
      )}
    </>
  );
}
