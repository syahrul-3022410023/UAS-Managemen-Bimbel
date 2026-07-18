import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    payrollThisMonth
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
  const { data: mentor } = await supabase.from("mentors").select("id").eq("profile_id", userId).maybeSingle();

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
    supabase.from("mentor_assignments").select("class_id").eq("mentor_id", mentor.id),
    supabase.from("schedules").select("id", { count: "exact", head: true }).eq("mentor_id", mentor.id).gte("starts_at", start).lt("starts_at", end),
    supabase.from("payrolls").select("month, year, total_amount").eq("mentor_id", mentor.id).order("created_at", { ascending: false }).limit(1),
    supabase.from("payrolls").select("total_amount").eq("mentor_id", mentor.id).eq("month", period.month).eq("year", period.year),
    supabase.from("schedules").select("id, class_id, starts_at, ends_at, room").eq("mentor_id", mentor.id).gte("starts_at", start).order("starts_at", { ascending: true }).limit(5),
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
      subject_name: classRow?.subject_id ? subjectMap.get(classRow.subject_id) ?? "-" : "-",
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
  const { data: parent } = await supabase.from("parents").select("id").eq("profile_id", userId).maybeSingle();
  if (!parent) return { children: 0, schedule: 0, attendance: "-", childrenDetail: emptyChildren, paymentStatus: "-", paymentDetail: "-" };

  const { data: students } = await supabase.from("students").select("id, full_name, package_id").eq("parent_id", parent.id);
  const ids = (students ?? []).map(x => x.id);
  if (!ids.length) return { children: 0, schedule: 0, attendance: "-", childrenDetail: emptyChildren, paymentStatus: "-", paymentDetail: "-" };

  const [{ data: enrollments }, { data: records }, { data: invoices }, { data: packages }] = await Promise.all([
    supabase.from("student_classes").select("student_id, class_id").in("student_id", ids),
    supabase.from("student_attendance").select("student_id, status").in("student_id", ids),
    supabase.from("invoices").select("status").in("student_id", ids),
    supabase.from("packages").select("id, name")
  ]);
  const classIds = [...new Set((enrollments ?? []).map(x => x.class_id))];
  const { data: classes } = classIds.length ? await supabase.from("classes").select("id, name").in("id", classIds) : { data: [] };
  const { count: schedule } = classIds.length ? await supabase.from("schedules").select("id", { count: "exact", head: true }).in("class_id", classIds).gte("starts_at", start).lt("starts_at", end) : { count: 0 };
  const packageMap = new Map((packages ?? []).map((row) => [row.id, row.name]));
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
    return {
      id: s.id,
      full_name: s.full_name,
      package_name: s.package_id ? packageMap.get(s.package_id) ?? "-" : "-",
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
