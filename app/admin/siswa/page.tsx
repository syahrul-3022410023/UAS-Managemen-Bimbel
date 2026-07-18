import { AppShell } from "@/components/app/app-shell";
import { MasterDataManager } from "@/components/app/master-data-manager";
import { requireRole } from "@/lib/auth/session";
import { getStudentOptions, getStudentRows } from "../master-data/page-data";

export default async function StudentsPage() {
  const user = await requireRole(["admin"]); const [rows, options] = await Promise.all([getStudentRows(), getStudentOptions()]);
  return <AppShell role={user.role} email={user.email} name={user.name} title="Data Siswa" activeNav="Siswa"><MasterDataManager entity="students" singular="Siswa" title="Manajemen Siswa" description="Kelola data siswa, orang tua, dan paket bimbelnya." rows={rows} detailBasePath="/admin/siswa" fields={[{ key: "full_name", label: "Nama siswa" }, { key: "student_number", label: "Kode siswa", form: false }, { key: "grade", label: "Kelas" }, { key: "parent_name", label: "Orang tua", table: true, form: false }, { key: "parent_phone", label: "No. HP orang tua" }, { key: "package_name", label: "Paket Bimbel", table: true, form: false }, { key: "birth_date", label: "Tanggal lahir", type: "date", table: false }, { key: "school_name", label: "Sekolah", table: false }, { key: "parent_id", label: "Orang tua", type: "select", options: options.parents, table: false }, { key: "package_id", label: "Paket Bimbel", type: "select", options: options.packages, table: false }, { key: "address", label: "Alamat", type: "textarea", table: false }]} /></AppShell>;

}
