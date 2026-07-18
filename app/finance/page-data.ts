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
};

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
      notes: row.notes,
      created_at: row.created_at,
    })) as PayrollRow[],
  };
}

export async function getCashFlowWorkspace() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("cash_flows").select("*").order("transaction_date", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    transaction_date: row.transaction_date,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    created_at: row.created_at,
  })) as CashFlowRow[];
  return {
    rows,
    totalIncome: rows.filter((row) => row.type === "income").reduce((sum, row) => sum + row.amount, 0),
    totalExpense: rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0),
  };
}
