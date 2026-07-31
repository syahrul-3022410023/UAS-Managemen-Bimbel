import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMentorScope } from "@/lib/mentors/scope";
import { getParentScope } from "@/lib/parents/scope";

const todayRange = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === "year")!.value;
  const month = parts.find(p => p.type === "month")!.value;
  const day = parts.find(p => p.type === "day")!.value;
  const start = new Date(`${year}-${month}-${day}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

const monthRange = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === "year")!.value;
  const month = parts.find(p => p.type === "month")!.value;
  const start = new Date(`${year}-${month}-01T00:00:00+07:00`);
  let nextMonth = parseInt(month, 10) + 1;
  let nextYear = parseInt(year, 10);
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }
  const end = new Date(`${nextYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00+07:00`);
  return { start: start.toISOString(), end: end.toISOString() };
};

const jakartaPeriod = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return {
    year: Number(parts.find(p => p.type === "year")!.value),
    month: Number(parts.find(p => p.type === "month")!.value),
  };
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export type DashboardFinanceActivity = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  type: "income" | "expense";
  date: string;
};

function buildMonthlyFinanceTrend({
  payments,
  cashFlows,
  paidPayrolls,
  months = 12,
}: {
  payments: { amount: unknown; paid_at: string | null }[];
  cashFlows: { type: string | null; amount: unknown; transaction_date: string | null }[];
  paidPayrolls: { total_amount: unknown; paid_at: string | null; created_at: string | null }[];
  months?: number;
}) {
  const period = jakartaPeriod();
  const buckets = new Map<string, { month: string; income: number; expense: number }>();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(period.year, period.month - 1 - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      month: MONTH_LABELS[date.getUTCMonth()],
      income: 0,
      expense: 0,
    });
  }

  const keyFromDate = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  for (const payment of payments) {
    const key = keyFromDate(payment.paid_at);
    const bucket = key ? buckets.get(key) : null;
    if (bucket) bucket.income += Number(payment.amount ?? 0);
  }

  for (const cashFlow of cashFlows) {
    const key = keyFromDate(cashFlow.transaction_date);
    const bucket = key ? buckets.get(key) : null;
    if (!bucket) continue;
    if (cashFlow.type === "income") bucket.income += Number(cashFlow.amount ?? 0);
    if (cashFlow.type === "expense") bucket.expense += Number(cashFlow.amount ?? 0);
  }

  for (const payroll of paidPayrolls) {
    const key = keyFromDate(payroll.paid_at ?? payroll.created_at);
    const bucket = key ? buckets.get(key) : null;
    if (bucket) bucket.expense += Number(payroll.total_amount ?? 0);
  }

  return [...buckets.values()];
}

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
    { data: recentPayments },
    { data: recentCashFlows },
    { data: recentPayrolls },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("mentors").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("student_attendance").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
    supabase.from("payments").select("amount").gte("paid_at", monthStart).lt("paid_at", monthEnd),
    supabase.from("payments").select("amount, paid_at"),
    supabase.from("cash_flows").select("type, amount, transaction_date"),
    supabase.from("payrolls").select("total_amount").eq("month", period.month).eq("year", period.year),
    supabase.from("payrolls").select("total_amount, paid_at, created_at").eq("status", "paid"),
    supabase.from("payments").select("id, amount, method, paid_at, created_at").order("paid_at", { ascending: false }).limit(5),
    supabase.from("cash_flows").select("id, type, category, amount, description, transaction_date, created_at").order("transaction_date", { ascending: false }).limit(5),
    supabase.from("payrolls").select("id, total_amount, month, year, paid_at, created_at").eq("status", "paid").order("paid_at", { ascending: false }).limit(5),
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
  const financeTrend = buildMonthlyFinanceTrend({
    payments: allPayments ?? [],
    cashFlows: cashFlows ?? [],
    paidPayrolls: paidPayrolls ?? [],
  });
  const financeActivities: DashboardFinanceActivity[] = [
    ...(recentPayments ?? []).map((payment) => ({
      id: `payment-${payment.id}`,
      title: "Pembayaran SPP",
      detail: `Metode ${payment.method ?? "cash"}`,
      amount: Number(payment.amount ?? 0),
      type: "income" as const,
      date: payment.paid_at ?? payment.created_at,
    })),
    ...(recentCashFlows ?? []).map((cashFlow) => ({
      id: `cash-${cashFlow.id}`,
      title: cashFlow.type === "income" ? "Kas Masuk" : "Kas Keluar",
      detail: cashFlow.description || cashFlow.category || "Transaksi kas manual",
      amount: Number(cashFlow.amount ?? 0),
      type: cashFlow.type === "income" ? ("income" as const) : ("expense" as const),
      date: cashFlow.transaction_date ?? cashFlow.created_at,
    })),
    ...(recentPayrolls ?? []).map((payroll) => ({
      id: `payroll-${payroll.id}`,
      title: "Gaji Mentor Dibayar",
      detail: `${MONTH_LABELS[(payroll.month ?? 1) - 1] ?? "Periode"} ${payroll.year ?? ""}`.trim(),
      amount: Number(payroll.total_amount ?? 0),
      type: "expense" as const,
      date: payroll.paid_at ?? payroll.created_at,
    })),
  ]
    .filter((activity) => activity.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    students: students ?? 0,
    mentors: mentors ?? 0,
    classes: classes ?? 0,
    attendance: attendance ?? 0,
    unpaidInvoices: unpaidInvoices ?? 0,
    revenueThisMonth,
    paymentIncome,
    cashIncome,
    cashExpense,
    paidPayrollExpense,
    totalCashIn,
    totalCashOut,
    cashBalance,
    payrollThisMonth,
    financeTrend,
    financeActivities
  };
}

export type MentorDashboardSchedule = {
  id: string;
  starts_at: string;
  ends_at: string;
  room: string | null;
  class_name: string;
  subject_name: string;
  student_names: string[];
};

export async function getMentorMetrics(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { start, end } = todayRange();
  const period = jakartaPeriod();
  const { mentor, mentorIds } = await getMentorScope(supabase, userId);

  if (!mentor) {
    return {
      today: 0,
      classes: 0,
      students: 0,
      upcomingSchedules: [] as MentorDashboardSchedule[],
      latestPayroll: null as { month: number; year: number; total_amount: number } | null,
      incomeThisMonth: 0
    };
  }

  const [{ data: assignments }, { count: today }, { data: latestPayroll }, { data: monthPayrolls }, { data: schedules }] = await Promise.all([
    supabase.from("mentor_assignments").select("class_id").in("mentor_id", mentorIds),
    supabase.from("schedules").select("id", { count: "exact", head: true }).in("mentor_id", mentorIds).gte("starts_at", start).lt("starts_at", end),
    supabase.from("payrolls").select("month, year, total_amount").in("mentor_id", mentorIds).gt("total_amount", 0).order("created_at", { ascending: false }).limit(1),
    supabase.from("payrolls").select("total_amount").in("mentor_id", mentorIds).eq("month", period.month).eq("year", period.year),
    supabase.from("schedules").select("id, class_id, starts_at, ends_at, room").in("mentor_id", mentorIds).gte("starts_at", start).order("starts_at", { ascending: true }).limit(5),
  ]);

  const classIds = [...new Set([...(assignments ?? []).map((row) => row.class_id), ...(schedules ?? []).map((row) => row.class_id)])];
  const [{ data: classes }, { data: subjects }, { data: studentClasses }, { data: students }] = await Promise.all([
    classIds.length ? supabase.from("classes").select("id, name, subject_id").in("id", classIds) : Promise.resolve({ data: [] }),
    supabase.from("subjects").select("id, name"),
    classIds.length ? supabase.from("student_classes").select("class_id, student_id").in("class_id", classIds) : Promise.resolve({ data: [] }),
    supabase.from("students").select("id, full_name"),
  ]);

  const classMap = new Map((classes ?? []).map((row) => [row.id, row]));
  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row.name]));
  const studentMap = new Map((students ?? []).map((row) => [row.id, row.full_name]));
  const studentIds = new Set((studentClasses ?? []).map((row) => row.student_id));
  const upcomingSchedules = (schedules ?? []).map((schedule) => {
    const classRow = classMap.get(schedule.class_id);
    return {
      id: schedule.id,
      starts_at: schedule.starts_at,
      ends_at: schedule.ends_at,
      room: schedule.room,
      class_name: classRow?.name ?? "Kelas",
      subject_name: classRow?.subject_id ? subjectMap.get(classRow.subject_id) ?? classRow.name : classRow?.name ?? "-",
      student_names: (studentClasses ?? [])
        .filter((row) => row.class_id === schedule.class_id)
        .map((row) => studentMap.get(row.student_id))
        .filter(Boolean) as string[],
    };
  });

  return {
    today: today ?? 0,
    classes: new Set(classIds).size,
    students: studentIds.size,
    upcomingSchedules,
    latestPayroll: latestPayroll?.[0] ? { month: latestPayroll[0].month, year: latestPayroll[0].year, total_amount: Number(latestPayroll[0].total_amount) } : null,
    incomeThisMonth: (monthPayrolls ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0)
  };
}

export async function getParentMetrics(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { start, end } = todayRange();
  const emptyChildren = [] as { id: string; full_name: string; package_name: string; class_names: string[]; total: number; present: number }[];
  const { parent, parentIds } = await getParentScope(supabase, userId);
  if (!parent) return { children: 0, schedule: 0, attendance: "-", childrenDetail: emptyChildren, paymentStatus: "-", paymentDetail: "-" };

  const { data: students } = await supabase.from("students").select("id, full_name, parent_id, package_id").in("parent_id", parentIds);
  const ids = (students ?? []).map(x => x.id);
  if (!ids.length) return { children: 0, schedule: 0, attendance: "-", childrenDetail: emptyChildren, paymentStatus: "-", paymentDetail: "-" };

  const [{ data: enrollments }, { data: records }, { data: invoices }, { data: packages }, { data: parents }] = await Promise.all([
    supabase.from("student_classes").select("student_id, class_id").in("student_id", ids),
    supabase.from("student_attendance").select("student_id, status").in("student_id", ids),
    supabase.from("invoices").select("status").in("student_id", ids),
    supabase.from("packages").select("id, name"),
    supabase.from("parents").select("id, package_id").in("id", parentIds)
  ]);
  const classIds = [...new Set((enrollments ?? []).map(x => x.class_id))];
  const { data: classes } = classIds.length ? await supabase.from("classes").select("id, name").in("id", classIds) : { data: [] };
  const { count: schedule } = classIds.length ? await supabase.from("schedules").select("id", { count: "exact", head: true }).in("class_id", classIds).gte("starts_at", start).lt("starts_at", end) : { count: 0 };
  const packageMap = new Map((packages ?? []).map((row) => [row.id, row.name]));
  const parentPackageMap = new Map((parents ?? []).map((row) => [row.id, row.package_id]));
  const classMap = new Map((classes ?? []).map((row) => [row.id, row.name]));
  const total = records?.length ?? 0;
  const presentAll = records?.filter(x => x.status === "present" || x.status === "late").length ?? 0;
  const childrenDetail = (students ?? []).map(s => {
    const sRecords = (records ?? []).filter(r => r.student_id === s.id);
    const sPresent = sRecords.filter(r => r.status === "present" || r.status === "late").length;
    const classNames = (enrollments ?? [])
      .filter((row) => row.student_id === s.id)
      .map((row) => classMap.get(row.class_id))
      .filter(Boolean) as string[];
    const packageId = s.package_id ?? parentPackageMap.get(s.parent_id) ?? null;
    return {
      id: s.id,
      full_name: s.full_name,
      package_name: packageId ? packageMap.get(packageId) ?? "-" : "-",
      class_names: classNames,
      total: sRecords.length,
      present: sPresent
    };
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
    attendance: total ? `${Math.round(presentAll / total * 100)}%` : "-",
    childrenDetail,
    paymentStatus,
    paymentDetail
  };
}
