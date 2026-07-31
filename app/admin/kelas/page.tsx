import { AppShell } from "@/components/app/app-shell";
import { ClassManager } from "@/components/app/class-manager";
import { requireRole } from "@/lib/auth/session";
import { getClassWorkspace } from "./page-data";

export default async function ClassesPage() { const user = await requireRole(["admin"]); const data = await getClassWorkspace(); return <AppShell role={user.role} email={user.email} name={user.name} title="Program & Kelas Bimbel" activeNav="Kelas"><ClassManager rows={data.classes} packages={data.packages} mentors={data.mentors}/></AppShell>; }
