"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime, money } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Refund = components["schemas"]["app__api__v1__admin_sales__RefundOut"];

const columns: Column<Refund>[] = [
  {
    key: "id",
    header: "Refund",
    cell: (r) => (
      <TextLink href={`/admin/refunds/${r.id}`} sub={formatDateTime(r.created_at)}>
        #{r.id}
      </TextLink>
    ),
  },
  {
    key: "payment",
    header: "Payment",
    cell: (r) => <TextLink href={`/admin/payments/${r.payment_id}`}>#{r.payment_id}</TextLink>,
  },
  {
    key: "account",
    header: "Account",
    hideOnMobile: true,
    cell: (r) => <TextLink href={`/admin/accounts/${r.account_id}`}>#{r.account_id}</TextLink>,
  },
  { key: "amount", header: "Amount", className: "tabular-nums", cell: (r) => money(r.amount) },
  { key: "reason", header: "Reason", hideOnMobile: true, cell: (r) => r.reason ?? "—" },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

export default function RefundsPage() {
  return (
    <ResourceList<Refund>
      resource="refunds"
      title="Refunds"
      description="Refunds issued against gateway payments. Reconcile ones the gateway hasn't confirmed."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.refundStatus },
        { field: "payment_id", label: "Payment #", type: "number" },
        { field: "account_id", label: "Account #", type: "number" },
      ]}
      empty="No refunds match."
    />
  );
}
