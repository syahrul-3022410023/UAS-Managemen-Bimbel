"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Users, CheckCircle2, Clock, XCircle,
  BookOpen, ChevronDown, TrendingUp,
} from "lucide-react";
import type { AttendanceRecapRow } from "@/app/attendance/page-data";

const statusConfig: Record<string, { label: string; className: string }> = {
  present: { label: "Hadir", className: "bg-emerald-100 text-emerald-700" },
  late: { label: "Terlambat", className: "bg-amber-100 text-amber-700" },
  excused: { label: "Izin", className: "bg-blue-100 text-blue-700" },
  absent: { label: "Tidak Hadir", className: "bg-red-100 text-red-700" },
  "—": { label: "—", className: "bg-slate-100 text-slate-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig["—"];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-apple-soft">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

export function AttendanceRecap({ rows }: { rows: AttendanceRecapRow[] }) {
  const [filterClass, setFilterClass] = useState("");
  const [filterMentor, setFilterMentor] = useState("");
  const [filterMentorStatus, setFilterMentorStatus] = useState("");

  const classes = useMemo(
    () => [...new Set(rows.map((r) => r.class_name))].sort(),
    [rows]
  );
  const mentors = useMemo(
    () => [...new Set(rows.map((r) => r.mentor_name))].sort(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterClass && r.class_name !== filterClass) return false;
        if (filterMentor && r.mentor_name !== filterMentor) return false;
        if (filterMentorStatus && r.mentor_status !== filterMentorStatus) return false;
        return true;
      }),
    [rows, filterClass, filterMentor, filterMentorStatus]
  );

  const totalSessions = filtered.length;
  const totalStudentRecords = filtered.reduce((acc, r) => acc + r.count_present + r.count_late + r.count_excused + r.count_absent, 0);
  const totalPresent = filtered.reduce((acc, r) => acc + r.count_present, 0);
  const avgAttendance = totalStudentRecords > 0
    ? Math.round((totalPresent / totalStudentRecords) * 100)
    : 0;

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );

  return (
    <>
      <div className="mb-8">
        <h1 className="app-title-primary">Rekapitulasi Absensi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau kehadiran siswa dan mentor untuk seluruh jadwal kelas.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Total Sesi" value={totalSessions} color="bg-brand" />
        <SummaryCard icon={TrendingUp} label="Rata-rata Kehadiran" value={`${avgAttendance}%`} color="bg-emerald-500" />
        <SummaryCard icon={CheckCircle2} label="Siswa Hadir" value={totalPresent} color="bg-cyan-500" />
        <SummaryCard icon={Users} label="Total Rekap Siswa" value={totalStudentRecords} color="bg-violet-500" />
      </div>

      {/* Filter Bar */}
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-apple-soft">
        <div className="flex flex-wrap gap-3">
          {/* Filter Kelas */}
          <div className="relative">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Filter Mentor */}
          <div className="relative">
            <select
              value={filterMentor}
              onChange={(e) => setFilterMentor(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Semua Mentor</option>
              {mentors.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Filter Status Mentor */}
          <div className="relative">
            <select
              value={filterMentorStatus}
              onChange={(e) => setFilterMentorStatus(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="">Status Mentor (semua)</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="excused">Izin</option>
              <option value="absent">Tidak Hadir</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {(filterClass || filterMentor || filterMentorStatus) && (
            <button
              onClick={() => { setFilterClass(""); setFilterMentor(""); setFilterMentorStatus(""); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            >
              Reset filter
            </button>
          )}
        </div>
      </section>

      {/* Recap Table */}
      <section className="rounded-2xl border border-slate-100 bg-white shadow-apple-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Waktu Sesi</th>
                <th className="px-5 py-3.5">Kelas</th>
                <th className="px-5 py-3.5">Mentor</th>
                <th className="px-5 py-3.5 text-center">Status Mentor</th>
                <th className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" /> Hadir
                  </span>
                </th>
                <th className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-amber-500" /> Terlambat
                  </span>
                </th>
                <th className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={13} className="text-blue-500" /> Izin
                  </span>
                </th>
                <th className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1">
                    <XCircle size={13} className="text-red-500" /> Absen
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.schedule_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{fmt(row.starts_at)}</td>
                  <td className="px-5 py-3.5 font-medium text-ink">{row.class_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.mentor_name}</td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={row.mentor_status} />
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">{row.count_present}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-amber-600">{row.count_late}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-blue-600">{row.count_excused}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-red-500">{row.count_absent}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-slate-400">
                    Belum ada data absensi yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {rows.length} sesi
          </div>
        )}
      </section>
    </>
  );
}
