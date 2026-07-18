import { AppShell } from "@/components/app/app-shell";
import { MasterDataManager } from "@/components/app/master-data-manager";
import { requireRole } from "@/lib/auth/session";
import { getMasterRows } from "../master-data/page-data";
export default async function SubjectsPage() { const user = await requireRole(["admin"]); const rows = await getMasterRows("subjects"); return <AppShell role={user.role} email={user.email} name={user.name} title="Mata Pelajaran" activeNav="Mata Pelajaran"><MasterDataManager entity="subjects" singular="Mata Pelajaran" title="Mata Pelajaran" description="Kelola mata pelajaran yang tersedia di bimbel." rows={rows} fields={[{ key: "name", label: "Nama mata pelajaran" }, { key: "level", label: "Jenjang", type: "select", options: [{ value: "TK", label: "TK" }, { value: "SD", label: "SD" }, { value: "SMP", label: "SMP" }, { value: "SMA", label: "SMA" }] }, { key: "description", label: "Deskripsi", type: "textarea", table: false }]} /></AppShell>; }
