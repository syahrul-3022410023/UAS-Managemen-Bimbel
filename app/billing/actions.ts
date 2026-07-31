"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const generateSchema = z.object({
  student_id: z.string().uuid("Pilih siswa yang valid."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  due_date: z.string().min(1, "Tanggal jatuh tempo wajib diisi."),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.preprocess((val) => typeof val === "string" ? Number(val.replace(/\./g, "")) : Number(val), z.number().positive("Nominal pembayaran harus lebih dari 0.")),
  method: z.enum(["cash", "transfer", "qris", "other"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  paid_at: z.string().min(1, "Tanggal pembayaran wajib diisi."),
});

const bulkGenerateSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
});

function defaultDueDate(year: number, month: number) {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function jakartaLocalDateTimeToIso(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    const localValue = value.length === 16 ? `${value}:00` : value;
    return new Date(`${localValue}+07:00`).toISOString();
  }
  return new Date(value).toISOString();
}

function jakartaDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dateOnly(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function paymentCashFlowMarker(paymentId: string) {
  return `[payment:${paymentId}]`;
}

// ─── Generate Invoice ─────────────────────────────────────────────────────────

export async function generateInvoice(raw: Record<string, unknown>) {
  const user = await requireRole(["admin"]);
  const result = generateSchema.safeParse(raw);
  if (!result.success)
    return { error: result.error.issues[0]?.message ?? "Data tidak valid." };

  const { student_id, month, year, due_date, notes } = result.data;
  const supabase = await createSupabaseServerClient();

  // Ambil data siswa beserta paket
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, full_name, package_id, packages(id, name, price), parents(package_id, packages(id, name, price))")
    .eq("id", student_id)
    .maybeSingle();

  if (studentError || !student)
    return { error: "Siswa tidak ditemukan." };

  const studentPackage = (student as any).packages as { id: string; name: string; price: number } | null;
  const parentPackage = ((student as any).parents as { packages?: { id: string; name: string; price: number } | null } | null)?.packages ?? null;
  const pkg = studentPackage ?? parentPackage;
  if (!pkg)
    return { error: "Orang tua siswa belum memiliki paket bimbel. Tetapkan paket terlebih dahulu." };

  const { error } = await supabase.from("invoices").insert({
    student_id,
    package_id: pkg.id,
    amount: pkg.price,
    due_date,
    status: "unpaid",
    month,
    year,
    notes: notes ?? null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505")
      return { error: `Invoice untuk siswa ini pada bulan ${month}/${year} sudah ada.` };
    return { error: error.message };
  }

  revalidatePath("/admin/invoice");
  return { success: true };
}

export async function generateMonthlyInvoices(raw: Record<string, unknown>) {
  const user = await requireRole(["admin"]);
  const result = bulkGenerateSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Periode invoice tidak valid." };

  const { month, year } = result.data;
  const supabase = await createSupabaseServerClient();
  const [{ data: students, error: studentError }, { data: packages }] = await Promise.all([
    supabase.from("students").select("id, parent_id, package_id, parents(package_id)").order("full_name"),
    supabase.from("packages").select("id, price"),
  ]);
  if (studentError) return { error: studentError.message };

  const packageMap = new Map((packages ?? []).map((item) => [item.id, Number(item.price ?? 0)]));
  const { data: existingInvoices } = await supabase
    .from("invoices")
    .select("student_id")
    .eq("month", month)
    .eq("year", year);
  const existingStudentIds = new Set((existingInvoices ?? []).map((invoice) => invoice.student_id));
  const values: {
    student_id: string;
    package_id: string;
    amount: number;
    due_date: string;
    status: "unpaid";
    month: number;
    year: number;
    notes: string;
    created_by: string;
  }[] = [];

  for (const student of students ?? []) {
    if (existingStudentIds.has(student.id)) continue;
    const parentPackageId = ((student as any).parents as { package_id?: string | null } | null)?.package_id ?? null;
    const packageId = student.package_id ?? parentPackageId;
    if (!packageId || !packageMap.has(packageId)) continue;
    values.push({
      student_id: student.id,
      package_id: packageId,
      amount: packageMap.get(packageId) ?? 0,
      due_date: defaultDueDate(year, month),
      status: "unpaid",
      month,
      year,
      notes: "Generate bulanan",
      created_by: user.id,
    });
  }

  if (!values.length) return { error: "Semua siswa berpaket sudah memiliki invoice pada periode ini." };

  const { error } = await supabase.from("invoices").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/admin/invoice");
  return { success: true, generated: values.length };
}

export async function deleteInvoice(invoiceId: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: linkedPayments } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", invoiceId);

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) return { error: error.message };
  for (const payment of linkedPayments ?? []) {
    await supabase
      .from("cash_flows")
      .delete()
      .ilike("description", `%${paymentCashFlowMarker(payment.id)}%`);
  }
  revalidatePath("/admin/invoice");
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/laporan");
  return { success: true };
}

