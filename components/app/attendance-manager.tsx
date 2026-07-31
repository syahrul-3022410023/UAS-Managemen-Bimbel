"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, UserCheck, CalendarDays, Users } from "lucide-react";
import { saveAttendance } from "@/app/attendance/actions";
import type { AttendanceSchedule } from "@/app/attendance/page-data";
import { EmptyState, EmptyStateRow } from "./empty-state";
import { DataTableShell } from "./data-table-shell";
import { AppSelect } from "./app-select";

const statusLabels: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  late: "Terlambat",
  excused: "Izin",
};

const studentStatusColor: Record<string, string> = {
  present: "text-emerald-600",
  late: "text-amber-600",
  excused: "text-blue-600",
  absent: "text-red-500",
};

export function AttendanceManager({ schedules }: { schedules: AttendanceSchedule[] }) {
  const [selectedId, setSelectedId] = useState(schedules[0]?.id ?? "");
  const selected = schedules.find((x) => x.id === selectedId);
  const [rows, setRows] = useState(selected?.students ?? []);
  const [mentorStatus, setMentorStatus] = useState(selected?.mentor_status ?? "present");
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const statusOptions = useMemo(
    () => Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
    []
  );
  const scheduleOptions = useMemo(
    () =>
      schedules.map((schedule) => ({
        value: schedule.id,
        label: `${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(schedule.starts_at))} - ${schedule.class_name}`,
      })),
    [schedules]
  );

  const pick = (id: string) => {
    const session = schedules.find((x) => x.id === id);
    setSelectedId(id);
    setRows(session?.students ?? []);
    setMentorStatus(session?.mentor_status ?? "present");
    setMessage(undefined);
  };

  const update = (studentId: string, key: "status" | "notes", value: string) =>
    setRows((current) =>
      current.map((row) => (row.id === studentId ? { ...row, [key]: value } : row))
    );

  const submit = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await saveAttendance(
        selected.id,
        rows.map(({ id, status, notes }) => ({ student_id: id, status, notes })),
        mentorStatus as "present" | "absent" | "late" | "excused"
      );
      setMessage(result.error ?? "Absensi berhasil disimpan.");
    });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="app-title-primary">Absensi Kelas Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Isi kehadiran Anda dan daftar hadir siswa pada jadwal yang Anda ampu.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft">
        <label className="block max-w-xl">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Pilih sesi jadwal</span>
          <AppSelect value={selectedId} onChange={pick} options={scheduleOptions} placeholder="Pilih jadwal" className="w-full" />
        </label>

        {!selected ? (
          <EmptyState
            icon={CalendarDays}
            title="Belum ada jadwal yang ditugaskan"
            description="Jadwal mengajar Anda akan muncul di sini setelah admin membuat jadwal untuk kelas Anda."
          />
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{selected.class_name}{selected.package_name ? ` - ${selected.package_name}` : ""}</p>
                <p className="text-sm text-slate-500">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(selected.starts_at))}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <UserCheck size={18} className="text-brand" />
                <span className="text-sm font-medium text-slate-700">Absensi saya:</span>
                <AppSelect value={mentorStatus} onChange={setMentorStatus} options={statusOptions} placeholder="" className="w-36" />
              </div>
            </div>

            <div className="mt-5">
              <DataTableShell
                icon={Users}
                title="Database Absensi Siswa"
                totalCount={rows.length}
                totalLabel="siswa di sesi ini"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="bg-slate-50/80 text-left text-[13px] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Siswa</th>
                        <th className="px-4 py-3">Status Kehadiran</th>
                        <th className="px-4 py-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-medium text-ink">{row.full_name}</td>
                          <td className="px-4 py-3">
                            <AppSelect
                              value={row.status}
                              onChange={(value) => update(row.id, "status", value)}
                              options={statusOptions}
                              placeholder=""
                              className="w-36"
                              buttonClassName={studentStatusColor[row.status] ?? ""}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={row.notes}
                              onChange={(e) => update(row.id, "notes", e.target.value)}
                              placeholder="Catatan (opsional)"
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand"
                            />
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <EmptyStateRow
                          colSpan={3}
                          icon={Users}
                          title="Belum ada siswa terdaftar"
                          description="Tambahkan siswa ke kelas ini melalui halaman Manajemen Kelas."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              </DataTableShell>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              {message && (
                <p className={message.includes("berhasil") ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
                  {message}
                </p>
              )}
              <button
                onClick={submit}
                disabled={isPending || rows.length === 0}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brandHover disabled:opacity-60"
              >
                <Save size={16} />
                {isPending ? "Menyimpan..." : "Simpan Absensi"}
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
