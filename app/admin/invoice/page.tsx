import { AppShell } from "@/components/app/app-shell";
import { InvoiceManager } from "@/components/app/invoice-manager";
import { requireRole } from "@/lib/auth/session";
import { getAdminInvoices } from "@/app/billing/page-data";
import { getStudentOptions } from "@/app/billing/page-data";

export const metadata = {
  title: "Invoice | BimbelPro",
  description: "Kelola invoice dan tagihan bimbel",
};

export default async function AdminInvoicePage() {
  const user = await requireRole(["admin"]);
  const [invoices, students] = await Promise.all([
    getAdminInvoices(),
    getStudentOptions(),
  ]);

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Invoice"
      activeNav="Invoice"
    >
      <InvoiceManager invoices={invoices} students={students} />
    </AppShell>
  );
}
