import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PayrollRow = {
  id: string;
  mentor_id: string;
  mentor_name: string;
  month: number;
  year: number;
  session_count: number;
  session_amount: number;
  bonus: number;
  deduction: number;
  total_amount: number;
  status: "unpaid" | "paid";
  paid_at: string | null;
  cash_flow_id: string | null;
  notes: string | null;
  created_at: string;
};

export type PayrollDetailRow = {
  id: string;
  subject_name: string | null;
  class_name: string | null;
  taught_at: string | null;
  fee_per_session: number;
};

export type CashFlowRow = {
  id: string;
  transaction_date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
  source: "cash_flow" | "payment" | "payroll";
  deletable: boolean;
};

function jakartaDateOnly(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (Number.isNaN(date.getTime())) return value ? value.slice(0, 10) : "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export async function getPayrollWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: payrolls, error }, { data: mentors }] = await Promise.all([
    supabase.from("payrolls").select("*").order("created_at", { ascending: false }),
    supabase.from("mentors").select("id, full_name").order("full_name")
  ]);
  if (error) throw new Error(error.message);

  const mentorNames = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  return (payrolls ?? []).map((row) => ({
    id: row.id,
    mentor_id: row.mentor_id,
    mentor_name: mentorNames.get(row.mentor_id) ?? "-",
    month: row.month,
    year: row.year,
    session_count: row.session_count,
    session_amount: Number(row.session_amount),
    bonus: Number(row.bonus),
    deduction: Number(row.deduction),
    total_amount: Number(row.total_amount),
    status: row.status,
    paid_at: row.paid_at,
    cash_flow_id: row.cash_flow_id ?? null,
    notes: row.notes,
    created_at: row.created_at,
  })) as PayrollRow[];
}

export async function getPayrollDetail(id: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: payroll, error }, { data: mentors }, { data: details }] = await Promise.all([
    supabase.from("payrolls").select("*").eq("id", id).maybeSingle(),
    supabase.from("mentors").select("id, full_name"),
    supabase.from("payroll_details").select("*").eq("payroll_id", id).order("taught_at")
  ]);
  if (error || !payroll) return null;
  const mentor = (mentors ?? []).find((item) => item.id === payroll.mentor_id);
  return {
    payroll: {
      id: payroll.id,
      mentor_id: payroll.mentor_id,
      mentor_name: mentor?.full_name ?? "-",
      month: payroll.month,
      year: payroll.year,
      session_count: payroll.session_count,
      session_amount: Number(payroll.session_amount),
      bonus: Number(payroll.bonus),
      deduction: Number(payroll.deduction),
      total_amount: Number(payroll.total_amount),
      status: payroll.status,
      paid_at: payroll.paid_at,
      cash_flow_id: payroll.cash_flow_id ?? null,
      notes: payroll.notes,
      created_at: payroll.created_at,
    } as PayrollRow,
    details: (details ?? []).map((detail) => ({
      id: detail.id,
      subject_name: detail.subject_name,
      class_name: detail.class_name,
      taught_at: detail.taught_at,
      fee_per_session: Number(detail.fee_per_session),
    })) as PayrollDetailRow[],
  };
}

export async function getMentorPayrolls(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: mentor } = await supabase.from("mentors").select("id, full_name").eq("profile_id", profileId).maybeSingle();
  if (!mentor) return { mentor: null, payrolls: [] as PayrollRow[] };
  const { data } = await supabase.from("payrolls").select("*").eq("mentor_id", mentor.id).order("created_at", { ascending: false });
  return {
    mentor,
    payrolls: (data ?? []).map((row) => ({
      id: row.id,
      mentor_id: row.mentor_id,
      mentor_name: mentor.full_name,
      month: row.month,
      year: row.year,
      session_count: row.session_count,
      session_amount: Number(row.session_amount),
      bonus: Number(row.bonus),
      deduction: Number(row.deduction),
      total_amount: Number(row.total_amount),
      status: row.status,
      paid_at: row.paid_at,
      cash_flow_id: row.cash_flow_id ?? null,
      notes: row.notes,
      created_at: row.created_at,
    })) as PayrollRow[],
  };
}

export async function getCashFlowWorkspace() {
  const supabase = await createSupabaseServerClient();
  const [{ data: cashFlows, error }, { data: payments }, { data: paidPayrolls }] = await Promise.all([
    supabase.from("cash_flows").select("*").order("transaction_date", { ascending: false }),
    supabase.from("payments").select("id, amount, method, paid_at, created_at"),
    supabase.from("payrolls").select("id, total_amount, month, year, status, paid_at, created_at, cash_flow_id").eq("status", "paid"),
  ]);
  if (error) throw new Error(error.message);

  const cashRows = (cashFlows ?? []).map((row) => ({
    id: row.id,
    transaction_date: row.transaction_date,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    created_at: row.created_at,
  })) as CashFlowRow[];
  const cashDescriptions = new Set(cashRows.map((row) => row.description ?? ""));
  const cashIds = new Set(cashRows.map((row) => row.id));
  const paymentRows = (payments ?? [])
    .filter((payment) => ![...cashDescriptions].some((description) => description.includes(`[payment:${payment.id}]`)))
    .map((payment) => ({
      id: `payment-${payment.id}`,
      transaction_date: jakartaDateOnly(payment.paid_at ?? payment.created_at),
      type: "income" as const,
      category: "Pembayaran SPP",
      amount: Number(payment.amount ?? 0),
      description: `Pembayaran SPP (${payment.method ?? "cash"})`,
      created_at: payment.created_at,
      source: "payment" as const,
      deletable: false,
    }));
  const payrollRows = (paidPayrolls ?? [])
    .filter((payroll) => !payroll.cash_flow_id || !cashIds.has(payroll.cash_flow_id))
    .map((payroll) => ({
      id: `payroll-${payroll.id}`,
      transaction_date: jakartaDateOnly(payroll.paid_at ?? payroll.created_at),
      type: "expense" as const,
      category: "Gaji Mentor",
      amount: Number(payroll.total_amount ?? 0),
      description: `Pembayaran gaji mentor periode ${payroll.month}/${payroll.year}`,
      created_at: payroll.created_at,
      source: "payroll" as const,
      deletable: false,
    }));
  const rows = [...cashRows.map((row) => ({ ...row, source: "cash_flow" as const, deletable: true })), ...paymentRows, ...payrollRows]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return {
    rows,
    totalIncome: rows.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0),
    totalExpense: rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0),
  };
}
