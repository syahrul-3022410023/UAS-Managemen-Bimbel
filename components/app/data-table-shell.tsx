"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";

type DataTableShellProps = {
  icon: LucideIcon;
  title: string;
  totalLabel: string;
  totalCount: number;
  shownCount?: number;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  controls?: ReactNode;
  children: ReactNode;
};

export function DataTableShell({
  icon: Icon,
  title,
  totalLabel,
  totalCount,
  shownCount,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  controls,
  children,
}: DataTableShellProps) {
  return (
    <section className="app-data-table-shell overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-apple-soft">
      <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand/10 text-brand">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                  {totalCount} {totalLabel}
                </span>
                {shownCount !== undefined ? <span>{shownCount} tampil</span> : null}
              </div>
            </div>
          </div>

          {onSearchChange ? (
            <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-slate-400 transition focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/10 lg:max-w-[560px]">
              <Search size={17} className="shrink-0" />
              <input
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="master-table-search-input min-w-0 flex-1 appearance-none border-none bg-transparent p-0 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              />
            </label>
          ) : null}
        </div>

        {controls ? <div className="mt-4 flex flex-wrap gap-2">{controls}</div> : null}
      </div>

      {children}
    </section>
  );
}
