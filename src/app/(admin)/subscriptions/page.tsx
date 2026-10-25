"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Row = components["schemas"]["AdminSubscriptionRow"];

const columns: Column<Row>[] = [
  {
    key: "shop",
    header: "Shop",
    cell: (s) => (
      <TextLink href={`/subscriptions/${s.id}`} sub={`Subscription #${s.id}`}>
        {s.shop_name ?? `Shop #${s.shop_id}`}
      </TextLink>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    hideOnMobile: true,
    cell: (s) => (
      <span>
        {s.customer_name ?? "—"}
        {s.customer_phone && <span className="block text-xs text-drs-ink/70">{s.customer_phone}</span>}
      </span>
    ),
  },
  { key: "lines", header: "Lines", className: "tabular-nums", cell: (s) => s.item_count },
  { key: "start", header: "Since", hideOnMobile: true, cell: (s) => formatDate(s.start_date) },
  { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (s) => (
      <RowLink href={`/subscriptions/${s.id}`} srLabel={`subscription ${s.id}`}>
        Manage
      </RowLink>
    ),
  },
];

export default function SubscriptionsPage() {
  return (
    <ResourceList<Row>
      resource="subscriptions"
      title="Subscriptions"
      description="Standing orders, one per shop. The nightly cutoff turns active ones into the next day's deliveries."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.subscriptionStatus },
        { field: "shop_id", label: "Shop #", type: "number" },
        { field: "account_id", label: "Account #", type: "number" },
      ]}
      empty="No subscriptions match."
    />
  );
}
