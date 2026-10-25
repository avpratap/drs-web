"use client";

import { ExportCsvButton } from "@/components/resource/export-csv";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/forms";
import { useAccountOptions } from "@/modules/engagement/use-account-options";
import type { Invoice } from "@/modules/insights/handlers";

export default function InvoicesPage() {
  const accounts = useAccountOptions();
  const columns: Column<Invoice>[] = [
    {
      key: "no",
      header: "Invoice",
      cell: (i) => (
        <TextLink href={`/admin/invoices/${i.id}`} sub={formatDate(i.invoice_date)}>
          {i.invoice_no}
        </TextLink>
      ),
    },
    {
      key: "account",
      header: "Account",
      hideOnMobile: true,
      cell: (i) => (
        <TextLink href={`/admin/accounts/${i.account_id}`}>{accounts.name(i.account_id)}</TextLink>
      ),
    },
    {
      key: "kind",
      header: "Type",
      cell: (i) =>
        i.is_credit_note ? (
          <Badge tone="maroon">Credit note</Badge>
        ) : (
          <Badge>{i.is_partial ? "Partial" : "Tax invoice"}</Badge>
        ),
    },
    {
      key: "tax",
      header: "GST",
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (i) => money(i.cgst + i.sgst + i.igst),
    },
    { key: "total", header: "Total", className: "tabular-nums font-medium", cell: (i) => money(i.total) },
    { key: "status", header: "Status", hideOnMobile: true, cell: (i) => <StatusBadge status={i.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (i) => (
        <RowLink href={`/admin/invoices/${i.id}`} srLabel={i.invoice_no}>
          View
        </RowLink>
      ),
    },
  ];
  return (
    <ResourceList<Invoice>
      resource="invoices"
      title="Invoices"
      description="GST tax invoices and credit notes, newest first. Open one to view or download its PDF."
      columns={columns}
      actions={<ExportCsvButton kind="invoices" />}
      empty="No invoices yet."
    />
  );
}
