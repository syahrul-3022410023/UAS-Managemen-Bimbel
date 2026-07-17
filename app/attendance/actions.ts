"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statuses = z.enum(["present", "absent", "late", "excused"]);
const rowsSchema = z.array(z.object({ student_id: z.string().uuid(), status: statuses, notes: z.string().optional() }));

export async function saveAttendance(scheduleId: string, rawRows: unknown, rawMentorStatus: unknown) {
  const user = await requireRole(["admin", "mentor"]); const rows = rowsSchema.safeParse(rawRows);
  if (!rows.success) return { error: "Data absensi tidak valid." };
  const parsedMentorStatus = statuses.safeParse(rawMentorStatus);
  if (!parsedMentorStatus.success) return { error: "Status kehadiran mentor tidak valid." };
  const supabase = await createSupabaseServerClient();
  const { data: schedule, error } = await supabase.from("schedules").select("class_id, mentor_id").eq("id", scheduleId).single();
  if (error || !schedule) return { error: "Jadwal tidak ditemukan atau tidak dapat diakses." };
  if (user.role === "mentor") { const { data: mentor } = await supabase.from("mentors").select("id").eq("profile_id", user.id).maybeSingle(); if (!mentor || mentor.id !== schedule.mentor_id) return { error: "Anda hanya dapat mengisi absensi jadwal sendiri." }; }
  const { data: memberships } = await supabase.from("student_classes").select("student_id").eq("class_id", schedule.class_id);
  const permitted = new Set((memberships ?? []).map(x => x.student_id));
  if (rows.data.some(row => !permitted.has(row.student_id))) return { error: "Siswa tidak terdaftar di kelas jadwal ini." };
  const studentRows = rows.data.map(row => ({ ...row, schedule_id: scheduleId, recorded_by: user.id, notes: row.notes || null }));
  const { error: studentError } = await supabase.from("student_attendance").upsert(studentRows, { onConflict: "schedule_id,student_id" });
  if (studentError) return { error: studentError.message };
  const { error: mentorError } = await supabase.from("mentor_attendance").upsert({ schedule_id: scheduleId, mentor_id: schedule.mentor_id, status: parsedMentorStatus.data, recorded_by: user.id }, { onConflict: "schedule_id,mentor_id" });
  if (mentorError) return { error: mentorError.message };
  revalidatePath("/admin/absensi"); revalidatePath("/mentor/absensi"); revalidatePath("/admin/dashboard"); revalidatePath("/mentor/dashboard"); return { success: true };
}
