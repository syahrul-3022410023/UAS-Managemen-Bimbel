import { BookOpen, CalendarCheck, CreditCard, FileText, Layers, Users } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { SkeletonCard } from "./skeleton";

type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
  loading?: boolean;
};

const kpiStyles = [
  { tone: "neutral" as const, icon: BookOpen },
  { tone: "expense" as const, icon: FileText },
  { tone: "balance" as const, icon: CalendarCheck },
  { tone: "payroll" as const, icon: Users },
  { tone: "expense" as const, icon: Layers },
  { tone: "income" as const, icon: CreditCard },
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

export function SummaryCard({ label, value, detail, loading }: SummaryCardProps) {
  if (loading) return <SkeletonCard />;

  const style = getKpiStyle(label);
  return <KpiCard icon={style.icon} label={label} value={value} detail={detail} tone={style.tone} />;
}
