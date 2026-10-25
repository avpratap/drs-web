"use client";

import { useList, useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import { DataTable, type Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { operationsActions } from "@/modules/operations/handlers";

type Shop = components["schemas"]["AdminShopDetail"];
type Driver = components["schemas"]["ShopDriverOut"];
type Tier = components["schemas"]["PriceTierOut"];
type User = components["schemas"]["UserAdminOut"];

const REFRESH = ["shops", "subscriptions"];

export default function ShopShowPage() {
  const { id } = useParams<{ id: string }>();
  const { result: s, query } = useOne<Shop>({ resource: "shops", id });
  const tiers = useList<Tier>({ resource: "price-tiers", pagination: { mode: "off" } });
  const drivers = useList<User>({
    resource: "users",
    pagination: { mode: "off" },
    filters: [
      { field: "role", operator: "eq", value: "delivery" },
      { field: "status", operator: "eq", value: "active" },
    ],
  });

  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !s) return <Card>{query.error?.message ?? "Shop not found."}</Card>;

  const tierName = s.price_tier_id
    ? (tiers.result.data.find((t) => t.id === s.price_tier_id)?.name ?? `#${s.price_tier_id}`)
    : "Account default";
  const assigned = new Set(s.drivers.filter((d) => d.active).map((d) => d.delivery_id));
  const driverOptions = drivers.result.data
    .filter((u) => !assigned.has(u.id))
    .map((u) => ({ value: u.id, label: `${u.full_name || "Driver"} · ${u.phone}` }));

  const columns: Column<Driver>[] = [
    {
      key: "driver",
      header: "Driver",
      cell: (d) => (
        <span className="font-medium">
          {d.full_name || "Driver"}
          <span className="block text-xs font-normal text-drs-ink/70">{d.phone}</span>
        </span>
      ),
    },
    {
      key: "state",
      header: "Status",
      cell: (d) => (d.active ? <Badge tone="green">Assigned</Badge> : <Badge>Removed</Badge>),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (d) =>
        d.active ? (
          <ActionDialog
            label="Unassign"
            variant="ghost"
            triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
            confirmVariant="danger"
            title={`Unassign ${d.full_name || d.phone}?`}
            description="They stop seeing this shop on their route from the next delivery."
            onConfirm={() => operationsActions.unassignDriver(d.assignment_id)}
            success="Driver unassigned"
            invalidate={REFRESH}
          />
        ) : (
          <span className="text-drs-ink/70">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/shops">Shops</BackLink>}
        title={s.name}
        description={[s.address, s.pincode].filter(Boolean).join(", ") || undefined}
        actions={
          <>
            <ActionDialog
              label="Set price tier"
              variant="primary"
              defaultValues={{ price_tier_id: s.price_tier_id ?? "" }}
              description="Prices for this shop's deliveries come from this tier (overrides the account's tier)."
              fields={[
                {
                  name: "price_tier_id",
                  label: "Price tier",
                  type: "select",
                  required: true,
                  options: tiers.result.data.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` })),
                },
              ]}
              onConfirm={(v) => operationsActions.setShopTier(s.id, v.price_tier_id as number)}
              success="Price tier set"
              invalidate={REFRESH}
            />
            {s.status === "active" ? (
              <ActionDialog
                label="Deactivate"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                title="Deactivate this shop?"
                description="The nightly cutoff skips inactive shops, so no new deliveries are generated."
                onConfirm={() => operationsActions.setShopStatus(s.id, "inactive")}
                success="Shop deactivated"
                invalidate={REFRESH}
              />
            ) : (
              <ActionDialog
                label="Reactivate"
                onConfirm={() => operationsActions.setShopStatus(s.id, "active")}
                success="Shop reactivated"
                invalidate={REFRESH}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={s.status} /> },
            { label: "Price tier", value: tierName },
            {
              label: "Customer",
              value: s.customer_name
                ? `${s.customer_name}${s.customer_phone ? ` · ${s.customer_phone}` : ""}`
                : (s.customer_phone ?? "—"),
            },
            {
              label: "Account",
              value: <TextLink href={`/accounts/${s.account_id}`}>#{s.account_id}</TextLink>,
            },
            {
              label: "Subscription",
              value: s.subscription_id ? (
                <TextLink href={`/subscriptions/${s.subscription_id}`}>
                  #{s.subscription_id} · <StatusBadge status={s.subscription_status} />
                </TextLink>
              ) : (
                "None"
              ),
            },
            { label: "State (GST)", value: s.state ?? "—" },
            { label: "Type", value: s.is_home ? "Retail home" : "Outlet" },
          ]}
        />
      </Card>

      <section className="mt-8" aria-labelledby="drivers-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="drivers-heading" className="text-lg font-semibold text-drs-green">
            Delivery drivers
          </h2>
          <ActionDialog
            label="Assign driver"
            disabled={driverOptions.length === 0}
            description="The driver sees this shop's stops on their route and can mark them delivered."
            fields={[
              {
                name: "delivery_id",
                label: "Driver",
                type: "select",
                required: true,
                options: driverOptions,
              },
            ]}
            onConfirm={(v) => operationsActions.assignDriver(s.id, v.delivery_id as number)}
            success="Driver assigned"
            invalidate={REFRESH}
          />
        </div>
        <DataTable
          caption="Delivery drivers"
          columns={columns}
          rows={s.drivers}
          rowKey={(d) => d.assignment_id}
          empty="No driver assigned yet."
        />
      </section>
    </>
  );
}
