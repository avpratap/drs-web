"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ItemsTable } from "@/components/inventory/items-table";
import { InvoicePdfButton } from "@/components/billing/invoice-pdf";
import { ActionDialog } from "@/components/resource/action-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatQty, humanize, money } from "@/lib/format";
import { deliveryActions } from "@/modules/delivery/actions";
import { insightsActions } from "@/modules/insights/handlers";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Order = components["schemas"]["OrderOut"];
type Item = components["schemas"]["OrderItemOut"];

/** An invoice exists (or can be issued) once the order has been paid. */
const INVOICEABLE = new Set(["paid", "partially_refunded", "refunded"]);

export default function OrderShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: o, query } = useOne<Order>({ resource: "orders", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !o) return <Card>{query.error?.message ?? "Order not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/orders">Orders</BackLink>}
        title={o.order_no}
        actions={
          <>
            {INVOICEABLE.has(o.payment_status) && (
              <InvoicePdfButton
                label="Invoice PDF"
                resolve={async () => (await insightsActions.orderInvoice(o.id)).id}
              />
            )}
            {o.status !== "cancelled" && o.status !== "delivered" && (
              <ActionDialog
                label="Cancel order"
                variant="danger"
                confirmVariant="danger"
                description="Releases reserved stock; paid amounts are refunded per the payment method."
                onConfirm={() => deliveryActions.cancelOrder(o.id)}
                success="Order cancelled"
                invalidate={["orders"]}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={o.status} /> },
            { label: "Payment", value: <StatusBadge status={o.payment_status} /> },
            { label: "Type", value: humanize(o.order_type) },
            { label: "Subtotal", value: money(o.subtotal) },
            {
              label: "Discount",
              value: o.discount ? `−${money(o.discount)}${o.coupon_code ? ` (${o.coupon_code})` : ""}` : "—",
            },
            { label: "Tax", value: money(o.tax_total ?? 0) },
            {
              label: "Total",
              value: <span className="font-semibold">{money(o.total_incl_tax || o.total)}</span>,
            },
          ]}
        />
      </Card>
      <ItemsTable<Item>
        caption="Items"
        rows={o.items ?? []}
        columns={[
          { key: "p", header: "Product", cell: (i) => lk.productName(i.product_id) },
          { key: "q", header: "Qty", className: "tabular-nums", cell: (i) => formatQty(i.qty) },
          {
            key: "u",
            header: "Unit price",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (i) => money(i.unit_price),
          },
          {
            key: "g",
            header: "GST",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (i) => `${i.gst_rate ?? 0}%`,
          },
          { key: "l", header: "Line total", className: "tabular-nums", cell: (i) => money(i.line_total) },
        ]}
      />
    </>
  );
}
