import { AppShell } from "@/components/app/app-shell";
import { CashFlowManager } from "@/components/app/cash-flow-manager";
import { getCashFlowWorkspace } from "@/app/finance/page-data";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "Arus Kas | BimbelPro",
};

export default async function AdminCashFlowPage() {
  const user = await requireRole(["admin"]);
  const data = await getCashFlowWorkspace();
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Arus Kas" activeNav="Arus Kas">
      <CashFlowManager rows={data.rows} totalIncome={data.totalIncome} totalExpense={data.totalExpense} />
    </AppShell>
  );
}
