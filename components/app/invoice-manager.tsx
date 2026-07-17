"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search, Plus, X, FileText, CheckCircle2,
  Clock, XCircle, AlertCircle, ChevronRight
} from "lucide-react";
import { generateInvoice, updateInvoiceStatus } from "@/app/billing/actions";
import type { InvoiceRow, StudentOption } from "@/app/billing/page-data";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

const statusConfig = {
  unpaid:    { label: "Belum Dibayar", icon: AlertCircle,   color: "bg-red-50 text-red-600 border-red-200" },
  partial:   { label: "Bayar Sebagian", icon: Clock,        color: "bg-amber-50 text-amber-600 border-amber-200" },
  paid:      { label: "Lunas",          icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Dibatalkan",     icon: XCircle,      color: "bg-slate-50 text-slate-500 border-slate-200" },
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
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

// ─── Generate Form ────────────────────────────────────────────────────────────

function GenerateForm({
  students,
  onClose,
}: {
  students: StudentOption[];
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Default due date: last day of selected month
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const defaultDueDate = (() => {
    const d = new Date(year, month, 0); // last day of month
    return d.toISOString().split("T")[0];
  })();
  const [dueDate, setDueDate] = useState(defaultDueDate);

  const handleStudentChange = (id: string) => {
    const s = students.find((x) => x.value === id) ?? null;
    setSelectedStudent(s);
  };

  const submit = (form: HTMLFormElement) => {
    startTransition(async () => {
      const raw = Object.fromEntries(new FormData(form));
      const result = await generateInvoice(raw);
      if (result.error) setMessage(result.error);
      else onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/40">
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-6">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }}
        className="w-full bg-white p-6 shadow-2xl rounded-t-3xl sm:max-w-lg sm:rounded-3xl sm:my-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generate Invoice</h2>
            <p className="mt-1 text-sm text-slate-500">Buat tagihan untuk siswa berdasarkan paket.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {message && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Siswa */}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Siswa</span>
            <select
              name="student_id"
              required
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Pilih siswa</option>
              {students.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          {/* Paket info */}
          {selectedStudent && (
            <div className="sm:col-span-2 rounded-xl bg-brand/5 border border-brand/20 p-3">
              <p className="text-xs text-slate-500 mb-1">Paket terpilih</p>
              {selectedStudent.package_name ? (
                <p className="text-sm font-semibold text-slate-800">
                  {selectedStudent.package_name}
                  <span className="ml-2 font-normal text-brand">
                    {selectedStudent.package_price !== null ? formatCurrency(selectedStudent.package_price) : "—"}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600">Siswa belum memiliki paket bimbel</p>
              )}
            </div>
          )}

          {/* Bulan */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Bulan</span>
            <select
              name="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>

          {/* Tahun */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Tahun</span>
            <input
              name="year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2099}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          {/* Jatuh Tempo */}
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal Jatuh Tempo</span>
            <input
              name="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>

          {/* Catatan */}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Catatan (opsional)</span>
            <textarea
              name="notes"
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              placeholder="Catatan tambahan..."
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
            disabled={isPending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {isPending ? "Membuat..." : "Generate Invoice"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  invoices: InvoiceRow[];
  students: StudentOption[];
};

export function InvoiceManager({ invoices, students }: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchQuery =
        inv.student_name.toLowerCase().includes(query.toLowerCase()) ||
        `${MONTHS[inv.month - 1]} ${inv.year}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = filterStatus === "all" || inv.status === filterStatus;
      return matchQuery && matchStatus;
    });
  }, [invoices, query, filterStatus]);

  // Summary stats
  const stats = useMemo(() => ({
    total: invoices.length,
    unpaid: invoices.filter((i) => i.status === "unpaid").length,
    partial: invoices.filter((i) => i.status === "partial").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    revenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total_paid, 0),
  }), [invoices]);

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-title-primary">Manajemen Invoice</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola tagihan dan status pembayaran siswa bimbel.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
        >
          <Plus size={17} />
          Generate Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Invoice", value: stats.total, color: "text-slate-700" },
          { label: "Belum Dibayar", value: stats.unpaid, color: "text-red-600" },
          { label: "Bayar Sebagian", value: stats.partial, color: "text-amber-600" },
          { label: "Lunas", value: stats.paid, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-apple-soft">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-apple-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "unpaid", "partial", "paid", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filterStatus === s
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "Semua" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
              </button>
            ))}
          </div>
          <label className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 focus-within:border-brand/50 focus-within:bg-white">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari siswa atau bulan..."
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Siswa</th>
                <th className="px-5 py-3 font-semibold">Periode</th>
                <th className="px-5 py-3 font-semibold">Paket</th>
                <th className="px-5 py-3 font-semibold">Tagihan</th>
                <th className="px-5 py-3 font-semibold">Terbayar</th>
                <th className="px-5 py-3 font-semibold">Jatuh Tempo</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-ink">{inv.student_name}</td>
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
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/invoice/${inv.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition"
                      >
                        Detail <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                    Belum ada invoice yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateForm
          students={students}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </>
  );
}
