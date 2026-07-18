"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Clock, BookOpen, XCircle, ChevronDown, Users } from "lucide-react";

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
          { label: "Sesi", value: total, color: "bg-brand", icon: Users },
          { label: "Hadir", value: countOf("present"), color: "bg-sky-500", icon: CheckCircle2 },
          { label: "Izin / Terlambat", value: countOf("excused") + countOf("late"), color: "bg-cyan-500", icon: Clock },
          { label: "Tidak Hadir", value: countOf("absent"), color: "bg-blue-500", icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-apple-soft">
            <div className={`mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon size={15} strokeWidth={2.2} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="mt-5 text-[28px] font-semibold leading-none text-ink">{value}</p>
            <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">Berdasarkan filter aktif</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      {(children.length > 1 || true) && (
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Filter Anak */}
          {children.length > 1 && (
            <div className="relative">
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              >
                <option value="">Semua Anak</option>
                {children.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          )}

          {/* Filter Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Semua Status</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="excused">Izin</option>
              <option value="absent">Tidak Hadir</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {(filterStudent || filterStatus) && (
            <button
              onClick={() => { setFilterStudent(""); setFilterStatus(""); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-apple-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
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
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-slate-400">
                    Belum ada riwayat absensi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {rows.length} catatan
          </div>
        )}
      </section>
    </>
  );
}
