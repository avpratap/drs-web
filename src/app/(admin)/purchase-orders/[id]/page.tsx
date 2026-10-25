"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ItemsTable } from "@/components/inventory/items-table";
import { ActionDialog } from "@/components/resource/action-dialog";
import { LineItems } from "@/components/resource/line-items";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatDate, formatQty, money } from "@/lib/format";
import { inventoryActions } from "@/modules/inventory/actions";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type PO = components["schemas"]["POOut"];
type Item = components["schemas"]["POItemOut"];
const REFRESH = ["purchase-orders", "stock", "batches", "stock-low", "reorder-suggestions"];

type GrnLine = {
  product_id: number;
  qty_received: number;
  batch_no?: string;
  mfg_date?: string;
  expiry_date?: string;
};

export default function PurchaseOrderShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups({ suppliers: true });
  const { result: po, query } = useOne<PO>({ resource: "purchase-orders", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !po) return <Card>{query.error?.message ?? "Purchase order not found."}</Card>;

  const open = po.items.filter((i) => i.qty_received < i.qty_ordered);
  const receivable = po.status === "placed" || po.status === "partially_received";

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/purchase-orders">Purchase orders</BackLink>}
        title={po.po_no}
        actions={
          <>
            {po.status === "draft" && (
              <ActionDialog
                label="Place order"
                variant="primary"
                description={`Send ${po.po_no} (${money(po.total)}) to ${lk.supplierName(po.supplier_id)}.`}
                onConfirm={() => inventoryActions.placePO(po.id)}
                success="Purchase order placed"
                invalidate={REFRESH}
              />
            )}
            {receivable && (
              <ActionDialog
                label="Receive goods (GRN)"
                variant="primary"
                wide
                title={`Goods receipt for ${po.po_no}`}
                description="Each received line becomes a stock batch. Set quantity to 0 for lines not received."
                defaultValues={{
                  lines: open.map((i) => ({
                    product_id: i.product_id,
                    qty_received: i.qty_ordered - i.qty_received,
                  })),
                }}
                toBody={(v) => ({
                  // product_id comes from the PO (the read-only select may not be submitted).
                  lines: (v.lines as GrnLine[])
                    .map((l, i) => ({ ...l, product_id: open[i].product_id }))
                    .filter((l) => l.qty_received > 0)
                    .map((l) => ({
                      product_id: l.product_id,
                      qty_received: l.qty_received,
                      batch_no: (l.batch_no ?? "").trim().toUpperCase(),
                      mfg_date: l.mfg_date || null,
                      expiry_date: l.expiry_date || null,
                    })),
                })}
                onConfirm={(body) => inventoryActions.receivePO(po.id, body)}
                success="Goods received: GRN posted and batches created"
                invalidate={REFRESH}
              >
                {(form) => (
                  <LineItems
                    form={form}
                    name="lines"
                    legend="Lines to receive"
                    fixed
                    columns={[
                      {
                        name: "product_id",
                        label: "Product",
                        type: "select",
                        options: lk.productOptions,
                        readOnly: true,
                      },
                      {
                        name: "qty_received",
                        label: "Qty received",
                        type: "number",
                        required: true,
                        min: 0,
                        max: 1_000_000,
                      },
                      { name: "batch_no", label: "Batch no.", required: true, maxLength: 64 },
                      { name: "mfg_date", label: "Mfg", type: "date" },
                      {
                        name: "expiry_date",
                        label: "Expiry",
                        type: "date",
                        validate: (v, row) =>
                          !v || !row.mfg_date || String(v) >= String(row.mfg_date) || "Expiry is before manufacture",
                      },
                    ]}
                  />
                )}
              </ActionDialog>
            )}
            {(po.status === "draft" || po.status === "placed") && (
              <ActionDialog
                label="Cancel PO"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                onConfirm={() => inventoryActions.cancelPO(po.id)}
                success="Purchase order cancelled"
                invalidate={REFRESH}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={po.status} /> },
            { label: "Supplier", value: lk.supplierName(po.supplier_id) },
            { label: "Deliver to", value: lk.locationName(po.location_id) },
            { label: "Expected", value: formatDate(po.expected_date) },
            { label: "Subtotal", value: money(po.subtotal) },
            { label: "Total", value: <span className="font-semibold">{money(po.total)}</span> },
          ]}
        />
      </Card>
      <ItemsTable<Item>
        caption="Lines"
        rows={po.items}
        columns={[
          {
            key: "product",
            header: "Product",
            cell: (i) => <TextLink href={`/stock/${i.product_id}`}>{lk.productName(i.product_id)}</TextLink>,
          },
          {
            key: "ordered",
            header: "Ordered",
            className: "tabular-nums",
            cell: (i) => formatQty(i.qty_ordered),
          },
          {
            key: "received",
            header: "Received",
            className: "tabular-nums",
            cell: (i) => formatQty(i.qty_received),
          },
          {
            key: "cost",
            header: "Unit cost",
            className: "tabular-nums",
            hideOnMobile: true,
            cell: (i) => money(i.unit_cost),
          },
          { key: "line", header: "Line total", className: "tabular-nums", cell: (i) => money(i.line_total) },
        ]}
      />
    </>
  );
}