// ─── Save Payment ─────────────────────────────────────────────────────────────

export async function savePayment(invoiceId: string, raw: Record<string, unknown>) {
  const user = await requireRole(["admin"]);
  const result = paymentSchema.safeParse(raw);
  if (!result.success)
    return { error: result.error.issues[0]?.message ?? "Data pembayaran tidak valid." };

  const supabase = await createSupabaseServerClient();

  // Cek invoice ada dan belum lunas.
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .select("id, invoice_number, student_id, amount, status, month, year")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invError || !invoice) return { error: "Invoice tidak ditemukan." };
  if (invoice.status === "paid") return { error: "Invoice ini sudah lunas." };

  // Cek total pembayaran yang sudah masuk
  const { data: existingPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const totalPaid = (existingPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice.amount) - totalPaid;

  if (result.data.amount > remaining)
    return { error: `Nominal melebihi sisa tagihan. Sisa: Rp ${remaining.toLocaleString("id-ID")}.` };

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", invoice.student_id)
    .maybeSingle();
  const paidAt = jakartaLocalDateTimeToIso(result.data.paid_at);

  // Insert payment
  const { data: payment, error: payError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: result.data.amount,
    method: result.data.method,
    reference_number: result.data.reference_number ?? null,
    notes: result.data.notes ?? null,
    paid_at: paidAt,
    recorded_by: user.id,
  }).select("id").single();

  if (payError || !payment) return { error: payError?.message ?? "Pembayaran gagal disimpan." };

  const { data: cashFlow, error: cashError } = await supabase
    .from("cash_flows")
    .insert({
      transaction_date: jakartaDateOnly(paidAt),
      type: "income",
      category: "Pembayaran SPP",
      amount: result.data.amount,
      description: `Pembayaran SPP ${student?.full_name ?? "siswa"} periode ${invoice.month}/${invoice.year}${invoice.invoice_number ? ` (${invoice.invoice_number})` : ""} ${paymentCashFlowMarker(payment.id)}`,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (cashError || !cashFlow) {
    await supabase.from("payments").delete().eq("id", payment.id);
    return { error: cashError?.message ?? "Arus kas pembayaran gagal dibuat." };
  }

  // Update status invoice otomatis
  const newTotal = totalPaid + result.data.amount;
  const newStatus = newTotal >= Number(invoice.amount) ? "paid" : "unpaid";

  const { error: statusError } = await supabase
    .from("invoices")
    .update({ status: newStatus })
    .eq("id", invoiceId);
  if (statusError) return { error: statusError.message };

  revalidatePath(`/admin/invoice/${invoiceId}`);
  revalidatePath("/admin/invoice");
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/laporan");
  return { success: true };
}

// ─── Update Invoice Status ────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "unpaid" | "paid"
) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/invoice/${invoiceId}`);
  revalidatePath("/admin/invoice");
  revalidatePath("/admin/laporan");
  return { success: true };
}

// ─── Delete Payment ───────────────────────────────────────────────────────────

export async function deletePayment(paymentId: string, invoiceId: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };
  await supabase
    .from("cash_flows")
    .delete()
    .ilike("description", `%${paymentCashFlowMarker(paymentId)}%`);

  // Recalculate invoice status after deletion
  const { data: invoice } = await supabase
    .from("invoices")
    .select("amount, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoice) {
    const { data: remaining } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoiceId);

    const totalPaid = (remaining ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const newStatus = totalPaid >= Number(invoice.amount) ? "paid" : "unpaid";

    await supabase.from("invoices").update({ status: newStatus }).eq("id", invoiceId);
  }

  revalidatePath(`/admin/invoice/${invoiceId}`);
  revalidatePath("/admin/invoice");
  revalidatePath("/admin/arus-kas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/laporan");
  return { success: true };
}
