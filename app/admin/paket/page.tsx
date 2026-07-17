import { AppShell } from "@/components/app/app-shell";
import { MasterDataManager } from "@/components/app/master-data-manager";
import { requireRole } from "@/lib/auth/session";
import { getMasterRows } from "../master-data/page-data";
export default async function PackagesPage() { const user = await requireRole(["admin"]); const rows = await getMasterRows("packages"); return <AppShell role={user.role} email={user.email} name={user.name} title="Paket Bimbel" activeNav="Paket"><MasterDataManager entity="packages" singular="Paket" title="Paket Bimbel" description="Atur paket, frekuensi pertemuan, dan biaya." rows={rows} fields={[{ key: "name", label: "Nama paket" }, { key: "duration_months", label: "Durasi (bulan)", type: "number" }, { key: "sessions_per_month", label: "Sesi/bulan", type: "number" }, { key: "price", label: "Biaya", type: "text" }, { key: "description", label: "Deskripsi", type: "textarea", table: false }]} /></AppShell>; }
