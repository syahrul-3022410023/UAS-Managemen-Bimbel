"use client";

import { useState, useTransition } from "react";
import { Save, UserCheck } from "lucide-react";
import { saveAttendance } from "@/app/attendance/actions";
import type { AttendanceSchedule } from "@/app/attendance/page-data";

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

      {/* Session Picker */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-apple-soft">
        <label className="block max-w-xl">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Pilih sesi jadwal</span>
          <select
            value={selectedId}
            onChange={(e) => pick(e.target.value)}
            className="input"
          >
            <option value="">Pilih jadwal</option>
            {schedules.map((x) => (
              <option key={x.id} value={x.id}>
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(x.starts_at)
                )}{" "}
                — {x.class_name}
              </option>
            ))}
          </select>
        </label>

        {!selected ? (
          <p className="py-12 text-center text-slate-400">
            Belum ada jadwal yang ditugaskan kepada Anda.
          </p>
        ) : (
          <>
            {/* Session Info + Mentor Self-Attendance */}
            <div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{selected.class_name}</p>
                <p className="text-sm text-slate-500">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(
                    new Date(selected.starts_at)
                  )}
                </p>
              </div>

              {/* Mentor Self-Attendance */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <UserCheck size={18} className="text-brand" />
                <span className="text-sm font-medium text-slate-700">Absensi saya:</span>
                <select
                  value={mentorStatus}
                  onChange={(e) => setMentorStatus(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Attendance Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Status Kehadiran</th>
                    <th className="px-4 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{row.full_name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          onChange={(e) => update(row.id, "status", e.target.value)}
                          className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium outline-none focus:border-brand ${studentStatusColor[row.status] ?? ""}`}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
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
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                        Belum ada siswa terdaftar di kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-4">
              {message && (
                <p className={message.includes("berhasil") ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
                  {message}
                </p>
              )}
              <button
                onClick={submit}
                disabled={isPending || rows.length === 0}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60 transition"
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
