"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, X, ArrowLeftRight } from "lucide-react";
import { deleteCashFlow, saveCashFlow } from "@/app/finance/actions";
import type { CashFlowRow } from "@/app/finance/page-data";
import { EmptyState, EmptyStateRow } from "./empty-state";
import { DataTableShell } from "./data-table-shell";
import { KpiCard } from "./kpi-card";
import { ConfirmDialog } from "./confirm-dialog";
import { AppSelect } from "./app-select";

const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const cashTypeOptions = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
];

export function CashFlowManager({ rows, totalIncome, totalExpense }: { rows: CashFlowRow[]; totalIncome: number; totalExpense: number }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const typeLabel = row.type === "income" ? "pemasukan masuk" : "pengeluaran keluar";
      return [row.category, row.description ?? "", typeLabel]
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }, [query, rows]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open || deletingId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, deletingId]);

  const submit = (form: HTMLFormElement) => startTransition(async () => {
    const result = await saveCashFlow(Object.fromEntries(new FormData(form)));
    if (result.error) setMessage(result.error);
    else {
      setMessage(undefined);
      setOpen(false);
    }
  });

  const remove = (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (row && !row.deletable) {
      setMessage("Transaksi otomatis dari invoice/payroll dihapus dari menu asalnya.");
      return;
    }
    setDeletingId(id);
  };

  const confirmRemove = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteCashFlow(deletingId);
      if (result.error) setMessage(result.error);
      setDeletingId(null);
    });
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="app-title-primary">Arus Kas</h1>
            <p className="mt-1 text-sm text-slate-500">Catat pemasukan, pengeluaran, kategori, nominal, dan riwayat transaksi.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brandHover">
            <Plus size={17} /> Tambah Transaksi
          </button>
        </div>

        {message && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <CashCard label="Kas Masuk" value={formatRp(totalIncome)} tone="income" />
          <CashCard label="Kas Keluar" value={formatRp(totalExpense)} tone="expense" />
          <CashCard label="Saldo Kas" value={formatRp(totalIncome - totalExpense)} tone="balance" />
        </div>

        <DataTableShell
          icon={ArrowLeftRight}
          title="Riwayat Arus Kas"
          totalCount={rows.length}
          totalLabel="transaksi tercatat"
          shownCount={filteredRows.length}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Cari kategori atau deskripsi..."
        >
          <div className="divide-y divide-slate-100 sm:hidden">
            {filteredRows.map((row) => (
              <article key={row.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-ink">{row.category}</h2>
                    <p className="mt-0.5 text-xs text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(row.transaction_date))}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${row.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {row.type === "income" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    {row.type === "income" ? "Masuk" : "Keluar"}
                  </span>
                </div>
                <p className={`mt-3 text-lg font-bold ${row.type === "income" ? "text-emerald-600" : "text-red-600"}`}>{formatRp(row.amount)}</p>
                {row.description && <p className="mt-2 text-sm leading-relaxed text-slate-500">{row.description}</p>}
                <div className="mt-4 flex justify-end">
                  <button onClick={() => remove(row.id)} disabled={isPending || !row.deletable} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                    <Trash2 size={15} /> Hapus
                  </button>
                </div>
              </article>
            ))}
            {filteredRows.length === 0 && (
              <EmptyState
                icon={ArrowLeftRight}
                title={query ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi arus kas"}
                description={query ? "Coba gunakan kata kunci lain untuk mencari transaksi." : "Catat pemasukan dan pengeluaran manual untuk memantau arus kas bimbel."}
                action={!query ? { label: "+ Tambah Transaksi", onClick: () => setOpen(true) } : undefined}
              />
            )}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50/80 text-[13px] text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Tipe</th>
                  <th className="px-5 py-3 font-semibold">Kategori</th>
                  <th className="px-5 py-3 font-semibold">Nominal</th>
                  <th className="px-5 py-3 font-semibold">Deskripsi</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(row.transaction_date))}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${row.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {row.type === "income" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        {row.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">{row.category}</td>
                    <td className={`px-5 py-4 font-bold ${row.type === "income" ? "text-emerald-600" : "text-red-600"}`}>{formatRp(row.amount)}</td>
                    <td className="max-w-[260px] truncate px-5 py-4 text-slate-500">{row.description ?? "-"}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => remove(row.id)} disabled={isPending || !row.deletable} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50" aria-label="Hapus transaksi">
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <EmptyStateRow
                    colSpan={6}
                    icon={ArrowLeftRight}
                    title={query ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi arus kas"}
                    description={query ? "Coba gunakan kata kunci lain untuk mencari transaksi." : "Catat pemasukan dan pengeluaran manual untuk memantau arus kas bimbel."}
                    action={!query ? { label: "+ Tambah Transaksi", onClick: () => setOpen(true) } : undefined}
                  />
                )}
              </tbody>
            </table>
          </div>
        </DataTableShell>
      </div>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/40">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-6">
            <form onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget); }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:my-8 sm:max-w-lg sm:rounded-3xl sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="app-title-secondary">Tambah Transaksi</h2>
                  <p className="mt-1 text-sm text-slate-500">Lengkapi tanggal, tipe, kategori, nominal, dan deskripsi.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Label text="Tanggal"><input name="transaction_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="input" /></Label>
                <Label text="Tipe">
                  <AppSelect name="type" defaultValue="income" options={cashTypeOptions} placeholder="" className="w-full" />
                </Label>
                <Label text="Kategori"><input name="category" required placeholder="Contoh: Sewa, Operasional" className="input" /></Label>
                <Label text="Nominal"><input name="amount" required inputMode="numeric" placeholder="250000" className="input" /></Label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</span>
                  <textarea name="description" className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                </label>
              </div>
              <div className="mt-7 flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Batal</button>
                <button disabled={isPending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">{isPending ? "Menyimpan..." : "Simpan Transaksi"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <ConfirmDialog
        open={deletingId !== null}
        title="Hapus Transaksi?"
        description="Transaksi arus kas ini akan dihapus dari riwayat dan tidak bisa dikembalikan."
        isPending={isPending}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmRemove}
      />
    </>
  );
}

function CashCard({ label, value, tone }: { label: string; value: string; tone: "income" | "expense" | "balance" }) {
  const detail = tone === "balance" ? "Kas masuk - kas keluar" : "Transaksi arus kas";
  return <KpiCard icon={tone === "expense" ? ArrowUpRight : ArrowDownLeft} label={label} value={value} detail={detail} tone={tone} />;
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{text}</span>{children}</label>;
}
