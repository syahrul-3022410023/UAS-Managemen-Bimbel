"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Banknote, Eye, FileText, Printer, RefreshCw } from "lucide-react";
import { generateCurrentPayroll, markPayrollPaid, updatePayrollAdjustments } from "@/app/finance/actions";
import type { PayrollRow } from "@/app/finance/page-data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function PayrollManager({ rows }: { rows: PayrollRow[] }) {
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const totalUnpaid = rows.filter((row) => row.status === "unpaid").reduce((sum, row) => sum + row.total_amount, 0);
  const totalPaid = rows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.total_amount, 0);

  const generate = () => startTransition(async () => {
    const result = await generateCurrentPayroll();
    if (result.error) setMessage(result.error);
    else setMessage(`Payroll berhasil digenerate untuk ${result.generated ?? 0} mentor.`);
  });

  const pay = (id: string) => startTransition(async () => {
    const result = await markPayrollPaid(id);
    if (result.error) setMessage(result.error);
  });

  const saveAdjustment = (id: string, form: HTMLFormElement) => startTransition(async () => {
    const result = await updatePayrollAdjustments(id, Object.fromEntries(new FormData(form)));
    if (result.error) setMessage(result.error);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="app-title-primary">Gaji Mentor</h1>
          <p className="mt-1 text-sm text-slate-500">Generate payroll, atur bonus/potongan, bayar, dan cetak slip gaji mentor.</p>
        </div>
        <button onClick={generate} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brandHover disabled:opacity-60">
          <RefreshCw size={17} /> Generate Payroll Bulan Ini
        </button>
      </div>

      {message && <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600">{message}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <MiniFinanceCard label="Payroll Belum Dibayar" value={formatRp(totalUnpaid)} icon={<Banknote size={18} />} />
        <MiniFinanceCard label="Payroll Terbayar" value={formatRp(totalPaid)} icon={<FileText size={18} />} />
        <MiniFinanceCard label="Total Slip" value={String(rows.length)} icon={<Printer size={18} />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="divide-y divide-slate-100 sm:hidden">
          {rows.map((row) => (
            <article key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-ink">{row.mentor_name}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">{MONTHS[row.month - 1]} {row.year} - {row.session_count} sesi</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                  {row.status === "paid" ? "Lunas" : "Belum Dibayar"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MobileMetric label="Gaji sesi" value={formatRp(row.session_amount)} />
                <MobileMetric label="Total" value={formatRp(row.total_amount)} strong />
              </div>

              <form id={`payroll-mobile-${row.id}`} onSubmit={(event) => { event.preventDefault(); saveAdjustment(row.id, event.currentTarget); }} className="mt-4 grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Bonus</span>
                  <input name="bonus" defaultValue={row.bonus} className="input h-10" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Potongan</span>
                  <input name="deduction" defaultValue={row.deduction} className="input h-10" />
                </label>
              </form>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button form={`payroll-mobile-${row.id}`} disabled={isPending} className="rounded-xl bg-[#EEF0FF] px-3 py-2 text-xs font-bold text-brand disabled:opacity-60">Simpan</button>
                {row.status === "unpaid" && <button onClick={() => pay(row.id)} disabled={isPending} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 disabled:opacity-60">Bayar</button>}
                <Link href={`/admin/gaji-mentor/${row.id}`} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Detail Slip</Link>
              </div>
            </article>
          ))}
          {rows.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">Belum ada payroll. Klik Generate Payroll Bulan Ini.</div>}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Mentor</th>
                <th className="px-5 py-3 font-semibold">Periode</th>
                <th className="px-5 py-3 text-center font-semibold">Sesi</th>
                <th className="px-5 py-3 font-semibold">Gaji Sesi</th>
                <th className="px-5 py-3 font-semibold">Bonus</th>
                <th className="px-5 py-3 font-semibold">Potongan</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="align-top transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-ink">{row.mentor_name}</td>
                  <td className="px-5 py-4 text-slate-600">{MONTHS[row.month - 1]} {row.year}</td>
                  <td className="px-5 py-4 text-center font-semibold text-ink">{row.session_count}</td>
                  <td className="px-5 py-4 text-slate-600">{formatRp(row.session_amount)}</td>
                  <td className="px-5 py-4">
                    <form id={`payroll-${row.id}`} onSubmit={(event) => { event.preventDefault(); saveAdjustment(row.id, event.currentTarget); }} className="space-y-2">
                      <input name="bonus" defaultValue={row.bonus} className="input h-9 w-28" />
                    </form>
                  </td>
                  <td className="px-5 py-4"><input form={`payroll-${row.id}`} name="deduction" defaultValue={row.deduction} className="input h-9 w-28" /></td>
                  <td className="px-5 py-4 font-bold text-ink">{formatRp(row.total_amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                      {row.status === "paid" ? "Lunas" : "Belum Dibayar"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button form={`payroll-${row.id}`} disabled={isPending} className="rounded-lg px-3 py-2 text-xs font-bold text-brand hover:bg-brand/10">Simpan</button>
                      {row.status === "unpaid" && <button onClick={() => pay(row.id)} disabled={isPending} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50">Bayar</button>}
                      <Link href={`/admin/gaji-mentor/${row.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-brand/10 hover:text-brand" aria-label="Detail slip"><Eye size={17} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">Belum ada payroll. Klik Generate Payroll Bulan Ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MobileMetric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm ${strong ? "font-bold text-ink" : "font-semibold text-slate-600"}`}>{value}</p>
    </div>
  );
}

function MiniFinanceCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF0FF] text-brand">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}
