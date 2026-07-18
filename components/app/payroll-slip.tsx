"use client";

import { Printer } from "lucide-react";
import type { PayrollDetailRow, PayrollRow } from "@/app/finance/page-data";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function PayrollSlip({ payroll, details }: { payroll: PayrollRow; details: PayrollDetailRow[] }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-title-primary">Slip Gaji Mentor</h1>
          <p className="mt-1 text-sm text-slate-500">{payroll.mentor_name} - {MONTHS[payroll.month - 1]} {payroll.year}</p>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brandHover">
          <Printer size={17} /> Cetak Slip
        </button>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 print:border-slate-300">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">BimbelPro Management</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Slip Gaji</h2>
            <p className="mt-1 text-sm text-slate-500">Periode {MONTHS[payroll.month - 1]} {payroll.year}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-ink">{payroll.mentor_name}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${payroll.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
              {payroll.status === "paid" ? "Lunas" : "Belum Dibayar"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <SlipStat label="Jumlah Sesi" value={String(payroll.session_count)} />
          <SlipStat label="Gaji Sesi" value={formatRp(payroll.session_amount)} />
          <SlipStat label="Bonus" value={formatRp(payroll.bonus)} />
          <SlipStat label="Potongan" value={formatRp(payroll.deduction)} />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">Mapel</th>
                <th className="px-4 py-3 text-right font-semibold">Tarif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((detail) => (
                <tr key={detail.id}>
                  <td className="px-4 py-3 text-slate-600">{detail.taught_at ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.taught_at)) : "-"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{detail.class_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.subject_name ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatRp(detail.fee_per_session)}</td>
                </tr>
              ))}
              {details.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">Belum ada detail sesi pada slip ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full rounded-2xl bg-slate-50 p-5 sm:max-w-sm">
            <div className="flex justify-between text-sm text-slate-600"><span>Gaji sesi</span><span>{formatRp(payroll.session_amount)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-slate-600"><span>Bonus</span><span>{formatRp(payroll.bonus)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-slate-600"><span>Potongan</span><span>- {formatRp(payroll.deduction)}</span></div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-base font-bold text-ink"><span>Total diterima</span><span>{formatRp(payroll.total_amount)}</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SlipStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ECEEF5] bg-white p-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-5 text-[28px] font-semibold leading-none text-ink">{value}</p>
      <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">Komponen payroll</p>
    </div>
  );
}
