import { AppShell } from "@/components/app/app-shell";
import { PayrollManager } from "@/components/app/payroll-manager";
import { getPayrollWorkspace } from "@/app/finance/page-data";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "Gaji Mentor | BimbelPro",
};

export default async function AdminPayrollPage() {
  const user = await requireRole(["admin"]);
  const rows = await getPayrollWorkspace();
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Gaji Mentor" activeNav="Gaji Mentor">
      <PayrollManager rows={rows} />
    </AppShell>
  );
}
