"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const classSchema = z.object({ name: z.string().min(2), subject_id: z.string().uuid(), package_id: z.string().uuid().optional(), level: z.string().optional(), capacity: z.coerce.number().int().positive(), description: z.string().optional() });
const scheduleSchema = z.object({ class_id: z.string().uuid(), mentor_id: z.string().uuid(), starts_at: z.string().min(1), ends_at: z.string().min(1), room: z.string().optional(), notes: z.string().optional() }).refine(data => new Date(data.ends_at) > new Date(data.starts_at), { message: "Waktu selesai harus setelah waktu mulai." });
const nullable = (value: unknown) => value === "" || value === undefined ? null : value;
const refresh = () => { revalidatePath("/admin/kelas"); revalidatePath("/admin/jadwal"); };

export async function saveClass(id: string | null, raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const parsed = classSchema.safeParse(raw);
  if (!parsed.success) return { error: "Lengkapi data kelas dengan benar." };
  const values = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, nullable(value)]));
  const supabase = await createSupabaseServerClient();
  const { error } = id ? await supabase.from("classes").update(values).eq("id", id) : await supabase.from("classes").insert(values);
  if (error) return { error: error.code === "23505" ? "Nama kelas sudah digunakan." : error.message };
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
  let conflicts = supabase.from("schedules").select("id, class_id, mentor_id").lt("starts_at", parsed.data.ends_at).gt("ends_at", parsed.data.starts_at).or(`class_id.eq.${parsed.data.class_id},mentor_id.eq.${parsed.data.mentor_id}`);
  if (id) conflicts = conflicts.neq("id", id);
  const { data: existing, error: conflictError } = await conflicts;
  if (conflictError) return { error: conflictError.message };
  if (existing?.length) return { error: "Jadwal bentrok: kelas atau mentor sudah memiliki jadwal pada waktu tersebut." };
  const { error } = id ? await supabase.from("schedules").update(values).eq("id", id) : await supabase.from("schedules").insert(values);
  if (error) return { error: error.code === "23P01" ? "Jadwal bentrok: kelas atau mentor sudah memiliki jadwal pada waktu tersebut." : error.message };
  refresh(); return { success: true };
}

export async function deleteSchedule(id: string) { await requireRole(["admin"]); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("schedules").delete().eq("id", id); if (error) return { error: error.message }; refresh(); return { success: true }; }
