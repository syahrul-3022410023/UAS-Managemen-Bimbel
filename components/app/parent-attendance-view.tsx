"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Clock, BookOpen, XCircle, Users } from "lucide-react";
import { DataTableShell } from "./data-table-shell";
import { EmptyStateRow } from "./empty-state";
import { KpiCard } from "./kpi-card";
import { AppSelect } from "./app-select";

type AttendanceRow = {
  student_name: string;
  class_name: string;
  session_date: Date | null;
  recorded_at: Date | null;
  status: string;
  notes: string | null;
};

const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ElementType; iconClass: string }> = {
  present: { label: "Hadir", badgeClass: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconClass: "text-emerald-500" },
  late: { label: "Terlambat", badgeClass: "bg-amber-100 text-amber-700", icon: Clock, iconClass: "text-amber-500" },
  excused: { label: "Izin", badgeClass: "bg-blue-100 text-blue-700", icon: BookOpen, iconClass: "text-blue-500" },
  absent: { label: "Tidak Hadir", badgeClass: "bg-red-100 text-red-700", icon: XCircle, iconClass: "text-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status];
  if (!cfg) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}>
      <cfg.icon size={11} />
      {cfg.label}
    </span>
  );
}

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

export function ParentAttendanceView({
  rows,
  children,
}: {
  rows: AttendanceRow[];
  children: string[];
}) {
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const childOptions = children.map((name) => ({ value: name, label: name }));
  const statusOptions = [
    { value: "present", label: "Hadir" },
    { value: "late", label: "Terlambat" },
    { value: "excused", label: "Izin" },
    { value: "absent", label: "Tidak Hadir" },
  ];

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterStudent && r.student_name !== filterStudent) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        return true;
      }),
    [rows, filterStudent, filterStatus]
  );

  // Summary counts per status
  const countOf = (s: string) => rows.filter((r) => r.status === s).length;
  const total = rows.length;

  return (
    <>
      <div className="mb-8">
        <h1 className="app-title-primary">Riwayat Absensi Anak</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau kehadiran {children.length > 1 ? "anak-anak" : "anak"} Anda pada setiap sesi bimbingan.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sesi", value: total, icon: Users, tone: "payroll" as const },
          { label: "Hadir", value: countOf("present"), icon: CheckCircle2, tone: "income" as const },
          { label: "Izin / Terlambat", value: countOf("excused") + countOf("late"), icon: Clock, tone: "balance" as const },
          { label: "Tidak Hadir", value: countOf("absent"), icon: XCircle, tone: "expense" as const },
        ].map(({ label, value, icon, tone }) => (
          <KpiCard key={label} icon={icon} label={label} value={String(value)} detail="Berdasarkan filter aktif" tone={tone} />
        ))}
      </div>

      <DataTableShell
        icon={Users}
        title="Database Absensi"
        totalCount={rows.length}
        totalLabel="catatan absensi"
        shownCount={filtered.length}
        controls={
          <>
            {children.length > 1 && (
              <AppSelect value={filterStudent} onChange={setFilterStudent} options={childOptions} placeholder="Semua Anak" className="w-40" />
            )}
            <AppSelect value={filterStatus} onChange={setFilterStatus} options={statusOptions} placeholder="Semua Status" className="w-40" />
            {(filterStudent || filterStatus) && (
              <button
                onClick={() => { setFilterStudent(""); setFilterStatus(""); }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
              >
                Reset filter
              </button>
            )}
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50/80 text-left text-[13px] text-slate-500">
              <tr>
                {children.length > 1 && <th className="px-5 py-3.5">Nama Anak</th>}
                <th className="px-5 py-3.5">Kelas</th>
                <th className="px-5 py-3.5">Sesi</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  {children.length > 1 && (
                    <td className="px-5 py-3.5 font-medium text-ink">{row.student_name}</td>
                  )}
                  <td className="px-5 py-3.5 text-slate-700">{row.class_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    {fmt(row.session_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{row.notes || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <EmptyStateRow
                  colSpan={children.length > 1 ? 5 : 4}
                  icon={Users}
                  title="Belum ada riwayat absensi"
                  description="Riwayat kehadiran anak akan muncul setelah absensi sesi tersimpan."
                />
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {rows.length} catatan
          </div>
        )}
      </DataTableShell>
    </>
  );
}
