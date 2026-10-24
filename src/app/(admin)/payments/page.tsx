"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime, humanize, money } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Payment = components["schemas"]["PaymentOut"];

const columns: Column<Payment>[] = [
  {
    key: "id",
    header: "Payment",
    cell: (p) => (
      <TextLink href={`/payments/${p.id}`} sub={formatDateTime(p.created_at)}>
        #{p.id}
      </TextLink>
    ),
  },
  {
    key: "account",
    header: "Account",
    hideOnMobile: true,
    cell: (p) => <TextLink href={`/accounts/${p.account_id}`}>#{p.account_id}</TextLink>,
  },
  { key: "type", header: "Type", hideOnMobile: true, cell: (p) => <Badge>{humanize(p.payment_type)}</Badge> },
  {
    key: "ref",
    header: "For",
    hideOnMobile: true,
    cell: (p) => (p.ref_type ? `${humanize(p.ref_type)} #${p.ref_id ?? ""}` : "—"),
  },
  { key: "amount", header: "Amount", className: "tabular-nums", cell: (p) => money(p.amount) },
  { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
];

export default function PaymentsPage() {
  return (
    <ResourceList<Payment>
      resource="payments"
      title="Payments"
      description="Gateway payments across orders and wallet top-ups. Open a payment to refund it."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.paymentStatus },
        { field: "account_id", label: "Account #", type: "number" },
        { field: "date_from", label: "From", type: "date" },
        { field: "date_to", label: "To", type: "date" },
      ]}
      empty="No payments match."
    />
  );
}
