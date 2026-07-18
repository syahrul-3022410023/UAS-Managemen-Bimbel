import { AppShell } from "@/components/app/app-shell";
import { InvoiceDetailView } from "@/components/app/invoice-detail";
import { requireRole } from "@/lib/auth/session";
import { getInvoiceDetail } from "@/app/billing/page-data";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoiceDetail(id);
  return {
    title: invoice
      ? `Invoice SPP ${invoice.student_name} | BimbelPro`
      : "Invoice SPP | BimbelPro",
  };
}

export default async function AdminInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireRole(["admin"]);
  const invoice = await getInvoiceDetail(id);

  if (!invoice) notFound();

  return (
    <AppShell
      role={user.role}
      email={user.email}
      name={user.name}
      title="Detail Invoice SPP"
      activeNav="Invoice SPP"
    >
      <InvoiceDetailView invoice={invoice} />
    </AppShell>
  );
}
