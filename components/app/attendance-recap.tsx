"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
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
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  color: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ECEEF5] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon size={15} strokeWidth={2.2} className="text-white" />
        </div>
        <p className="min-w-0 text-sm font-semibold text-ink">{label}</p>
      </div>
      <p className="mt-7 text-[28px] font-semibold leading-none text-ink">{value}</p>
      <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">{detail}</p>
    </div>
  );
}

export function AttendanceRecap({ rows }: { rows: AttendanceRecapRow[] }) {
  const [filterClass, setFilterClass] = useState("");
  const [filterMentor, setFilterMentor] = useState("");
  const [filterMentorStatus, setFilterMentorStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );
  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }),
    []
  );
  const fromRow = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [filterClass, filterMentor, filterMentorStatus]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const fmt = (iso: string) => dateTimeFormatter.format(new Date(iso));

  const resetFilters = () => {
    setFilterClass("");
    setFilterMentor("");
    setFilterMentorStatus("");
  };

  return (
    <div className="attendance-recap-page">
      <div className="mb-8">
        <h1 className="app-title-primary">Rekapitulasi Absensi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau kehadiran siswa dan mentor untuk seluruh jadwal kelas.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Sesi" value={totalSessions} detail="Jadwal tampil" color="bg-brand" />
        <SummaryCard icon={TrendingUp} label="Rata-rata Hadir" value={`${avgAttendance}%`} detail="Dari rekap siswa" color="bg-sky-500" />
        <SummaryCard icon={CheckCircle2} label="Hadir" value={totalPresent} detail="Siswa hadir" color="bg-cyan-500" />
        <SummaryCard icon={Users} label="Rekap Siswa" value={totalStudentRecords} detail="Total catatan" color="bg-blue-500" />
      </div>

      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-3">
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

      <section className="attendance-table-shell rounded-2xl border border-slate-100 bg-white">
        <div className="attendance-table-static">
          <table className="attendance-table w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Waktu Sesi</th>
                <th className="px-5 py-3.5">Kelas</th>
                <th className="px-5 py-3.5">Mentor</th>
                <th className="px-5 py-3.5 text-center">Status Mentor</th>
                <th className="px-5 py-3.5 text-center">Jumlah Siswa</th>
                <MetricHeader icon={CheckCircle2} label="Hadir" color="text-emerald-500" />
                <MetricHeader icon={Clock} label="Terlambat" color="text-amber-500" />
                <MetricHeader icon={BookOpen} label="Izin" color="text-blue-500" />
                <MetricHeader icon={XCircle} label="Absen" color="text-red-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.schedule_id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{fmt(row.starts_at)}</td>
                  <td className="px-5 py-3.5 font-medium text-ink">{row.class_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.mentor_name}</td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={row.mentor_status} />
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-600">{row.total_students} siswa</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">{row.count_present}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-amber-600">{row.count_late}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-blue-600">{row.count_excused}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-red-500">{row.count_absent}</td>
                </tr>
              ))}

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
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Menampilkan {fromRow}-{toRow} dari {filtered.length} sesi
              {filtered.length !== rows.length ? `, tersaring dari ${rows.length}` : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="px-1 text-slate-400">
                  {page}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
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
