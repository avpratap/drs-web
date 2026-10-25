"use client";

import { useList, useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { useState } from "react";
import { SubscriptionItemsEditor } from "@/components/operations/subscription-items-editor";
import { ActionDialog } from "@/components/resource/action-dialog";
import { CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import { DataTable, type Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, formatQty } from "@/lib/format";
import { cadence } from "@/modules/operations/cadence";
import { operationsActions } from "@/modules/operations/handlers";

type Detail = components["schemas"]["AdminSubscriptionDetail"];
type Item = components["schemas"]["ItemOut"];
type Product = components["schemas"]["ProductOut"];
type Tier = components["schemas"]["PriceTierOut"];

export default function SubscriptionShowPage() {
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const { result: s, query } = useOne<Detail>({ resource: "subscriptions", id });
  const products = useList<Product>({
    resource: "products",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });
  const tiers = useList<Tier>({ resource: "price-tiers", pagination: { mode: "off" } });

  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !s) return <Card>{query.error?.message ?? "Subscription not found."}</Card>;

  const byId = new Map(products.result.data.map((p) => [p.id, p]));
  const columns: Column<Item>[] = [
    { key: "p", header: "Product", cell: (i) => byId.get(i.product_id)?.name ?? `Product #${i.product_id}` },
    {
      key: "c",
      header: "Line",
      hideOnMobile: true,
      cell: (i) => <CategoryBadge category={byId.get(i.product_id)?.category} />,
    },
    {
      key: "q",
      header: "Qty per drop",
      className: "tabular-nums",
      cell: (i) => `${formatQty(i.default_qty)} ${byId.get(i.product_id)?.uom ?? ""}`,
    },
    { key: "f", header: "Cadence", cell: (i) => cadence(i) },
    {
      key: "a",
      header: "Status",
      hideOnMobile: true,
      cell: (i) => <StatusBadge status={i.active ? "active" : "inactive"} />,
    },
  ];
  const tierName = s.price_tier_id
    ? (tiers.result.data.find((t) => t.id === s.price_tier_id)?.name ?? `#${s.price_tier_id}`)
    : "Account default";
  const productOptions = products.result.data.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/subscriptions">Subscriptions</BackLink>}
        title={s.shop_name ?? `Subscription #${s.id}`}
        description={`Subscription #${s.id}`}
        actions={
          <>
            {s.status === "active" && (
              <ActionDialog
                label="Pause"
                title="Pause deliveries?"
                description="No orders are generated while paused. Resume any time."
                onConfirm={() => operationsActions.pauseSubscription(s.id)}
                success="Subscription paused"
                invalidate={["subscriptions"]}
              />
            )}
            {s.status === "paused" && (
              <ActionDialog
                label="Resume"
                variant="primary"
                description="Deliveries restart from the next cutoff."
                onConfirm={() => operationsActions.resumeSubscription(s.id)}
                success="Subscription resumed"
                invalidate={["subscriptions"]}
              />
            )}
            {s.status !== "cancelled" && (
              <ActionDialog
                label="Cancel"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                title="Cancel this subscription?"
                description="The standing order stops for good; the customer would need to subscribe again."
                confirmLabel="Cancel subscription"
                onConfirm={() => operationsActions.cancelSubscription(s.id)}
                success="Subscription cancelled"
                invalidate={["subscriptions"]}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={s.status} /> },
            {
              label: "Shop",
              value: <TextLink href={`/shops/${s.shop_id}`}>{s.shop_name ?? `#${s.shop_id}`}</TextLink>,
            },
            {
              label: "Address",
              value: s.shop_address
                ? `${s.shop_address}${s.shop_pincode ? `, ${s.shop_pincode}` : ""}`
                : (s.shop_pincode ?? "—"),
            },
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
            { label: "Price tier", value: tierName },
            { label: "Since", value: formatDate(s.start_date) },
            { label: "Ends", value: s.end_date ? formatDate(s.end_date) : "Open-ended" },
          ]}
        />
      </Card>

      <section className="mt-8" aria-labelledby="items-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="items-heading" className="text-lg font-semibold text-drs-green">
            Standing order
          </h2>
          {s.status !== "cancelled" && (
            <Button
              variant={editing ? "ghost" : "secondary"}
              onClick={() => setEditing((e) => !e)}
              aria-expanded={editing}
            >
              {editing ? "Close editor" : "Edit lines"}
            </Button>
          )}
        </div>
        {editing ? (
          <Card>
            {products.query.isLoading ? (
              "Loading products…"
            ) : (
              <SubscriptionItemsEditor
                subscriptionId={s.id}
                items={s.items}
                productOptions={productOptions}
                onSaved={() => setEditing(false)}
              />
            )}
          </Card>
        ) : (
          <DataTable
            caption="Standing order"
            columns={columns}
            rows={s.items}
            rowKey={(i) => i.id}
            empty="No lines yet — add products to start deliveries."
          />
        )}
      </section>
    </>
  );
}
