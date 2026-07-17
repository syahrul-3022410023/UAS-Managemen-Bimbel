import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Laporan Siswa ─────────────────────────────────────────────────────────────

export type LaporanSiswaRow = {
  id: string;
  full_name: string;
  grade: string;
  kelas: string;
  total_sesi: number;
  hadir: number;
  tidak_hadir: number;
  persentase: number;
};

export async function getLaporanSiswa(): Promise<LaporanSiswaRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, grade")
    .order("full_name");

  if (!students?.length) return [];

  const { data: enrollments } = await supabase
    .from("student_classes")
    .select("student_id, class_id, classes(name)")
    .in("student_id", students.map((s) => s.id));

  const { data: attendance } = await supabase
    .from("student_attendance")
    .select("student_id, status")
    .in("student_id", students.map((s) => s.id));

  return students.map((s) => {
    const enroll = (enrollments ?? []).find((e) => e.student_id === s.id);
    const kelasArr = enroll?.classes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kelasName = Array.isArray(kelasArr) ? (kelasArr[0] as any)?.name ?? "-" : (kelasArr as any)?.name ?? "-";

    const records = (attendance ?? []).filter((a) => a.student_id === s.id);
    const total = records.length;
    const hadir = records.filter((a) => a.status === "present" || a.status === "late").length;
    const tidak_hadir = total - hadir;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return {
      id: s.id,
      full_name: s.full_name,
      grade: s.grade ?? "-",
      kelas: kelasName,
      total_sesi: total,
      hadir,
      tidak_hadir,
      persentase,
    };
  });
}

// ─── Laporan Absensi ──────────────────────────────────────────────────────────

export type LaporanAbsensiPoint = {
  tanggal: string;
  hadir: number;
  tidak_hadir: number;
  izin: number;
};

export type LaporanAbsensiResult = {
  chart: LaporanAbsensiPoint[];
  totalHadir: number;
  totalTidakHadir: number;
  totalIzin: number;
  totalSesi: number;
};

export async function getLaporanAbsensi(
  bulan: number,
  tahun: number
): Promise<LaporanAbsensiResult> {
  const supabase = await createSupabaseServerClient();

  const start = new Date(`${tahun}-${String(bulan).padStart(2, "0")}-01T00:00:00+07:00`);
  let nextMonth = bulan + 1;
  let nextYear = tahun;
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+07:00`);

  const { data } = await supabase
    .from("student_attendance")
    .select("status, recorded_at")
    .gte("recorded_at", start.toISOString())
    .lt("recorded_at", end.toISOString())
    .order("recorded_at");

  const byDay: Record<string, { hadir: number; tidak_hadir: number; izin: number }> = {};

  for (const rec of data ?? []) {
    const day = rec.recorded_at?.slice(0, 10) ?? "unknown";
    if (!byDay[day]) byDay[day] = { hadir: 0, tidak_hadir: 0, izin: 0 };
    if (rec.status === "present" || rec.status === "late") byDay[day].hadir++;
    else if (rec.status === "sick" || rec.status === "excused") byDay[day].izin++;
    else byDay[day].tidak_hadir++;
  }

  const chart: LaporanAbsensiPoint[] = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tanggal, v]) => ({
      tanggal: tanggal.slice(5), // MM-DD
      hadir: v.hadir,
      tidak_hadir: v.tidak_hadir,
      izin: v.izin,
    }));

  const totalHadir = chart.reduce((s, p) => s + p.hadir, 0);
  const totalTidakHadir = chart.reduce((s, p) => s + p.tidak_hadir, 0);
  const totalIzin = chart.reduce((s, p) => s + p.izin, 0);
  const totalSesi = totalHadir + totalTidakHadir + totalIzin;

  return { chart, totalHadir, totalTidakHadir, totalIzin, totalSesi };
}

// ─── Laporan Pembayaran ───────────────────────────────────────────────────────

export type LaporanPembayaranPoint = {
  bulan: string;
  pendapatan: number;
  jumlah_transaksi: number;
};

export type LaporanPembayaranResult = {
  chart: LaporanPembayaranPoint[];
  totalPendapatan: number;
  totalTransaksi: number;
  totalInvoice: number;
  totalLunas: number;
  totalBelumLunas: number;
};

export async function getLaporanPembayaran(tahun: number): Promise<LaporanPembayaranResult> {
  const supabase = await createSupabaseServerClient();

  const start = new Date(`${tahun}-01-01T00:00:00+07:00`);
  const end = new Date(`${tahun + 1}-01-01T00:00:00+07:00`);

  const [{ data: payments }, { data: invoices }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString())
      .order("paid_at"),
    supabase
      .from("invoices")
      .select("status")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
  ]);

  const BULAN_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const byMonth: Record<number, { pendapatan: number; jumlah: number }> = {};
  for (let m = 1; m <= 12; m++) byMonth[m] = { pendapatan: 0, jumlah: 0 };

  for (const p of payments ?? []) {
    const m = new Date(p.paid_at).getMonth() + 1;
    byMonth[m].pendapatan += Number(p.amount);
    byMonth[m].jumlah++;
  }

  const chart: LaporanPembayaranPoint[] = Object.entries(byMonth).map(([m, v]) => ({
    bulan: BULAN_NAMES[Number(m) - 1],
    pendapatan: v.pendapatan,
    jumlah_transaksi: v.jumlah,
  }));

  const totalPendapatan = chart.reduce((s, p) => s + p.pendapatan, 0);
  const totalTransaksi = chart.reduce((s, p) => s + p.jumlah_transaksi, 0);
  const totalInvoice = invoices?.length ?? 0;
  const totalLunas = invoices?.filter((i) => i.status === "paid").length ?? 0;
  const totalBelumLunas = invoices?.filter((i) => i.status === "unpaid" || i.status === "partial").length ?? 0;

  return { chart, totalPendapatan, totalTransaksi, totalInvoice, totalLunas, totalBelumLunas };
}
