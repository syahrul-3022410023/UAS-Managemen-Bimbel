"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, X } from "lucide-react";
import { deleteCashFlow, saveCashFlow } from "@/app/finance/actions";
import type { CashFlowRow } from "@/app/finance/page-data";

const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function CashFlowManager({ rows, totalIncome, totalExpense }: { rows: CashFlowRow[]; totalIncome: number; totalExpense: number }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const submit = (form: HTMLFormElement) => startTransition(async () => {
    const result = await saveCashFlow(Object.fromEntries(new FormData(form)));
    if (result.error) setMessage(result.error);
    else {
      setMessage(undefined);
      setOpen(false);
    }
  });

  const remove = (id: string) => {
    if (!window.confirm("Hapus transaksi arus kas ini?")) return;
    startTransition(async () => {
      const result = await deleteCashFlow(id);
      if (result.error) setMessage(result.error);
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
          <CashCard label="Saldo Manual" value={formatRp(totalIncome - totalExpense)} tone="balance" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="divide-y divide-slate-100 sm:hidden">
            {rows.map((row) => (
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
                  <button onClick={() => remove(row.id)} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">
                    <Trash2 size={15} /> Hapus
                  </button>
                </div>
              </article>
            ))}
            {rows.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">Belum ada transaksi arus kas.</div>}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                {rows.map((row) => (
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
                      <button onClick={() => remove(row.id)} disabled={isPending} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="Hapus transaksi">
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">Belum ada transaksi arus kas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
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
                  <select name="type" defaultValue="income" className="input">
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
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
    </>
  );
}

function CashCard({ label, value, tone }: { label: string; value: string; tone: "income" | "expense" | "balance" }) {
  const styles = tone === "income" ? "bg-emerald-50 text-emerald-600" : tone === "expense" ? "bg-red-50 text-red-600" : "bg-[#EEF0FF] text-brand";
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${styles}`}>
        {tone === "expense" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{text}</span>{children}</label>;
}
