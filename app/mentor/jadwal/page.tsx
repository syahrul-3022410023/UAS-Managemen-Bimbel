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
    starts_at: string;
    ends_at: string;
    classes: { name: string }[] | null;
  };

  let schedules: ScheduleRow[] = [];
  if (mentor) {
    const { data } = await supabase
      .from("schedules")
      .select("id, starts_at, ends_at, classes(name)")
      .eq("mentor_id", mentor.id)
      .order("starts_at");
    schedules = (data ?? []) as unknown as ScheduleRow[];
  }

  // Format untuk ReadonlyCalendar (expects ReadonlySchedule[])
  const calendarSchedules = schedules.map((s) => ({
    id: s.id,
    class_name: s.classes?.[0]?.name ?? "Kelas",
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    room: null,
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
      </div>
    </AppShell>
  );
}
