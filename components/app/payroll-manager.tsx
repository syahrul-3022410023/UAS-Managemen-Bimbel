"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, Eye, FileText, Printer, RefreshCw, Save, Trash2 } from "lucide-react";
import { deletePayroll, generateCurrentPayroll, markPayrollPaid, updatePayrollAdjustments } from "@/app/finance/actions";
import type { PayrollRow } from "@/app/finance/page-data";
import { DataTableShell } from "./data-table-shell";
import { EmptyState, EmptyStateRow } from "./empty-state";
import { KpiCard } from "./kpi-card";
import { ConfirmDialog } from "./confirm-dialog";
import { AppSelect } from "./app-select";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function PayrollManager({ rows }: { rows: PayrollRow[] }) {
  const [query, setQuery] = useState("");
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [message, setMessage] = useState<string>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const monthOptions = MONTHS.map((month, index) => ({ value: index + 1, label: month }));

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.month !== filterMonth || row.year !== filterYear) return false;
      if (!keyword) return true;
      const period = `${MONTHS[row.month - 1]} ${row.year}`;
      const status = row.status === "paid" ? "lunas terbayar" : "belum dibayar unpaid";
      return [row.mentor_name, period, status].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [filterMonth, filterYear, query, rows]);

  const totalUnpaid = filteredRows.filter((row) => row.status === "unpaid").reduce((sum, row) => sum + row.total_amount, 0);
  const totalPaid = filteredRows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.total_amount, 0);

  const generate = () => startTransition(async () => {
    const result = await generateCurrentPayroll({ month: filterMonth, year: filterYear });
    if (result.error) setMessage(result.error);
    else setMessage(`Payroll berhasil digenerate untuk ${result.generated ?? 0} mentor.`);
  });

  const pay = (id: string) => startTransition(async () => {
    const result = await markPayrollPaid(id);
    setMessage(result.error ?? "Payroll berhasil dibayar dan arus kas otomatis berkurang.");
  });

  const remove = (id: string) => {
    setDeletingId(id);
  };

  const confirmRemove = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deletePayroll(deletingId);
      setMessage(result.error ?? "Payroll berhasil dihapus.");
      setDeletingId(null);
    });
  };

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
          <RefreshCw size={17} /> Generate Payroll
        </button>
      </div>

      {message && <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600">{message}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <MiniFinanceCard label="Belum Dibayar" value={formatRp(totalUnpaid)} detail="Payroll menunggu pelunasan" />
        <MiniFinanceCard label="Terbayar" value={formatRp(totalPaid)} detail="Payroll berstatus lunas" />
        <MiniFinanceCard label="Total Slip" value={String(rows.length)} detail="Slip payroll tersimpan" />
      </div>

      <DataTableShell
        icon={Banknote}
        title="Database Payroll"
        totalCount={rows.length}
        totalLabel="slip tersimpan"
        shownCount={filteredRows.length}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Cari mentor atau periode..."
        controls={
          <>
            <AppSelect value={filterMonth} onChange={(value) => setFilterMonth(Number(value))} options={monthOptions} placeholder="" className="w-28" />
            <input value={filterYear} onChange={(event) => setFilterYear(Number(event.target.value))} type="number" min={2020} max={2099} className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-brand" />
          </>
        }
      >
        <div className="divide-y divide-slate-100 sm:hidden">
          {filteredRows.map((row) => (
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
                <button form={`payroll-mobile-${row.id}`} disabled={isPending} className="rounded-xl bg-[#EEF0FF] px-3 py-2 text-xs font-bold text-brand transition hover:bg-brand/10 disabled:opacity-60">Simpan</button>
                {row.status === "unpaid" && <button onClick={() => pay(row.id)} disabled={isPending} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-60">Bayar</button>}
                <button onClick={() => remove(row.id)} disabled={isPending} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60">Hapus</button>
                <Link href={`/admin/gaji-mentor/${row.id}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-brand transition hover:bg-blue-100">
                  <Eye size={15} /> Detail
                </Link>
              </div>
            </article>
          ))}
          {filteredRows.length === 0 && (
            <EmptyState
              icon={Banknote}
              title={query ? "Tidak ada payroll yang cocok" : "Belum ada payroll"}
              description={query ? "Coba ubah kata kunci pencarian mentor atau periode." : "Generate payroll bulan ini untuk membuat slip gaji mentor."}
            />
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
            <thead className="bg-slate-50/80 text-[13px] text-slate-500">
              <tr>
                <th className="w-[160px] px-5 py-3 font-semibold">Mentor</th>
                <th className="w-[105px] px-4 py-3 font-semibold">Periode</th>
                <th className="w-[70px] px-4 py-3 text-center font-semibold">Sesi</th>
                <th className="w-[125px] px-4 py-3 font-semibold">Gaji Sesi</th>
                <th className="w-[125px] px-4 py-3 font-semibold">Bonus</th>
                <th className="w-[125px] px-4 py-3 font-semibold">Potongan</th>
                <th className="w-[130px] px-4 py-3 font-semibold">Total</th>
                <th className="w-[135px] px-4 py-3 font-semibold">Status</th>
                <th className="w-[160px] px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="align-top transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-ink">
                    <span className="block truncate" title={row.mentor_name}>{row.mentor_name}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{MONTHS[row.month - 1]} {row.year}</td>
                  <td className="px-4 py-4 text-center font-semibold text-ink">{row.session_count}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatRp(row.session_amount)}</td>
                  <td className="px-4 py-4">
                    <form id={`payroll-${row.id}`} onSubmit={(event) => { event.preventDefault(); saveAdjustment(row.id, event.currentTarget); }}>
                      <input name="bonus" defaultValue={row.bonus} className="input h-9 w-24" />
                    </form>
                  </td>
                  <td className="px-4 py-4"><input form={`payroll-${row.id}`} name="deduction" defaultValue={row.deduction} className="input h-9 w-24" /></td>
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-ink">{formatRp(row.total_amount)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                      {row.status === "paid" ? "Lunas" : "Belum Dibayar"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button form={`payroll-${row.id}`} disabled={isPending} title="Simpan" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF0FF] text-brand transition hover:bg-brand/10 disabled:opacity-60" aria-label="Simpan payroll">
                        <Save size={15} />
                      </button>
                      {row.status === "unpaid" && (
                        <button onClick={() => pay(row.id)} disabled={isPending} title="Bayar" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-60" aria-label="Bayar payroll">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <Link href={`/admin/gaji-mentor/${row.id}`} title="Detail" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand transition hover:bg-blue-100" aria-label="Detail slip"><Eye size={16} /></Link>
                      <button onClick={() => remove(row.id)} disabled={isPending} title="Hapus" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60" aria-label="Hapus slip"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <EmptyStateRow
                  colSpan={9}
                  icon={Banknote}
                  title={query ? "Tidak ada payroll yang cocok" : "Belum ada payroll"}
                  description={query ? "Coba ubah kata kunci pencarian mentor atau periode." : "Generate payroll bulan ini untuk membuat slip gaji mentor."}
                  action={!query ? { label: "+ Generate Payroll", onClick: generate } : undefined}
                />
              )}
            </tbody>
          </table>
        </div>
      </DataTableShell>
      <ConfirmDialog
        open={deletingId !== null}
        title="Hapus Slip Payroll?"
        description="Slip payroll akan dihapus. Jika statusnya sudah dibayar, transaksi arus kas terkait juga ikut dihapus."
        isPending={isPending}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmRemove}
      />
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

function MiniFinanceCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  const cardIcon = label.includes("Terbayar") ? FileText : label.includes("Total") ? Printer : Banknote;
  const tone = label.includes("Terbayar") ? "income" : label.includes("Total") ? "payroll" : "expense";
  return <KpiCard icon={cardIcon} label={label} value={value} detail={detail} tone={tone} />;
}
