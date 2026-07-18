import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReadonlyCalendar } from "@/components/app/readonly-calendar";

export const metadata = {
  title: "Jadwal Saya | BimbelPro",
  description: "Jadwal mengajar mentor",
};

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

export default async function MentorJadwalPage() {
  const user = await requireRole(["mentor"]);
  const supabase = await createSupabaseServerClient();

  // Cari mentor record dari profile_id
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, full_name")
    .eq("profile_id", user.id)
    .maybeSingle();

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
    subject_name: s.subject_name,
    package_name: s.package_name,
    student_names: s.student_names,
  }));
  const groupedSchedules = groupByDay(schedules);

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
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-400 text-sm">Belum ada jadwal yang ditetapkan.</p>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-ink">Daftar Aktivitas Mengajar</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {groupedSchedules.map((group) => (
                  <div key={group.dayKey} className="grid gap-4 px-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div>
                      <p className="text-lg font-bold text-ink">{group.dayLabel}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">{group.items.length} sesi</p>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((schedule) => (
                        <article key={schedule.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-ink">{formatTime(schedule.starts_at)} - {formatTime(schedule.ends_at)}</p>
                              <p className="mt-1 font-semibold text-brand">{schedule.subject_name}</p>
                              <p className="mt-0.5 text-sm text-slate-500">{schedule.class_name}{schedule.room ? ` - ${schedule.room}` : ""}</p>
                            </div>
                            <div className="sm:max-w-xs sm:text-right">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Siswa</p>
                              <p className="mt-1 text-sm font-medium text-slate-700">{schedule.student_names.length ? schedule.student_names.join(", ") : "-"}</p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-bold text-ink">Kalender Bulanan</h2>
              </div>
              <ReadonlyCalendar schedules={calendarSchedules} />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

function groupByDay(schedules: ScheduleRow[]) {
  const map = new Map<string, ScheduleRow[]>();
  for (const schedule of schedules) {
    const key = schedule.starts_at.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), schedule]);
  }
  return [...map.entries()].map(([dayKey, items]) => ({
    dayKey,
    dayLabel: new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(items[0].starts_at)),
    items,
  }));
}
