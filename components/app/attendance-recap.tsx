"use client";

import { Fragment, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import type { AttendanceRecapRow } from "@/app/attendance/page-data";

const statusConfig: Record<string, { label: string; className: string }> = {
  present: { label: "Hadir", className: "bg-emerald-100 text-emerald-700" },
  late: { label: "Terlambat", className: "bg-amber-100 text-amber-700" },
  excused: { label: "Izin", className: "bg-blue-100 text-blue-700" },
  absent: { label: "Tidak Hadir", className: "bg-red-100 text-red-700" },
  unrecorded: { label: "Belum Diisi", className: "bg-slate-100 text-slate-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.unrecorded;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
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
  icon: ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
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
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

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
  const totalStudentRecords = filtered.reduce(
    (acc, r) => acc + r.count_present + r.count_late + r.count_excused + r.count_absent,
    0
  );
  const totalPresent = filtered.reduce((acc, r) => acc + r.count_present, 0);
  const avgAttendance = totalStudentRecords > 0
    ? Math.round((totalPresent / totalStudentRecords) * 100)
    : 0;

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const resetFilters = () => {
    setFilterClass("");
    setFilterMentor("");
    setFilterMentorStatus("");
    setExpandedScheduleId(null);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="app-title-primary">Rekapitulasi Absensi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau kehadiran siswa dan mentor untuk seluruh jadwal kelas.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Total Sesi" value={totalSessions} color="bg-brand" />
        <SummaryCard icon={TrendingUp} label="Rata-rata Kehadiran" value={`${avgAttendance}%`} color="bg-emerald-500" />
        <SummaryCard icon={CheckCircle2} label="Siswa Hadir" value={totalPresent} color="bg-cyan-500" />
        <SummaryCard icon={Users} label="Total Rekap Siswa" value={totalStudentRecords} color="bg-violet-500" />
      </div>

      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Semua Kelas" value={filterClass} onChange={setFilterClass} options={classes} />
          <FilterSelect label="Semua Mentor" value={filterMentor} onChange={setFilterMentor} options={mentors} />

          <div className="relative">
            <select
              value={filterMentorStatus}
              onChange={(e) => setFilterMentorStatus(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand"
            >
              <option value="">Status Mentor (semua)</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="excused">Izin</option>
              <option value="absent">Tidak Hadir</option>
              <option value="unrecorded">Belum Diisi</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {(filterClass || filterMentor || filterMentorStatus) && (
            <button
              onClick={resetFilters}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              Reset filter
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Waktu Sesi</th>
                <th className="px-5 py-3.5">Kelas</th>
                <th className="px-5 py-3.5">Mentor</th>
                <th className="px-5 py-3.5 text-center">Status Mentor</th>
                <th className="px-5 py-3.5 text-center">Detail Siswa</th>
                <MetricHeader icon={CheckCircle2} label="Hadir" color="text-emerald-500" />
                <MetricHeader icon={Clock} label="Terlambat" color="text-amber-500" />
                <MetricHeader icon={BookOpen} label="Izin" color="text-blue-500" />
                <MetricHeader icon={XCircle} label="Absen" color="text-red-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const isExpanded = expandedScheduleId === row.schedule_id;
                return (
                  <Fragment key={row.schedule_id}>
                    <tr className="transition-colors hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{fmt(row.starts_at)}</td>
                      <td className="px-5 py-3.5 font-medium text-ink">{row.class_name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{row.mentor_name}</td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={row.mentor_status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedScheduleId(isExpanded ? null : row.schedule_id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/30 hover:bg-brand/5"
                        >
                          <ChevronRight size={14} className={`transition ${isExpanded ? "rotate-90" : ""}`} />
                          {row.students.length} siswa
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">{row.count_present}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-amber-600">{row.count_late}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-blue-600">{row.count_excused}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-red-500">{row.count_absent}</td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50/60 px-5 py-4">
                          <div className="rounded-2xl border border-slate-100 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-ink">Detail Absensi Siswa</p>
                                <p className="mt-0.5 text-xs text-slate-500">{row.class_name} - {fmt(row.starts_at)}</p>
                              </div>
                              <span className="rounded-full bg-[#EEF0FF] px-3 py-1 text-xs font-bold text-brand">
                                {row.students.length} siswa
                              </span>
                            </div>

                            {row.students.length > 0 ? (
                              <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-100">
                                <table className="w-full min-w-[560px] text-sm">
                                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                      <th className="px-4 py-3">No</th>
                                      <th className="px-4 py-3">Nama Siswa</th>
                                      <th className="px-4 py-3 text-center">Status</th>
                                      <th className="px-4 py-3">Catatan</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {row.students.map((student, index) => (
                                      <tr key={student.id} className="hover:bg-slate-50/70">
                                        <td className="w-14 px-4 py-3 text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-ink">{student.full_name}</td>
                                        <td className="px-4 py-3 text-center">
                                          <StatusBadge status={student.status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                          {student.notes || <span className="text-slate-400">Tidak ada catatan</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-400">
                                Belum ada siswa terdaftar di kelas ini.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center text-slate-400">
                    Belum ada data absensi yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {rows.length} sesi
          </div>
        )}
      </section>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function MetricHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: ElementType;
  label: string;
  color: string;
}) {
  return (
    <th className="px-5 py-3.5 text-center">
      <span className="inline-flex items-center gap-1">
        <Icon size={13} className={color} /> {label}
      </span>
    </th>
  );
}
