"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const money = z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0));
const optionalUuid = z.union([z.string().uuid(), z.literal("")]).optional();
const classSchema = z.object({ name: z.string().min(2), mentor_ids: z.array(z.string().uuid()).min(1, "Pilih minimal satu mentor untuk kelas ini."), level: z.string().optional(), capacity: z.coerce.number().int().positive(), mentor_fee_per_session: money, description: z.string().optional() });
const scheduleSchema = z.object({ class_id: z.string().uuid(), package_id: optionalUuid, mentor_id: z.string().uuid(), starts_at: z.string().min(1), ends_at: z.string().min(1), room: z.string().optional(), notes: z.string().optional() }).refine(data => new Date(data.ends_at) > new Date(data.starts_at), { message: "Waktu selesai harus setelah waktu mulai." });
const scheduleBatchSchema = z.object({
  class_id: z.string().uuid(),
  package_id: optionalUuid,
  mentor_id: z.string().uuid(),
  room: z.string().optional(),
  notes: z.string().optional(),
  slots: z.array(z.object({
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
  })).min(1).max(120),
});
const nullable = (value: unknown) => value === "" || value === undefined ? null : value;
const refresh = () => {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/jadwal");
  revalidatePath("/mentor/dashboard");
  revalidatePath("/mentor/kelas");
  revalidatePath("/mentor/jadwal");
  revalidatePath("/orang-tua/dashboard");
  revalidatePath("/orang-tua/jadwal");
  revalidatePath("/orang-tua/absensi");
};

export async function saveClass(id: string | null, raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const parsed = classSchema.safeParse(raw);
  if (!parsed.success) return { error: "Lengkapi data kelas dengan benar." };
  const supabase = await createSupabaseServerClient();
  const { mentor_ids, ...classData } = parsed.data;

  const { data: selectedMentors, error: mentorError } = await supabase
    .from("mentors")
    .select("id, profile_id")
    .in("id", mentor_ids);
  if (mentorError) return { error: mentorError.message };
  if ((selectedMentors ?? []).length !== mentor_ids.length) return { error: "Sebagian mentor tidak ditemukan." };
  if ((selectedMentors ?? []).some((mentor) => !mentor.profile_id)) return { error: "Semua mentor kelas harus sudah terhubung akun login." };

  const values = Object.fromEntries(Object.entries({ ...classData, name: classData.name.trim(), package_id: null, subject_id: null }).map(([key, value]) => [key, nullable(value)]));
  const { data: savedClass, error } = id
    ? await supabase.from("classes").update(values).eq("id", id).select("id").single()
    : await supabase.from("classes").insert(values).select("id").single();
  if (error) return { error: error.code === "23505" ? "Nama kelas sudah digunakan." : error.message };
  const classId = savedClass?.id ?? id;
  if (!classId) return { error: "Kelas tersimpan, tetapi data mentor gagal dibaca." };
  const { error: deleteAssignmentError } = await supabase.from("mentor_assignments").delete().eq("class_id", classId);
  if (deleteAssignmentError) return { error: deleteAssignmentError.message };
  const { error: assignmentError } = await supabase.from("mentor_assignments").insert(mentor_ids.map((mentor_id) => ({ class_id: classId, mentor_id })));
  if (assignmentError) return { error: assignmentError.code === "23505" ? "Mentor sudah terdaftar di kelas ini." : assignmentError.message };
  refresh(); return { success: true };
}

export async function deleteClass(id: string) { await requireRole(["admin"]); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("classes").delete().eq("id", id); if (error) return { error: error.message }; refresh(); return { success: true }; }

export async function setClassMember(kind: "student" | "mentor", classId: string, personId: string, add: boolean) {
  await requireRole(["admin"]);
  const table = kind === "student" ? "student_classes" : "mentor_assignments";
  const personColumn = kind === "student" ? "student_id" : "mentor_id";
  const supabase = await createSupabaseServerClient();
  if (add && kind === "student") {
    const [{ data: classroom }, { count }] = await Promise.all([
      supabase.from("classes").select("capacity").eq("id", classId).single(),
      supabase.from("student_classes").select("id", { count: "exact", head: true }).eq("class_id", classId)
    ]);
    if (classroom && (count ?? 0) >= classroom.capacity) return { error: "Kapasitas kelas sudah penuh." };
  }
  if (add && kind === "mentor") {
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("profile_id")
      .eq("id", personId)
      .single();
    if (mentorError) return { error: mentorError.message };
    if (!mentor.profile_id) return { error: "Mentor ini belum terhubung akun login. Pilih mentor yang memiliki email akun." };
  }
  const { error } = add ? await supabase.from(table).insert({ class_id: classId, [personColumn]: personId }) : await supabase.from(table).delete().eq("class_id", classId).eq(personColumn, personId);
  if (error) return { error: error.code === "23505" ? "Data sudah terdaftar di kelas ini." : error.message };
  refresh(); return { success: true };
}

