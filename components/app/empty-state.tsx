// Empty State Component
// Heuristik H10: Help and documentation
// Empty state harus punya CTA jelas, bukan cuma teks kosong

import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** Untuk tampilan dalam tabel (colSpan) */
  colSpan?: number;
  /** Mode compact untuk tabel, default false (kartu besar) */
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          <Icon size={22} />
        </div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        {description && <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brandHover"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm">
        <Icon size={26} className="text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-600">{title}</p>
        {description && <p className="mt-1 text-xs text-slate-400 max-w-[280px]">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Wrapper khusus untuk dipakai sebagai <td> di dalam tabel */
export function EmptyStateRow({ colSpan, ...props }: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10">
        <EmptyState {...props} compact />
      </td>
    </tr>
  );
}
