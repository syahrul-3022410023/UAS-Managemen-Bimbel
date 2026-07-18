import { AppShell } from "@/components/app/app-shell";
import { ParentInvoiceView } from "@/components/app/parent-invoice-view";
import { requireRole } from "@/lib/auth/session";
import { getParentInvoices } from "@/app/billing/page-data";

export const metadata = {
  title: "Invoice SPP | BimbelPro",
  description: "Tagihan bimbel anak Anda",
};

export default async function ParentInvoicePage() {
  const user = await requireRole(["parent"]);
  const invoices = await getParentInvoices(user.id);

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Invoice SPP"
      activeNav="Invoice SPP"
    >
      <ParentInvoiceView invoices={invoices} />
    </AppShell>
  );
}
