"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime, money } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Rma = components["schemas"]["RMAOut"];

const columns: Column<Rma>[] = [
  {
    key: "rma",
    header: "Return",
    cell: (r) => (
      <TextLink href={`/returns/${r.id}`} sub={formatDateTime(r.created_at)}>
        {r.rma_no}
      </TextLink>
    ),
  },
  {
    key: "order",
    header: "Order",
    hideOnMobile: true,
    cell: (r) => <TextLink href={`/orders/${r.order_id}`}>#{r.order_id}</TextLink>,
  },
  {
    key: "account",
    header: "Account",
    hideOnMobile: true,
    cell: (r) => <TextLink href={`/accounts/${r.account_id}`}>#{r.account_id}</TextLink>,
  },
  {
    key: "lines",
    header: "Lines",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (r) => r.items.length,
  },
  {
    key: "refund",
    header: "Refunded",
    className: "tabular-nums",
    cell: (r) => (r.refund_amount ? money(r.refund_amount) : "—"),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (r) => (
      <RowLink href={`/returns/${r.id}`} srLabel={r.rma_no}>
        Review
      </RowLink>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <ResourceList<Rma>
      resource="returns"
      title="Returns (RMA)"
      description="Customer returns on one-off orders. Approved returns are refunded as wallet store credit."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.rmaStatus },
        { field: "order_id", label: "Order #", type: "number" },
        { field: "account_id", label: "Account #", type: "number" },
      ]}
      initialFilters={[{ field: "status", operator: "eq", value: "requested" }]}
      empty="No returns match."
    />
  );
}
