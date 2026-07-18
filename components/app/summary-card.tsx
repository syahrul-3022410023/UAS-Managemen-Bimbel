import { BookOpen, CalendarCheck, CreditCard, FileText, Layers, Users } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
};

const kpiStyles = [
  { bg: "bg-blue-50", text: "text-brand", icon: BookOpen },
  { bg: "bg-sky-50", text: "text-sky-600", icon: FileText },
  { bg: "bg-cyan-50", text: "text-cyan-600", icon: CalendarCheck },
  { bg: "bg-blue-50", text: "text-blue-600", icon: Users },
  { bg: "bg-sky-50", text: "text-sky-600", icon: Layers },
  { bg: "bg-blue-50", text: "text-brand", icon: CreditCard },
];

function getKpiStyle(label: string) {
  const lower = label.toLowerCase();

  if (lower.includes("siswa") || lower.includes("mentor")) return kpiStyles[3];
  if (lower.includes("kelas")) return kpiStyles[4];
  if (lower.includes("absensi") || lower.includes("jadwal")) return kpiStyles[2];
  if (lower.includes("pengeluaran") || lower.includes("keluar") || lower.includes("payroll")) return kpiStyles[1];
  if (lower.includes("saldo") || lower.includes("operasional")) return kpiStyles[2];
  if (lower.includes("invoice") || lower.includes("pendapatan") || lower.includes("penerimaan") || lower.includes("masuk")) return kpiStyles[5];

  const index = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0) % kpiStyles.length;
  return kpiStyles[index];
}

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  const style = getKpiStyle(label);
  const Icon = style.icon;

  return (
    <section className="gsm-summary-card min-h-[124px] rounded-2xl border border-[#ECEEF5] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
            <Icon size={15} strokeWidth={2.2} />
          </div>
          <p className="truncate text-sm font-semibold text-ink">{label}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[28px] font-semibold leading-none text-ink">{value}</p>
        <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">{detail}</p>
      </div>
    </section>
  );
}
