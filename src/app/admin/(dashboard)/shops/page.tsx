"use client";

import { useList } from "@refinedev/core";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { RowLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { OPTIONS } from "@/modules/options";

type Shop = components["schemas"]["AdminShopRow"];
type Tier = components["schemas"]["PriceTierOut"];

export default function ShopsPage() {
  const tiers = useList<Tier>({ resource: "price-tiers", pagination: { mode: "off" } });
  const tierName = (id: number | null | undefined) =>
    id ? (tiers.result.data.find((t) => t.id === id)?.name ?? `#${id}`) : "Account default";
  const columns: Column<Shop>[] = [
    {
      key: "shop",
      header: "Shop",
      cell: (s) => (
        <TextLink
          href={`/admin/shops/${s.id}`}
          sub={[s.address, s.pincode].filter(Boolean).join(", ") || undefined}
        >
          {s.name}
          {s.is_home && <span className="sr-only"> (home address)</span>}
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
    { key: "tier", header: "Price tier", hideOnMobile: true, cell: (s) => tierName(s.price_tier_id) },
    {
      key: "sub",
      header: "Subscription",
      hideOnMobile: true,
      cell: (s) =>
        s.subscription_id ? (
          <TextLink href={`/admin/subscriptions/${s.subscription_id}`}>
            <StatusBadge status={s.subscription_status} />
          </TextLink>
        ) : (
          <Badge>None</Badge>
        ),
    },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (s) => (
        <RowLink href={`/admin/shops/${s.id}`} srLabel={s.name}>
          Manage
        </RowLink>
      ),
    },
  ];
  return (
    <ResourceList<Shop>
      resource="shops"
      title="Shops"
      description="Delivery points (B2B outlets and retail homes): price tier and assigned delivery drivers."
      columns={columns}
      filters={[
        { field: "q", label: "Search by name or pincode", type: "search" },
        { field: "status", label: "Status", type: "select", options: OPTIONS.activeInactive },
        {
          field: "price_tier_id",
          label: "Price tier",
          type: "select",
          options: tiers.result.data.map((t) => ({ value: t.id, label: t.name })),
        },
      ]}
      empty="No shops match."
    />
  );
}
