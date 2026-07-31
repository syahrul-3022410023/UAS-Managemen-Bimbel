import type { LucideIcon } from "lucide-react";

type KpiTone = "income" | "expense" | "balance" | "payroll" | "neutral";

type KpiCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: KpiTone;
  className?: string;
};

const toneStyles: Record<KpiTone, { card: string; icon: string; accent: string }> = {
  income: {
    card: "bg-[#E8F8F1]",
    icon: "bg-white/75 text-[#0F9F6E]",
    accent: "bg-[#0F9F6E]",
  },
  expense: {
    card: "bg-[#EEF2FF]",
    icon: "bg-white/75 text-[#4F63F6]",
    accent: "bg-[#4F63F6]",
  },
  balance: {
    card: "bg-[#EAF9FF]",
    icon: "bg-white/75 text-[#0891B2]",
    accent: "bg-[#0891B2]",
  },
  payroll: {
    card: "bg-[#EAF4FF]",
    icon: "bg-white/75 text-[#1688F0]",
    accent: "bg-[#1688F0]",
  },
  neutral: {
    card: "bg-[#F4F7FB]",
    icon: "bg-white/75 text-brand",
    accent: "bg-brand",
  },
};

export function KpiCard({ icon: Icon, label, value, detail, tone = "neutral", className = "" }: KpiCardProps) {
  const style = toneStyles[tone];

  return (
    <section className={`relative min-h-[112px] overflow-hidden rounded-2xl p-4 ${style.card} ${className}`}>
      <div className={`absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full ${style.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-[24px] font-semibold leading-none text-ink">{value}</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}`}>
          <Icon size={17} strokeWidth={2.2} />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-snug text-slate-500">{detail}</p>
    </section>
  );
}
