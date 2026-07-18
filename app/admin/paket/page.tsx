import { AppShell } from "@/components/app/app-shell";
import { MasterDataManager } from "@/components/app/master-data-manager";
import { requireRole } from "@/lib/auth/session";
import { getPackageOptions, getPackageRows } from "../master-data/page-data";

export default async function PackagesPage() {
  const user = await requireRole(["admin"]);
  const [rows, options] = await Promise.all([getPackageRows(), getPackageOptions()]);

  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Paket Bimbel" activeNav="Paket Bimbel">
      <MasterDataManager
        entity="packages"
        singular="Paket Bimbel"
        title="Paket Bimbel"
        description="Atur paket bimbel, mapel, level, harga bulanan, dan tarif gaji mentor per sesi. Jadwal hari/jam tetap dibuat di menu Jadwal."
        rows={rows}
        fields={[
          { key: "name", label: "Nama Paket Bimbel" },
          { key: "level", label: "Level" },
          { key: "subject_name", label: "Mata Pelajaran", table: true, form: false },
          { key: "subject_id", label: "Mata Pelajaran (kosong = semua mapel)", type: "select", options: options.subjects, table: false },
          { key: "sessions_per_month", label: "Sesi/bulan", type: "number" },
          { key: "price", label: "Harga Paket/Bulan", type: "text" },
          { key: "mentor_fee_per_session", label: "Gaji Mentor/Sesi", type: "text" },
          { key: "status_label", label: "Status", table: true, form: false },
          { key: "status", label: "Status", type: "select", options: [{ value: "active", label: "Aktif" }, { value: "inactive", label: "Nonaktif" }], table: false },
          { key: "duration_months", label: "Durasi langganan (bulan)", type: "number", table: false },
          { key: "description", label: "Deskripsi", type: "textarea", table: false }
        ]}
      />
    </AppShell>
  );
}