export async function saveSchedule(id: string | null, raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data jadwal tidak valid." };
  const values = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, nullable(value)]));
  const supabase = await createSupabaseServerClient();
  const { data: assignment } = await supabase.from("mentor_assignments").select("id").eq("class_id", parsed.data.class_id).eq("mentor_id", parsed.data.mentor_id).maybeSingle();
  if (!assignment) return { error: "Tugaskan mentor ke kelas ini sebelum membuat jadwal." };
  if (parsed.data.package_id) {
    const { data: packageClass } = await supabase.from("package_classes").select("id").eq("class_id", parsed.data.class_id).eq("package_id", parsed.data.package_id).maybeSingle();
    if (!packageClass) return { error: "Paket tidak terhubung ke kelas ini. Atur paket di menu Paket Bimbel." };
  }
  let conflicts = supabase.from("schedules").select("id, class_id, mentor_id").lt("starts_at", parsed.data.ends_at).gt("ends_at", parsed.data.starts_at).or(`class_id.eq.${parsed.data.class_id},mentor_id.eq.${parsed.data.mentor_id}`);
  if (id) conflicts = conflicts.neq("id", id);
  const { data: existing, error: conflictError } = await conflicts;
  if (conflictError) return { error: conflictError.message };
  if (existing?.length) return { error: "Jadwal bentrok: kelas atau mentor sudah memiliki jadwal pada waktu tersebut." };
  const { error } = id ? await supabase.from("schedules").update(values).eq("id", id) : await supabase.from("schedules").insert(values);
  if (error) return { error: error.code === "23P01" ? "Jadwal bentrok: kelas atau mentor sudah memiliki jadwal pada waktu tersebut." : error.message };
  refresh(); return { success: true };
}

export async function generateSchedules(raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const parsed = scheduleBatchSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pola jadwal tidak valid." };

  const slots = parsed.data.slots.map((slot) => ({
    starts_at: new Date(slot.starts_at),
    ends_at: new Date(slot.ends_at),
  }));

  if (slots.some((slot) => Number.isNaN(slot.starts_at.getTime()) || Number.isNaN(slot.ends_at.getTime()) || slot.ends_at <= slot.starts_at)) {
    return { error: "Jam selesai harus setelah jam mulai untuk semua sesi." };
  }

  const duplicateKey = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.starts_at.toISOString()}-${slot.ends_at.toISOString()}`;
    if (duplicateKey.has(key)) return { error: "Pola menghasilkan jadwal duplikat. Cek pilihan hari dan periode." };
    duplicateKey.add(key);
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignment } = await supabase
    .from("mentor_assignments")
    .select("id")
    .eq("class_id", parsed.data.class_id)
    .eq("mentor_id", parsed.data.mentor_id)
    .maybeSingle();
  if (!assignment) return { error: "Tugaskan mentor ke kelas ini sebelum membuat jadwal." };
  if (parsed.data.package_id) {
    const { data: packageClass } = await supabase
      .from("package_classes")
      .select("id")
      .eq("class_id", parsed.data.class_id)
      .eq("package_id", parsed.data.package_id)
      .maybeSingle();
    if (!packageClass) return { error: "Paket tidak terhubung ke kelas ini. Atur paket di menu Paket Bimbel." };
  }

  const minStart = new Date(Math.min(...slots.map((slot) => slot.starts_at.getTime()))).toISOString();
  const maxEnd = new Date(Math.max(...slots.map((slot) => slot.ends_at.getTime()))).toISOString();
  const { data: existing, error: conflictError } = await supabase
    .from("schedules")
    .select("id, class_id, mentor_id, starts_at, ends_at")
    .lt("starts_at", maxEnd)
    .gt("ends_at", minStart)
    .or(`class_id.eq.${parsed.data.class_id},mentor_id.eq.${parsed.data.mentor_id}`);
  if (conflictError) return { error: conflictError.message };

  const conflict = (existing ?? []).find((item) => {
    const existingStart = new Date(item.starts_at).getTime();
    const existingEnd = new Date(item.ends_at).getTime();
    return slots.some((slot) => slot.starts_at.getTime() < existingEnd && slot.ends_at.getTime() > existingStart);
  });
  if (conflict) return { error: "Ada jadwal bentrok pada pola ini. Ubah hari/jam atau cek kalender." };

  const values = parsed.data.slots.map((slot) => ({
    class_id: parsed.data.class_id,
    package_id: nullable(parsed.data.package_id),
    mentor_id: parsed.data.mentor_id,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    room: nullable(parsed.data.room),
    notes: nullable(parsed.data.notes),
  }));

  const { error } = await supabase.from("schedules").insert(values);
  if (error) return { error: error.code === "23P01" ? "Ada jadwal bentrok pada pola ini." : error.message };
  refresh();
  return { success: true, count: values.length };
}

export async function deleteSchedule(id: string) { await requireRole(["admin"]); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("schedules").delete().eq("id", id); if (error) return { error: error.message }; refresh(); return { success: true }; }
