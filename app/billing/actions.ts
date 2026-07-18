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
    .select("id, full_name, package_id, packages(id, name, price)")
    .eq("id", student_id)
    .maybeSingle();

  if (studentError || !student)
    return { error: "Siswa tidak ditemukan." };

  const pkg = (student as any).packages as { id: string; name: string; price: number } | null;
  if (!pkg)
    return { error: "Siswa belum memiliki paket bimbel. Tetapkan paket terlebih dahulu." };

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
    .select("id, amount, status")
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

  // Insert payment
  const { error: payError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: result.data.amount,
    method: result.data.method,
    reference_number: result.data.reference_number ?? null,
    notes: result.data.notes ?? null,
    paid_at: result.data.paid_at,
    recorded_by: user.id,
  });

  if (payError) return { error: payError.message };

  // Update status invoice otomatis
  const newTotal = totalPaid + result.data.amount;
  const newStatus = newTotal >= Number(invoice.amount) ? "paid" : "unpaid";

  await supabase
    .from("invoices")
    .update({ status: newStatus })
    .eq("id", invoiceId);

  revalidatePath(`/admin/invoice/${invoiceId}`);
  revalidatePath("/admin/invoice");
  revalidatePath("/admin/pembayaran");
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
  return { success: true };
}

// ─── Delete Payment ───────────────────────────────────────────────────────────

export async function deletePayment(paymentId: string, invoiceId: string) {
  await requireRole(["admin"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: error.message };

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
  revalidatePath("/admin/pembayaran");
  return { success: true };
}
