import { AppShell } from "@/components/app/app-shell";
import { LaporanManager } from "@/components/app/laporan-manager";
import { requireRole } from "@/lib/auth/session";
import {
  getLaporanSiswa,
  getLaporanAbsensi,
  getLaporanPembayaran,
} from "@/lib/laporan/data";

export const metadata = {
  title: "Laporan | BimbelPro",
  description: "Laporan operasional bimbingan belajar — siswa, absensi, dan pembayaran",
};

export default async function AdminLaporanPage() {
  const user = await requireRole(["admin"]);

  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  const [siswadata, absensiData, pembayaranData] = await Promise.all([
    getLaporanSiswa(),
    getLaporanAbsensi(bulan, tahun),
    getLaporanPembayaran(tahun),
  ]);

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Laporan"
      activeNav="Laporan"
    >
      <LaporanManager
        siswadata={siswadata}
        absensiData={absensiData}
        pembayaranData={pembayaranData}
        initBulan={bulan}
        initTahun={tahun}
      />
    </AppShell>
  );
}
