"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AttendanceRecapRow } from "@/app/attendance/page-data";
import { EmptyStateRow } from "./empty-state";
import { KpiCard } from "./kpi-card";
import { AppSelect } from "./app-select";

const statusConfig: Record<string, { label: string; className: string }> = {
  present: { label: "Hadir", className: "bg-emerald-100 text-emerald-700" },
  late: { label: "Terlambat", className: "bg-amber-100 text-amber-700" },
  excused: { label: "Izin", className: "bg-blue-100 text-blue-700" },
  absent: { label: "Tidak Hadir", className: "bg-red-100 text-red-700" },
  unrecorded: { label: "Belum Diisi", className: "bg-slate-100 text-slate-500" },
};

type SortKey = "starts_at" | "class_name" | "mentor_name" | "mentor_status" | "total_students" | "count_present" | "count_absent";
type SortDirection = "asc" | "desc";

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
];

const mentorStatusOptions = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "excused", label: "Izin" },
  { value: "absent", label: "Tidak Hadir" },
  { value: "unrecorded", label: "Belum Diisi" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.unrecorded;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
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
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  detail: string;
}) {
  const tone = color.includes("sky") || color.includes("cyan") ? "balance" : color.includes("blue") ? "payroll" : "income";
  return <KpiCard icon={Icon} label={label} value={String(value)} detail={detail} tone={tone} />;
}

export function AttendanceRecap({ rows }: { rows: AttendanceRecapRow[] }) {
  const searchParams = useSearchParams();
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterMentorStatus, setFilterMentorStatus] = useState("");
  const [filterClass, setFilterClass] = useState(searchParams.get("classId") ?? "");
  const [filterMentor, setFilterMentor] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("starts_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const packages = useMemo(
    () => [...new Map(rows.flatMap((r) => r.package_options.map((pkg) => [pkg.id, pkg.name] as const))).entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [rows]
  );

  const packageScopedRows = useMemo(
    () => rows.filter((row) => !filterPackage || row.package_id === filterPackage || (!row.package_id && row.package_options.some((pkg) => pkg.id === filterPackage))),
    [filterPackage, rows]
  );

  const classes = useMemo(
    () => [...new Map(packageScopedRows.map((r) => [r.class_id, r.class_name])).entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [packageScopedRows]
  );

  const classScopedRows = useMemo(
    () => packageScopedRows.filter((row) => !filterClass || row.class_id === filterClass),
    [filterClass, packageScopedRows]
  );

  const mentors = useMemo(
    () => [...new Set(classScopedRows.map((r) => r.mentor_name))]
      .sort()
      .map((name) => ({ value: name, label: name })),
    [classScopedRows]
  );
  const students = useMemo(
    () => [...new Set(classScopedRows.flatMap((r) => r.student_names ?? []))]
      .sort()
      .map((name) => ({ value: name, label: name })),
    [classScopedRows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!matchesPeriod(r.starts_at, filterPeriod)) return false;
        if (filterMentorStatus && r.mentor_status !== filterMentorStatus) return false;
        if (filterClass && r.class_id !== filterClass) return false;
        if (filterMentor && r.mentor_name !== filterMentor) return false;
        if (filterPackage && r.package_id !== filterPackage && !(!r.package_id && r.package_options.some((pkg) => pkg.id === filterPackage))) return false;
        if (filterStudent && !(r.student_names ?? []).includes(filterStudent)) return false;
        return true;
      }),
    [rows, filterClass, filterMentor, filterMentorStatus, filterPackage, filterPeriod, filterStudent]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const result = compareRows(a, b, sortKey);
        return sortDirection === "asc" ? result : -result;
      }),
    [filtered, sortDirection, sortKey]
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
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [page, sorted]
  );
  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }),
    []
  );
  const fromRow = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [filterClass, filterMentor, filterMentorStatus, filterPackage, filterPeriod, filterStudent, sortDirection, sortKey]);

  useEffect(() => {
    if (!filterPackage) {
      if (filterClass) setFilterClass("");
      if (filterMentor) setFilterMentor("");
      if (filterStudent) setFilterStudent("");
      return;
    }
    if (filterClass && !classes.some((classOption) => classOption.value === filterClass)) setFilterClass("");
    if (filterMentor && !mentors.some((mentor) => mentor.value === filterMentor)) setFilterMentor("");
    if (filterStudent && !students.some((student) => student.value === filterStudent)) setFilterStudent("");
  }, [classes, filterClass, filterMentor, filterPackage, filterStudent, mentors, students]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const fmt = (iso: string) => dateTimeFormatter.format(new Date(iso));

  const resetFilters = () => {
    setFilterPeriod("month");
    setFilterMentorStatus("");
    setFilterClass("");
    setFilterMentor("");
    setFilterPackage("");
    setFilterStudent("");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "starts_at" ? "desc" : "asc");
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
          <FilterSelect label="Periode" value={filterPeriod} onChange={setFilterPeriod} options={periodOptions} includeEmpty={false} />
          <FilterSelect label="Semua Status" value={filterMentorStatus} onChange={setFilterMentorStatus} options={mentorStatusOptions} selectedPrefix="Status" emptyOptionLabel="Semua Status" />
          <FilterSelect label="Semua Paket" value={filterPackage} onChange={setFilterPackage} options={packages} selectedPrefix="Paket" emptyOptionLabel="Semua Paket" />
          <FilterSelect label="Pilih paket dulu" value={filterClass} onChange={setFilterClass} options={classes} selectedPrefix="Kelas" emptyOptionLabel={filterPackage ? "Semua Kelas" : "Kelas belum tersedia"} disabled={!filterPackage} />
          <FilterSelect label="Pilih kelas dulu" value={filterMentor} onChange={setFilterMentor} options={mentors} selectedPrefix="Mentor" emptyOptionLabel={filterClass ? "Semua Mentor" : "Mentor belum tersedia"} disabled={!filterPackage || !filterClass} />
          <FilterSelect label="Pilih kelas dulu" value={filterStudent} onChange={setFilterStudent} options={students} selectedPrefix="Siswa" emptyOptionLabel={filterClass ? "Semua Siswa" : "Siswa belum tersedia"} disabled={!filterPackage || !filterClass} />

          {(filterPeriod !== "month" || filterClass || filterPackage || filterMentor || filterStudent || filterMentorStatus) && (
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
            <thead className="bg-slate-50/80 text-left text-[13px] text-slate-500">
              <tr>
                <SortableHeader label="Waktu Sesi" sortKey="starts_at" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Kelas" sortKey="class_name" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="px-5 py-3.5">Paket</th>
                <SortableHeader label="Mentor" sortKey="mentor_name" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="px-5 py-3.5">Siswa</th>
                <SortableHeader label="Status Mentor" sortKey="mentor_status" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} align="center" />
                <SortableHeader label="Jumlah Siswa" sortKey="total_students" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} align="center" />
                <MetricHeader icon={CheckCircle2} label="Hadir" color="text-emerald-500" sortKey="count_present" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <MetricHeader icon={Clock} label="Terlambat" color="text-amber-500" />
                <MetricHeader icon={BookOpen} label="Izin" color="text-blue-500" />
                <MetricHeader icon={XCircle} label="Absen" color="text-red-500" sortKey="count_absent" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.schedule_id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{fmt(row.starts_at)}</td>
                  <td className="px-5 py-3.5 text-ink">{row.class_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.package_name ?? "Semua paket"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.mentor_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.student_names.length ? row.student_names.join(", ") : "-"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={row.mentor_status} />
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-slate-600">{row.total_students} siswa</td>
                  <td className="px-5 py-3.5 text-center font-medium text-emerald-600">{row.count_present}</td>
                  <td className="px-5 py-3.5 text-center font-medium text-amber-600">{row.count_late}</td>
                  <td className="px-5 py-3.5 text-center font-medium text-blue-600">{row.count_excused}</td>
                  <td className="px-5 py-3.5 text-center font-medium text-red-500">{row.count_absent}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <EmptyStateRow
                  colSpan={11}
                  icon={CalendarDays}
                  title="Belum ada data absensi"
                  description="Coba ubah filter atau pastikan absensi sudah tersimpan."
                />
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
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
  includeEmpty = true,
  selectedPrefix,
  emptyOptionLabel,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  includeEmpty?: boolean;
  selectedPrefix?: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
}) {
  return (
    <AppSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={includeEmpty ? emptyOptionLabel ?? label : ""}
      optionPrefix={selectedPrefix}
      disabled={disabled}
      className="w-[180px]"
    />
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "center";
}) {
  const active = sortKey === activeKey;
  return (
    <th className={`px-5 py-3.5 ${align === "center" ? "text-center" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 font-medium transition hover:text-brand ${active ? "text-brand" : ""}`}
      >
        {label}
        <ChevronsUpDown size={13} className={active ? "text-brand" : "text-slate-300"} />
        <span className="sr-only">{active ? `Urut ${direction}` : "Urutkan"}</span>
      </button>
    </th>
  );
}

