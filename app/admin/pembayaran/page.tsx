import { AppShell } from "@/components/app/app-shell";
import { PaymentHistory } from "@/components/app/payment-history";
import { requireRole } from "@/lib/auth/session";
import { getAdminPayments } from "@/app/billing/page-data";

export const metadata = {
  title: "Rekap Pembayaran | BimbelPro",
  description: "Riwayat seluruh transaksi pembayaran",
};

export default async function AdminPaymentsPage() {
  const user = await requireRole(["admin"]);
  const payments = await getAdminPayments();

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Pembayaran"
      activeNav="Pembayaran"
    >
      <PaymentHistory payments={payments} />
    </AppShell>
  );
}
