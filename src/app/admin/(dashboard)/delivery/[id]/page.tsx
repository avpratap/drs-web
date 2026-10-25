"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { PodViewer } from "@/components/delivery/pod-viewer";
import { ItemsTable } from "@/components/inventory/items-table";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { components } from "@/lib/api/client";
import { formatDate, formatDateTime, formatQty, humanize, money } from "@/lib/format";
import { deliveryActions } from "@/modules/delivery/actions";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { OPTIONS } from "@/modules/options";

type F = components["schemas"]["FulfillmentOut"];
type Item = components["schemas"]["DeliveryOrderItemOut"];
type Cash = components["schemas"]["CashCollectionOut"];
type Ret = components["schemas"]["ReturnLineOut"];

export default function DeliveryShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: f, query } = useOne<F & { id?: number }>({ resource: "delivery-orders", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !f) return <Card>{query.error?.message ?? "Delivery order not found."}</Card>;
  const o = f.order;
  const open = o.status === "generated" || o.status === "frozen";
  const done = o.status === "delivered" || o.status === "partially_delivered";

  return (
    <>
      <PageHeader
        eyebrow={
          <BackLink href={`/admin/delivery?date=${o.delivery_date}`}>
            Deliveries on {formatDate(o.delivery_date)}
          </BackLink>
        }
        title={o.shop_name ?? `Shop #${o.shop_id}`}
        description={`Delivery order #${o.id}`}
        actions={
          <>
            {done && (
              <ActionDialog
                label="Generate invoice"
                description="Creates the GST invoice for what was delivered."
                onConfirm={() => deliveryActions.generateInvoice(o.id)}
                success="Invoice generated"
                invalidate={["delivery-orders"]}
              />
            )}
            {open && (
              <ActionDialog
                label="Mark failed"
                variant="danger"
                confirmVariant="danger"
                title="Mark this stop as failed?"
                fields={[
                  {
                    name: "reason",
                    label: "Reason",
                    type: "select",
                    options: OPTIONS.failReason,
                    required: true,
                  },
                ]}
                onConfirm={(v) => deliveryActions.markFailed(o.id, v)}
                success="Stop marked failed"
                invalidate={["delivery-orders", "delivery-summary"]}
              />
            )}
          </>
        }
      />
      <StatGrid>
        <StatCard label="Status" value={<StatusBadge status={o.status} />} />
        <StatCard label="Order total" value={money(o.total)} />
        <StatCard label="Amount due" value={money(o.amount_due)} />
        <StatCard label="Cash collected" value={money(f.cash_total ?? 0)} accent />
      </StatGrid>
      <Card className="mt-6">
        <DescriptionList
          items={[
            { label: "Date", value: formatDate(o.delivery_date) },
            { label: "Origin", value: humanize(o.origin) },
            {
              label: "Contact",
              value: o.contact_name
                ? `${o.contact_name}${o.contact_phone ? ` · ${o.contact_phone}` : ""}`
                : "—",
            },
            { label: "Address", value: o.address ? `${o.address}${o.pincode ? `, ${o.pincode}` : ""}` : "—" },
            { label: "Failure reason", value: o.failure_reason ? humanize(o.failure_reason) : "—" },
          ]}
        />
      </Card>

      <ItemsTable<Item>
        caption="Items"
        rows={o.items}
        columns={[
          { key: "p", header: "Product", cell: (i) => lk.productName(i.product_id) },
          {
            key: "plan",
            header: "Planned",
            className: "tabular-nums",
            cell: (i) => formatQty(i.qty_planned),
          },
          {
            key: "del",
            header: "Delivered",
            className: "tabular-nums",
            cell: (i) => formatQty(i.qty_delivered),
          },
          {
            key: "price",
            header: "Unit price",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (i) => money(i.unit_price),
          },
          { key: "line", header: "Line total", className: "tabular-nums", cell: (i) => money(i.line_total) },
          { key: "s", header: "Status", hideOnMobile: true, cell: (i) => <StatusBadge status={i.status} /> },
        ]}
      />

      <section className="mt-8" aria-labelledby="pod-heading">
        <h2 id="pod-heading" className="mb-3 text-lg font-semibold text-drs-green">
          Proof of delivery
        </h2>
        <PodViewer pods={f.pod ?? []} />
      </section>

      <ItemsTable<Cash>
        caption="Cash collected"
        rows={f.cash ?? []}
        columns={[
          {
            key: "amt",
            header: "Amount",
            className: "tabular-nums font-medium",
            cell: (c) => money(c.amount_collected),
          },
          { key: "m", header: "Method", cell: (c) => <Badge>{c.method.toUpperCase()}</Badge> },
          { key: "ref", header: "Reference", cell: (c) => c.reference ?? "—" },
          {
            key: "by",
            header: "Collected by",
            hideOnMobile: true,
            cell: (c) => (c.collected_by ? `User #${c.collected_by}` : "—"),
          },
          { key: "at", header: "When", hideOnMobile: true, cell: (c) => formatDateTime(c.collected_at) },
        ]}
      />

      <ItemsTable<Ret>
        caption="Returns"
        rows={f.returns ?? []}
        columns={[
          { key: "p", header: "Product", cell: (r) => lk.productName(r.product_id) },
          { key: "q", header: "Qty", className: "tabular-nums", cell: (r) => formatQty(r.qty_returned) },
          { key: "r", header: "Reason", cell: (r) => humanize(r.reason) },
          { key: "at", header: "When", hideOnMobile: true, cell: (r) => formatDateTime(r.created_at) },
        ]}
      />
    </>
  );
}
