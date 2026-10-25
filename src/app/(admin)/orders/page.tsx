"use client";

import { ExportCsvButton } from "@/components/resource/export-csv";
import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { money } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Order = components["schemas"]["OrderAdminOut"];

const columns: Column<Order>[] = [
  { key: "no", header: "Order", cell: (o) => <TextLink href={`/orders/${o.id}`}>{o.order_no}</TextLink> },
  {
    key: "account",
    header: "Account",
    hideOnMobile: true,
    cell: (o) => <TextLink href={`/accounts/${o.account_id}`}>#{o.account_id}</TextLink>,
  },
  { key: "shop", header: "Shop", hideOnMobile: true, cell: (o) => `#${o.shop_id}` },
  { key: "total", header: "Total", className: "tabular-nums", cell: (o) => money(o.total) },
  {
    key: "pay",
    header: "Payment",
    hideOnMobile: true,
    cell: (o) => <StatusBadge status={o.payment_status} />,
  },
  { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
];

export default function OrdersPage() {
  return (
    <ResourceList<Order>
      actions={<ExportCsvButton kind="orders" />}
      resource="orders"
      title="Orders"
      description="One-off storefront and app orders. Cancel to release stock and refund."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.orderStatus },
        { field: "payment_status", label: "Payment", type: "select", options: OPTIONS.orderPaymentStatus },
        { field: "date_from", label: "From", type: "date" },
        { field: "date_to", label: "To", type: "date" },
      ]}
      empty="No orders match."
    />
  );
}
