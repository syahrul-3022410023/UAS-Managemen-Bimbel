import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  student_id: string;
  student_name: string;
  package_id: string | null;
  package_name: string | null;
  amount: number;
  due_date: string;
  status: "unpaid" | "paid";
  month: number;
  year: number;
  notes: string | null;
  created_at: string;
  total_paid: number;
};

export type PaymentRow = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference_number: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
};

export type InvoiceDetail = InvoiceRow & {
  payments: PaymentRow[];
};

export type StudentOption = {
  value: string;
  label: string;
  package_id: string | null;
  package_name: string | null;
  package_price: number | null;
};

// ─── Admin: semua invoice ─────────────────────────────────────────────────────

export async function getAdminInvoices(): Promise<InvoiceRow[]> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: invoices, error },
    { data: students },
    { data: packages },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("students").select("id, full_name, package_id"),
    supabase.from("packages").select("id, name"),
    supabase.from("payments").select("invoice_id, amount"),
  ]);

  if (error) throw new Error(error.message);

  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));
  const packageMap = new Map((packages ?? []).map((p) => [p.id, p.name]));

  // Aggregate paid per invoice
  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) {
    paidMap.set(p.invoice_id, (paidMap.get(p.invoice_id) ?? 0) + Number(p.amount));
  }

  return (invoices ?? []).map((inv) => {
    const student = studentMap.get(inv.student_id);
    return {
      id: inv.id,
      invoice_number: inv.invoice_number ?? null,
      student_id: inv.student_id,
      student_name: student?.full_name ?? "—",
      package_id: inv.package_id,
      package_name: inv.package_id ? (packageMap.get(inv.package_id) ?? "—") : null,
      amount: Number(inv.amount),
      due_date: inv.due_date,
      status: inv.status === "paid" ? "paid" : "unpaid",
      month: inv.month,
      year: inv.year,
      notes: inv.notes,
      created_at: inv.created_at,
      total_paid: paidMap.get(inv.id) ?? 0,
    };
  });
}

// ─── Admin: detail invoice + payment history ──────────────────────────────────

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: inv, error },
    { data: students },
    { data: packages },
    { data: payments },
  ] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("students").select("id, full_name, package_id"),
    supabase.from("packages").select("id, name"),
    supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  if (error || !inv) return null;

  const student = (students ?? []).find((s) => s.id === inv.student_id);
  const packageMap = new Map((packages ?? []).map((p) => [p.id, p.name]));
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    id: inv.id,
    invoice_number: inv.invoice_number ?? null,
    student_id: inv.student_id,
    student_name: student?.full_name ?? "—",
    package_id: inv.package_id,
    package_name: inv.package_id ? (packageMap.get(inv.package_id) ?? "—") : null,
    amount: Number(inv.amount),
    due_date: inv.due_date,
    status: inv.status === "paid" ? "paid" : "unpaid",
    month: inv.month,
    year: inv.year,
    notes: inv.notes,
    created_at: inv.created_at,
    total_paid: totalPaid,
    payments: (payments ?? []).map((p) => ({
      id: p.id,
      invoice_id: p.invoice_id,
      amount: Number(p.amount),
      method: p.method,
      reference_number: p.reference_number,
      notes: p.notes,
      paid_at: p.paid_at,
      created_at: p.created_at,
    })),
  };
}

// ─── Admin: rekap semua pembayaran ────────────────────────────────────────────

export type PaymentRecapRow = PaymentRow & {
  student_name: string;
  invoice_month: number;
  invoice_year: number;
  invoice_amount: number;
};

export async function getAdminPayments(): Promise<PaymentRecapRow[]> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: payments, error },
    { data: invoices },
    { data: students },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .order("paid_at", { ascending: false }),
    supabase.from("invoices").select("id, student_id, month, year, amount"),
    supabase.from("students").select("id, full_name"),
  ]);

  if (error) throw new Error(error.message);

  const invoiceMap = new Map((invoices ?? []).map((i) => [i.id, i]));
  const studentMap = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  return (payments ?? []).map((p) => {
    const inv = invoiceMap.get(p.invoice_id);
    return {
      id: p.id,
      invoice_id: p.invoice_id,
      amount: Number(p.amount),
      method: p.method,
      reference_number: p.reference_number,
      notes: p.notes,
      paid_at: p.paid_at,
      created_at: p.created_at,
      student_name: inv ? (studentMap.get(inv.student_id) ?? "—") : "—",
      invoice_month: inv?.month ?? 0,
      invoice_year: inv?.year ?? 0,
      invoice_amount: Number(inv?.amount ?? 0),
    };
  });
}

// ─── Parent: invoice anak ─────────────────────────────────────────────────────

export async function getParentInvoices(parentProfileId: string): Promise<InvoiceRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("profile_id", parentProfileId)
    .maybeSingle();

  if (!parent) return [];

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, package_id")
    .eq("parent_id", parent.id);

  if (!students?.length) return [];
  const studentIds = students.map((s) => s.id);

  const [
    { data: invoices, error },
    { data: packages },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false }),
    supabase.from("packages").select("id, name"),
    supabase.from("payments").select("invoice_id, amount"),
  ]);

  if (error) throw new Error(error.message);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const packageMap = new Map((packages ?? []).map((p) => [p.id, p.name]));
  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) {
    paidMap.set(p.invoice_id, (paidMap.get(p.invoice_id) ?? 0) + Number(p.amount));
  }

  return (invoices ?? []).map((inv) => {
    const student = studentMap.get(inv.student_id);
    return {
      id: inv.id,
      invoice_number: inv.invoice_number ?? null,
      student_id: inv.student_id,
      student_name: student?.full_name ?? "—",
      package_id: inv.package_id,
      package_name: inv.package_id ? (packageMap.get(inv.package_id) ?? "—") : null,
      amount: Number(inv.amount),
      due_date: inv.due_date,
      status: inv.status === "paid" ? "paid" : "unpaid",
      month: inv.month,
      year: inv.year,
      notes: inv.notes,
      created_at: inv.created_at,
      total_paid: paidMap.get(inv.id) ?? 0,
    };
  });
}

// ─── Student options for generate invoice form ────────────────────────────────

export async function getStudentOptions(): Promise<StudentOption[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: students }, { data: packages }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, package_id")
      .order("full_name"),
    supabase.from("packages").select("id, name, price"),
  ]);

  const packageMap = new Map((packages ?? []).map((p) => [p.id, p]));

  return (students ?? []).map((s) => {
    const pkg = s.package_id ? packageMap.get(s.package_id) : null;
    return {
      value: s.id,
      label: s.full_name,
      package_id: s.package_id ?? null,
      package_name: pkg?.name ?? null,
      package_price: pkg ? Number(pkg.price) : null,
    };
  });
}
