import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { SummaryCard } from "@/components/app/summary-card";
import { getMentorPayrolls } from "@/app/finance/page-data";
import { requireRole } from "@/lib/auth/session";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatRp = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export default async function MentorSlipGajiPage() {
  const user = await requireRole(["mentor"]);
  const { mentor, payrolls } = await getMentorPayrolls(user.id);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const incomeThisMonth = payrolls.filter((row) => row.month === currentMonth && row.year === currentYear).reduce((sum, row) => sum + row.total_amount, 0);
  const latest = payrolls[0];

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Slip Gaji" activeNav="Slip Gaji">
      <div className="space-y-5">
        <div>
          <h1 className="app-title-primary">Slip Gaji</h1>
          <p className="mt-1 text-sm text-slate-500">{mentor ? `Riwayat slip gaji untuk ${mentor.full_name}` : "Data mentor belum terhubung."}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard label="Slip Terbaru" value={latest ? `${MONTHS[latest.month - 1]} ${latest.year}` : "-"} detail={latest ? `Nominal ${formatRp(latest.total_amount)}` : "Belum ada slip"} />
          <SummaryCard label="Pendapatan Bulan Ini" value={formatRp(incomeThisMonth)} detail="Payroll periode ini" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="divide-y divide-slate-100 sm:hidden">
            {payrolls.map((row) => (
              <article key={row.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">{MONTHS[row.month - 1]} {row.year}</h2>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{row.session_count} sesi</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>{row.status === "paid" ? "Lunas" : "Belum Dibayar"}</span>
                </div>
                <p className="mt-4 text-xl font-bold text-ink">{formatRp(row.total_amount)}</p>
                <div className="mt-4 flex justify-end">
                  <Link href={`/mentor/slip-gaji/${row.id}`} className="rounded-xl bg-[#EEF0FF] px-3 py-2 text-xs font-bold text-brand">Detail Slip</Link>
                </div>
              </article>
            ))}
            {payrolls.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">Belum ada slip gaji.</div>}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Periode</th>
                  <th className="px-5 py-3 text-center font-semibold">Sesi</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-ink">{MONTHS[row.month - 1]} {row.year}</td>
                    <td className="px-5 py-4 text-center text-slate-600">{row.session_count}</td>
                    <td className="px-5 py-4 font-bold text-ink">{formatRp(row.total_amount)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>{row.status === "paid" ? "Lunas" : "Belum Dibayar"}</span></td>
                    <td className="px-5 py-4 text-right"><Link href={`/mentor/slip-gaji/${row.id}`} className="rounded-lg px-3 py-2 text-xs font-bold text-brand hover:bg-brand/10">Detail Slip</Link></td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Belum ada slip gaji.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
