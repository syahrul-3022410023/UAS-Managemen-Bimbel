import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PayrollSlip } from "@/components/app/payroll-slip";
import { getPayrollDetail } from "@/app/finance/page-data";
import { requireRole } from "@/lib/auth/session";

export default async function MentorPayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["mentor"]);
  const { id } = await params;
  const data = await getPayrollDetail(id);
  if (!data) notFound();
  return (
    <AppShell role={user.role} email={user.email} name={user.name} title="Slip Gaji" activeNav="Slip Gaji">
      <PayrollSlip payroll={data.payroll} details={data.details} />
    </AppShell>
  );
}
