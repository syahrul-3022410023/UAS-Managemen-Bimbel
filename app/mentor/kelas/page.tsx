import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, BookOpen, CalendarDays, Clock } from "lucide-react";

export const metadata = {
  title: "Kelas Saya | BimbelPro",
  description: "Daftar kelas yang diampu mentor",
};

type KelasDetail = {
  id: string;
  name: string;
  description: string | null;
  subjects: { name: string } | null;
  totalSiswa: number;
  jadwalBerikutnya: string | null;
};

export default async function MentorKelasPage() {
  const user = await requireRole(["mentor"]);
  const supabase = await createSupabaseServerClient();

  // Cari mentor record
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, full_name")
    .eq("profile_id", user.id)
    .maybeSingle();

  let kelasList: KelasDetail[] = [];

  if (mentor) {
    // Ambil kelas yang diampu
    const { data: assignments } = await supabase
      .from("mentor_assignments")
      .select("class_id, classes(id, name, description, subject_id, subjects(name))")
      .eq("mentor_id", mentor.id);

    if (assignments?.length) {
      const classIds = assignments.map((a) => a.class_id);

      // Hitung total siswa per kelas
      const { data: enrollments } = await supabase
        .from("student_classes")
        .select("class_id, student_id")
        .in("class_id", classIds);

      // Jadwal berikutnya per kelas
      const now = new Date().toISOString();
      const { data: schedules } = await supabase
        .from("schedules")
        .select("class_id, starts_at")
        .in("class_id", classIds)
        .gte("starts_at", now)
        .order("starts_at");

      kelasList = assignments.map((a) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cls = a.classes as any;
        const siswaCount = (enrollments ?? []).filter((e) => e.class_id === a.class_id).length;
        const nextSchedule = (schedules ?? []).find((s) => s.class_id === a.class_id);

        return {
          id: a.class_id,
          name: cls?.name ?? "-",
          description: cls?.description ?? null,
          subjects: cls?.subjects ?? null,
          totalSiswa: siswaCount,
          jadwalBerikutnya: nextSchedule?.starts_at ?? null,
        };
      });
    }
  }

  function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  }

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Kelas Saya"
      activeNav="Kelas"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelas Saya</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mentor
              ? `Daftar kelas yang diampu oleh ${mentor.full_name}`
              : "Data mentor tidak ditemukan"}
          </p>
        </div>

        {/* Summary */}
        {mentor && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-sm">
              <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <BookOpen size={15} strokeWidth={2.2} />
              </div>
              <p className="text-sm font-semibold text-ink">Kelas</p>
              <p className="mt-5 text-[28px] font-semibold leading-none text-ink">{kelasList.length}</p>
              <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">Kelas yang diampu</p>
            </div>
            <div className="rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-sm">
              <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Users size={15} strokeWidth={2.2} />
              </div>
              <p className="text-sm font-semibold text-ink">Siswa</p>
              <p className="mt-5 text-[28px] font-semibold leading-none text-ink">
                {kelasList.reduce((s, k) => s + k.totalSiswa, 0)}
              </p>
              <p className="mt-3 text-xs font-normal leading-snug text-slate-500/70">Dari seluruh kelas</p>
            </div>
          </div>
        )}

        {/* No mentor */}
        {!mentor && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-700">
            Data mentor untuk akun ini belum tersedia. Hubungi admin.
          </div>
        )}

        {/* Empty state */}
        {mentor && kelasList.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="text-slate-500 font-medium">Belum ada kelas yang ditetapkan</p>
            <p className="text-slate-400 text-sm mt-1">Admin akan menetapkan kelas yang Anda ampu.</p>
          </div>
        )}

        {/* Kelas list */}
        {kelasList.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kelasList.map((kelas) => (
              <div
                key={kelas.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Mata pelajaran badge */}
                {kelas.subjects?.name && (
                  <span className="inline-block mb-3 text-xs font-medium bg-blue-50 text-brand rounded-full px-2.5 py-0.5">
                    {kelas.subjects.name}
                  </span>
                )}

                {/* Nama kelas */}
                <h3 className="text-base font-semibold text-slate-800 mb-1">{kelas.name}</h3>
                {kelas.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{kelas.description}</p>
                )}

                {/* Stats */}
                <div className="space-y-2 border-t border-slate-100 pt-3 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users size={14} className="text-slate-400 shrink-0" />
                    <span>{kelas.totalSiswa} siswa terdaftar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {kelas.jadwalBerikutnya ? (
                      <>
                        <CalendarDays size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-600 font-medium">
                          {formatDateTime(kelas.jadwalBerikutnya)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-slate-300 shrink-0" />
                        <span className="text-slate-400">Belum ada jadwal berikutnya</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
