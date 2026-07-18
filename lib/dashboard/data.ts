import { createSupabaseServerClient } from "@/lib/supabase/server";

const todayRange = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  const start = new Date(`${year}-${month}-${day}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

const monthRange = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const start = new Date(`${year}-${month}-01T00:00:00+07:00`);
  let nextMonth = parseInt(month, 10) + 1;
  let nextYear = parseInt(year, 10);
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }
  const end = new Date(`${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00:00+07:00`);
  return { start: start.toISOString(), end: end.toISOString() };
};

const jakartaPeriod = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return {
    year: Number(parts.find(p => p.type === 'year')!.value),
    month: Number(parts.find(p => p.type === 'month')!.value),
  };
};

export async function getAdminMetrics() {
  const supabase = await createSupabaseServerClient();
  const { start: monthStart, end: monthEnd } = monthRange();
  const period = jakartaPeriod();
  const [
    { count: students },
    { count: mentors },
    { count: classes },
    { count: attendance },
    { count: unpaidInvoices },
    { data: monthPayments },
    { data: allPayments },
    { data: cashFlows },
    { data: monthPayrolls },
    { data: paidPayrolls },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("mentors").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("student_attendance").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
    supabase.from("payments").select("amount").gte("paid_at", monthStart).lt("paid_at", monthEnd),
    supabase.from("payments").select("amount"),
    supabase.from("cash_flows").select("type, amount"),
    supabase.from("payrolls").select("total_amount").eq("month", period.month).eq("year", period.year),
    supabase.from("payrolls").select("total_amount").eq("status", "paid"),
  ]);
  const revenueThisMonth = (monthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentIncome = (allPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const cashIncome = (cashFlows ?? []).filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0);
  const cashExpense = (cashFlows ?? []).filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0);
  const paidPayrollExpense = (paidPayrolls ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const payrollThisMonth = (monthPayrolls ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const totalCashIn = paymentIncome + cashIncome;
  const totalCashOut = cashExpense + paidPayrollExpense;
  const cashBalance = totalCashIn - totalCashOut;
  return { students: students ?? 0, mentors: mentors ?? 0, classes: classes ?? 0, attendance: attendance ?? 0, unpaidInvoices: unpaidInvoices ?? 0, revenueThisMonth, totalCashIn, totalCashOut, cashBalance, payrollThisMonth };
}
export async function getMentorMetrics(userId: string) { const supabase = await createSupabaseServerClient(); const { start, end } = todayRange(); const period = jakartaPeriod(); const { data: mentor } = await supabase.from("mentors").select("id").eq("profile_id", userId).maybeSingle(); if (!mentor) return { today: 0, classes: 0, attendance: 0, latestPayroll: null as { month: number; year: number; total_amount: number } | null, incomeThisMonth: 0 }; const [{ count: today }, { count: classes }, { count: attendance }, { data: latestPayroll }, { data: monthPayrolls }] = await Promise.all([supabase.from("schedules").select("id", { count: "exact", head: true }).eq("mentor_id", mentor.id).gte("starts_at", start).lt("starts_at", end), supabase.from("mentor_assignments").select("id", { count: "exact", head: true }).eq("mentor_id", mentor.id), supabase.from("mentor_attendance").select("id", { count: "exact", head: true }).eq("mentor_id", mentor.id).gte("recorded_at", start).lt("recorded_at", end), supabase.from("payrolls").select("month, year, total_amount").eq("mentor_id", mentor.id).order("created_at", { ascending: false }).limit(1), supabase.from("payrolls").select("total_amount").eq("mentor_id", mentor.id).eq("month", period.month).eq("year", period.year)]); return { today: today ?? 0, classes: classes ?? 0, attendance: attendance ?? 0, latestPayroll: latestPayroll?.[0] ? { month: latestPayroll[0].month, year: latestPayroll[0].year, total_amount: Number(latestPayroll[0].total_amount) } : null, incomeThisMonth: (monthPayrolls ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0) }; }
export async function getParentMetrics(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { start, end } = todayRange();
  const { data: parent } = await supabase.from("parents").select("id").eq("profile_id", userId).maybeSingle();
  if (!parent) return { children: 0, schedule: 0, attendance: "—", childrenDetail: [] as { id: string; full_name: string; total: number; present: number }[], paymentStatus: "-", paymentDetail: "-" };
  const { data: students } = await supabase.from("students").select("id, full_name").eq("parent_id", parent.id);
  const ids = (students ?? []).map(x => x.id);
  if (!ids.length) return { children: 0, schedule: 0, attendance: "—", childrenDetail: [] as { id: string; full_name: string; total: number; present: number }[], paymentStatus: "-", paymentDetail: "-" };
  const [{ data: enrollments }, { data: records }, { data: invoices }] = await Promise.all([
    supabase.from("student_classes").select("class_id").in("student_id", ids),
    supabase.from("student_attendance").select("student_id, status").in("student_id", ids),
    supabase.from("invoices").select("status").in("student_id", ids)
  ]);
  const classIds = [...new Set((enrollments ?? []).map(x => x.class_id))];
  const { count: schedule } = classIds.length ? await supabase.from("schedules").select("id", { count: "exact", head: true }).in("class_id", classIds).gte("starts_at", start).lt("starts_at", end) : { count: 0 };
  const total = records?.length ?? 0;
  const presentAll = records?.filter(x => x.status === "present" || x.status === "late").length ?? 0;
  const childrenDetail = (students ?? []).map(s => {
    const sRecords = (records ?? []).filter(r => r.student_id === s.id);
    const sPresent = sRecords.filter(r => r.status === "present" || r.status === "late").length;
    return { id: s.id, full_name: s.full_name, total: sRecords.length, present: sPresent };
  });

  let paymentStatus = "Lunas";
  let paymentDetail = "Semua tagihan lunas";
  
  if (invoices && invoices.length > 0) {
    const hasUnpaid = invoices.some(i => i.status !== "paid");
    
    if (hasUnpaid) {
      paymentStatus = "Belum Lunas";
      paymentDetail = "Ada tagihan yang perlu dibayar";
    }
  } else {
    paymentStatus = "Tidak ada tagihan";
    paymentDetail = "Belum ada tagihan dibuat";
  }

  return { 
    children: ids.length, 
    schedule: schedule ?? 0, 
    attendance: total ? `${Math.round(presentAll / total * 100)}%` : "—", 
    childrenDetail,
    paymentStatus,
    paymentDetail
  };
}
