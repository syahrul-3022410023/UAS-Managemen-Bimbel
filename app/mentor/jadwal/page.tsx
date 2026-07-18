import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReadonlyCalendar } from "@/components/app/readonly-calendar";

export const metadata = {
  title: "Jadwal Saya | BimbelPro",
  description: "Jadwal mengajar mentor",
};

export default async function MentorJadwalPage() {
  const user = await requireRole(["mentor"]);
  const supabase = await createSupabaseServerClient();

  // Cari mentor record dari profile_id
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, full_name")
    .eq("profile_id", user.id)
    .maybeSingle();

  type ScheduleRow = {
    id: string;
    class_id: string;
    starts_at: string;
    ends_at: string;
    room: string | null;
    class_name: string;
    subject_name: string;
    package_name: string;
    student_names: string[];
  };

  let schedules: ScheduleRow[] = [];
  if (mentor) {
    const { data: scheduleRows } = await supabase
      .from("schedules")
      .select("id, class_id, starts_at, ends_at, room")
      .eq("mentor_id", mentor.id)
      .order("starts_at");
    const classIds = [...new Set((scheduleRows ?? []).map((item) => item.class_id))];
    const [{ data: classes }, { data: subjects }, { data: packages }, { data: studentClasses }, { data: students }] = await Promise.all([
      classIds.length ? supabase.from("classes").select("id, name, subject_id, package_id").in("id", classIds) : Promise.resolve({ data: [] }),
      supabase.from("subjects").select("id, name"),
      supabase.from("packages").select("id, name"),
      classIds.length ? supabase.from("student_classes").select("class_id, student_id").in("class_id", classIds) : Promise.resolve({ data: [] }),
      supabase.from("students").select("id, full_name")
    ]);
    const classMap = new Map((classes ?? []).map((item) => [item.id, item]));
    const subjectMap = new Map((subjects ?? []).map((item) => [item.id, item.name]));
    const packageMap = new Map((packages ?? []).map((item) => [item.id, item.name]));
    const studentMap = new Map((students ?? []).map((item) => [item.id, item.full_name]));
    schedules = (scheduleRows ?? []).map((item) => {
      const classRow = classMap.get(item.class_id);
      return {
        id: item.id,
        class_id: item.class_id,
        starts_at: item.starts_at,
        ends_at: item.ends_at,
        room: item.room,
        class_name: classRow?.name ?? "Kelas",
        subject_name: classRow?.subject_id ? subjectMap.get(classRow.subject_id) ?? "-" : "-",
        package_name: classRow?.package_id ? packageMap.get(classRow.package_id) ?? "Semua Paket" : "Semua Paket",
        student_names: (studentClasses ?? []).filter((row) => row.class_id === item.class_id).map((row) => studentMap.get(row.student_id)).filter(Boolean) as string[],
      };
    });
  }

  // Format untuk ReadonlyCalendar (expects ReadonlySchedule[])
  const calendarSchedules = schedules.map((s) => ({
    id: s.id,
    class_name: s.class_name,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    room: s.room,
    mentor_name: mentor?.full_name ?? "",
  }));

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Jadwal Saya"
      activeNav="Jadwal"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jadwal Mengajar</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mentor ? `Jadwal untuk ${mentor.full_name}` : "Data mentor tidak ditemukan"}
          </p>
        </div>

        {!mentor ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-700">
            Data mentor untuk akun ini belum tersedia. Hubungi admin untuk mengatur profil mentor.
          </div>
        ) : calendarSchedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-400 text-sm">Belum ada jadwal yang ditetapkan.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <ReadonlyCalendar schedules={calendarSchedules} />
          </div>
        )}

        {mentor && schedules.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="divide-y divide-slate-100 sm:hidden">
              {schedules.map((schedule) => {
                const done = new Date(schedule.ends_at) < new Date();
                return (
                  <article key={schedule.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-ink">{schedule.subject_name}</h2>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">{new Intl.DateTimeFormat("id-ID", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(schedule.starts_at))} - {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(schedule.ends_at))}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{done ? "Selesai" : "Terjadwal"}</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <MobileInfo label="Siswa" value={schedule.student_names.length ? schedule.student_names.join(", ") : "-"} />
                      <MobileInfo label="Paket" value={schedule.package_name} />
                      <MobileInfo label="Lokasi" value={schedule.room ?? "-"} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Mata Pelajaran</th>
                    <th className="px-5 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-5 py-3 font-semibold">Jam Mengajar</th>
                    <th className="px-5 py-3 font-semibold">Paket</th>
                    <th className="px-5 py-3 font-semibold">Lokasi</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((schedule) => {
                    const done = new Date(schedule.ends_at) < new Date();
                    return (
                      <tr key={schedule.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-semibold text-ink">{schedule.subject_name}</td>
                        <td className="max-w-[260px] px-5 py-4 text-slate-600">{schedule.student_names.length ? schedule.student_names.join(", ") : "-"}</td>
                        <td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("id-ID", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(schedule.starts_at))} - {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(schedule.ends_at))}</td>
                        <td className="px-5 py-4 text-slate-600">{schedule.package_name}</td>
                        <td className="px-5 py-4 text-slate-600">{schedule.room ?? "-"}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-[#EEF0FF] px-2.5 py-1 text-xs font-bold text-brand">{done ? "Selesai" : "Terjadwal"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-600">{value}</span>
    </div>
  );
}