function MetricHeader({
  icon: Icon,
  label,
  color,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  icon: ElementType;
  label: string;
  color: string;
  sortKey?: SortKey;
  activeKey?: SortKey;
  direction?: SortDirection;
  onSort?: (key: SortKey) => void;
}) {
  const active = sortKey && activeKey === sortKey;
  const content = (
    <span className={`inline-flex items-center gap-1 ${active ? "text-brand" : ""}`}>
      <Icon size={13} className={color} /> {label}
      {sortKey && <ChevronsUpDown size={13} className={active ? "text-brand" : "text-slate-300"} />}
      {active && direction && <span className="sr-only">Urut {direction}</span>}
    </span>
  );

  return (
    <th className="px-5 py-3.5 text-center">
      {sortKey && onSort ? (
        <button type="button" onClick={() => onSort(sortKey)} className="font-medium transition hover:text-brand">
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  );
}

function matchesPeriod(value: string, period: string) {
  if (period === "all") return true;
  const date = new Date(value);
  const now = new Date();
  if (period === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return date >= start && date < end;
  }
  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function compareRows(a: AttendanceRecapRow, b: AttendanceRecapRow, key: SortKey) {
  if (key === "starts_at") return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  if (key === "total_students" || key === "count_present" || key === "count_absent") return a[key] - b[key];
  return String(a[key]).localeCompare(String(b[key]), "id-ID");
}
