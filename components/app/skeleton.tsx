// Skeleton Loader Components
// Digunakan sebagai placeholder saat data masih loading (Heuristik H1: Visibility of System Status)

export function SkeletonCard() {
  return (
    <div className="relative min-h-[112px] overflow-hidden rounded-2xl bg-[#F4F7FB] p-4 animate-pulse">
      <div className="absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full bg-slate-200" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="h-3 w-24 rounded-lg bg-slate-200" />
          <div className="mt-3 h-6 w-36 rounded-lg bg-slate-200" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-white/75" />
      </div>
      <div className="mt-4 h-3 w-44 rounded-md bg-slate-200" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 rounded-md bg-slate-100 ${i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24"}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 rounded-md bg-slate-100 animate-pulse ${className}`} />
  );
}

export function SkeletonTableBody({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
