import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PayrollSlip } from "@/components/app/payroll-slip";
import { getPayrollDetail } from "@/app/finance/page-data";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["admin"]);
  const { id } = await params;
  const data = await getPayrollDetail(id);
  if (!data) notFound();
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Slip Gaji" activeNav="Gaji Mentor">
      <PayrollSlip payroll={data.payroll} details={data.details} />
    </AppShell>
  );
}
