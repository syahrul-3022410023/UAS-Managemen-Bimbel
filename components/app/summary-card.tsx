import { BookOpen, CalendarCheck, CreditCard, FileText, Layers, Users } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
};

const kpiStyles = [
  { bg: "bg-indigo-50", text: "text-brand", icon: BookOpen },
  { bg: "bg-orange-50", text: "text-orange-600", icon: FileText },
  { bg: "bg-sky-50", text: "text-sky-600", icon: CalendarCheck },
  { bg: "bg-emerald-50", text: "text-emerald-600", icon: Users },
  { bg: "bg-violet-50", text: "text-violet-600", icon: Layers },
  { bg: "bg-blue-50", text: "text-blue-600", icon: CreditCard },
];

function getKpiStyle(label: string) {
  const lower = label.toLowerCase();

  if (lower.includes("siswa") || lower.includes("mentor")) return kpiStyles[3];
  if (lower.includes("kelas")) return kpiStyles[4];
  if (lower.includes("absensi") || lower.includes("jadwal")) return kpiStyles[2];
  if (lower.includes("invoice") || lower.includes("pendapatan")) return kpiStyles[5];

  const index = [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0) % kpiStyles.length;
  return kpiStyles[index];
}

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  const style = getKpiStyle(label);
  const Icon = style.icon;

  return (
    <section className="gsm-summary-card min-h-[112px] rounded-2xl border border-[#ECEEF5] bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand/20">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
          <Icon size={16} strokeWidth={2.4} />
        </div>
        <span className="max-w-[58%] truncate rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
          {detail}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold leading-none text-ink">{value}</p>
      </div>
    </section>
  );
}
