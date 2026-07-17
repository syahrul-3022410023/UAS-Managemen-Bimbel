type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-apple-soft transition hover:shadow-md">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-3 text-xs font-medium text-brand">{detail}</p>
    </section>
  );
}
