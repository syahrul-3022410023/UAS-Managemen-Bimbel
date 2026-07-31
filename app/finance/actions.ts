"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const money = z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().min(0));
const cashFlowSchema = z.object({
  transaction_date: z.string().min(1, "Tanggal wajib diisi."),
  type: z.enum(["income", "expense"]),
  category: z.string().min(2, "Kategori wajib diisi."),
  amount: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().positive("Nominal harus lebih dari 0.")),
  description: z.string().optional(),
});
const adjustmentSchema = z.object({
  bonus: money,
  deduction: money,
  notes: z.string().optional(),
});
const periodSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).optional(),
});

function currentJakartaPeriod() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function monthRange(year: number, month: number) {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+07:00`);
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+07:00`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function generateCurrentPayroll(raw: Record<string, unknown> = {}) {
  const user = await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const current = currentJakartaPeriod();
  const parsed = periodSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Periode payroll tidak valid." };
  const month = parsed.data.month ?? current.month;
  const year = parsed.data.year ?? current.year;
  const { start, end } = monthRange(year, month);

  const [{ data: mentors, error: mentorError }, { data: schedules, error: scheduleError }, { data: mentorAttendance }] = await Promise.all([
    supabase.from("mentors").select("id, full_name").order("full_name"),
    supabase.from("schedules").select("id, mentor_id, class_id, package_id, starts_at").gte("starts_at", start).lt("starts_at", end).order("starts_at"),
    supabase.from("mentor_attendance").select("schedule_id, mentor_id, status"),
  ]);
  if (mentorError) return { error: mentorError.message };
  if (scheduleError) return { error: scheduleError.message };

  const classIds = [...new Set((schedules ?? []).map((schedule) => schedule.class_id).filter(Boolean))];
  const { data: classes } = classIds.length
    ? await supabase.from("classes").select("id, name, package_id, subject_id, mentor_fee_per_session").in("id", classIds)
    : { data: [] };
  const packageIds = [...new Set([...(classes ?? []).map((item) => item.package_id), ...(schedules ?? []).map((item) => item.package_id)].filter(Boolean))];
  const subjectIds = [...new Set((classes ?? []).map((item) => item.subject_id).filter(Boolean))];
  const [{ data: packages }, { data: subjects }] = await Promise.all([
    packageIds.length ? supabase.from("packages").select("id, name, mentor_fee_per_session").in("id", packageIds) : Promise.resolve({ data: [] }),
    subjectIds.length ? supabase.from("subjects").select("id, name").in("id", subjectIds) : Promise.resolve({ data: [] }),
  ]);

  const classMap = new Map((classes ?? []).map((item) => [item.id, item]));
  const packageMap = new Map((packages ?? []).map((item) => [item.id, item]));
  const subjectMap = new Map((subjects ?? []).map((item) => [item.id, item.name]));
  let generated = 0;
  const payableAttendance = new Set(
    (mentorAttendance ?? [])
      .filter((attendance) => attendance.status === "present" || attendance.status === "late")
      .map((attendance) => `${attendance.schedule_id}:${attendance.mentor_id}`)
  );

  for (const mentor of mentors ?? []) {
    const mentorSchedules = (schedules ?? []).filter((schedule) => schedule.mentor_id === mentor.id && payableAttendance.has(`${schedule.id}:${mentor.id}`));
    const details = mentorSchedules.map((schedule) => {
      const classRow = classMap.get(schedule.class_id);
      const packageId = schedule.package_id ?? classRow?.package_id ?? null;
      const packageRow = packageId ? packageMap.get(packageId) : null;
      return {
        schedule_id: schedule.id,
        class_id: schedule.class_id,
        package_id: packageId,
        subject_name: classRow?.subject_id ? subjectMap.get(classRow.subject_id) ?? classRow.name : classRow?.name ?? null,
        class_name: classRow?.name ?? null,
        taught_at: schedule.starts_at,
        fee_per_session: Number(classRow?.mentor_fee_per_session ?? packageRow?.mentor_fee_per_session ?? 0),
      };
    });
    const sessionAmount = details.reduce((sum, detail) => sum + detail.fee_per_session, 0);

    const { data: existing } = await supabase.from("payrolls").select("*").eq("mentor_id", mentor.id).eq("month", month).eq("year", year).maybeSingle();
    if (existing?.status === "paid") continue;

    const payload = {
      mentor_id: mentor.id,
      month,
      year,
      session_count: details.length,
      session_amount: sessionAmount,
      bonus: Number(existing?.bonus ?? 0),
      deduction: Number(existing?.deduction ?? 0),
      total_amount: Math.max(0, sessionAmount + Number(existing?.bonus ?? 0) - Number(existing?.deduction ?? 0)),
      status: "unpaid",
      notes: existing?.notes ?? null,
      created_by: user.id,
    };

    const { data: payroll, error } = existing
      ? await supabase.from("payrolls").update(payload).eq("id", existing.id).select("id").single()
      : await supabase.from("payrolls").insert(payload).select("id").single();
    if (error || !payroll) return { error: error?.message ?? "Payroll gagal dibuat." };

    await supabase.from("payroll_details").delete().eq("payroll_id", payroll.id);
    if (details.length) {
      const { error: detailError } = await supabase.from("payroll_details").insert(details.map((detail) => ({ ...detail, payroll_id: payroll.id })));
      if (detailError) return { error: detailError.message };
    }
    generated++;
  }

  revalidatePath("/admin/gaji-mentor");
  revalidatePath("/mentor/slip-gaji");
  return { success: true, generated };
}

export async function updatePayrollAdjustments(payrollId: string, raw: Record<string, unknown>) {
  await requireRole(["admin"]);
  const result = adjustmentSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Data payroll tidak valid." };
  const supabase = await createSupabaseServerClient();
  const { data: payroll } = await supabase.from("payrolls").select("session_amount, status").eq("id", payrollId).maybeSingle();
  if (!payroll) return { error: "Payroll tidak ditemukan." };
  if (payroll.status === "paid") return { error: "Payroll yang sudah dibayar tidak bisa diubah. Hapus slip dulu jika perlu koreksi." };
  const total = Math.max(0, Number(payroll.session_amount) + result.data.bonus - result.data.deduction);
  const { error } = await supabase.from("payrolls").update({ ...result.data, total_amount: total }).eq("id", payrollId);
  if (error) return { error: error.message };
  revalidatePath("/admin/gaji-mentor");
  revalidatePath(`/admin/gaji-mentor/${payrollId}`);
  return { success: true };
}

export async function markPayrollPaid(payrollId: string) {
  const user = await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: payroll, error: lookupError } = await supabase
    .from("payrolls")
    .select("id, mentor_id, month, year, total_amount, status, cash_flow_id")
    .eq("id", payrollId)
    .maybeSingle();
  if (lookupError || !payroll) return { error: lookupError?.message ?? "Payroll tidak ditemukan." };
  if (payroll.status === "paid") return { error: "Payroll ini sudah dibayar." };
  if (Number(payroll.total_amount) <= 0) return { error: "Total gaji harus lebih dari 0." };

  const { data: mentor } = await supabase.from("mentors").select("full_name").eq("id", payroll.mentor_id).maybeSingle();
  const { data: cashFlow, error: cashError } = await supabase
    .from("cash_flows")
    .insert({
      transaction_date: new Date().toISOString().slice(0, 10),
      type: "expense",
      category: "Gaji Mentor",
      amount: Number(payroll.total_amount),
      description: `Pembayaran gaji ${mentor?.full_name ?? "mentor"} periode ${payroll.month}/${payroll.year}`,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (cashError || !cashFlow) return { error: cashError?.message ?? "Arus kas payroll gagal dibuat." };

  const { error } = await supabase.from("payrolls").update({ status: "paid", paid_at: new Date().toISOString(), cash_flow_id: cashFlow.id }).eq("id", payrollId);
  if (error) {
    await supabase.from("cash_flows").delete().eq("id", cashFlow.id);
    return { error: error.message };
  }
  revalidatePath("/admin/gaji-mentor");
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/gaji-mentor/${payrollId}`);
  revalidatePath("/mentor/slip-gaji");
  return { success: true };
}

export async function deletePayroll(payrollId: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: payroll, error: lookupError } = await supabase
    .from("payrolls")
    .select("cash_flow_id")
    .eq("id", payrollId)
    .maybeSingle();
  if (lookupError || !payroll) return { error: lookupError?.message ?? "Payroll tidak ditemukan." };

  const { error } = await supabase.from("payrolls").delete().eq("id", payrollId);
  if (error) return { error: error.message };
  if (payroll.cash_flow_id) {
    await supabase.from("cash_flows").delete().eq("id", payroll.cash_flow_id);
  }

  revalidatePath("/admin/gaji-mentor");
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/mentor/slip-gaji");
  return { success: true };
}

export async function saveCashFlow(raw: Record<string, unknown>) {
  const user = await requireRole(["admin"]);
  const result = cashFlowSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Data arus kas tidak valid." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("cash_flows").insert({ ...result.data, description: result.data.description ?? null, created_by: user.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteCashFlow(id: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("cash_flows").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
