"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, formatQty } from "@/lib/format";
import { todayIST } from "@/lib/forms";
import { inventoryActions } from "@/modules/inventory/actions";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { daysUntil } from "@/modules/inventory/stock";

type Batch = components["schemas"]["BatchOut"];

function ExpiryBadge({ date }: { date: string | null | undefined }) {
  if (!date) return <span className="text-drs-ink/70">No expiry</span>;
  const d = daysUntil(date, todayIST());
  const label = formatDate(date);
  if (d < 0) return <Badge tone="maroon">Expired · {label}</Badge>;
  if (d <= 2)
    return (
      <Badge tone="maroon">
        {d === 0 ? "Today" : `${d}d`} · {label}
      </Badge>
    );
  return <span className="tabular-nums">{label}</span>;
}

export default function BatchesPage() {
  const lk = useInventoryLookups();
  const columns: Column<Batch>[] = [
    {
      key: "batch",
      header: "Batch",
      cell: (b) => <span className="font-mono text-xs font-semibold">{b.batch_no}</span>,
    },
    {
      key: "product",
      header: "Product",
      cell: (b) => <TextLink href={`/stock/${b.product_id}`}>{lk.productName(b.product_id)}</TextLink>,
    },
    { key: "location", header: "Location", hideOnMobile: true, cell: (b) => lk.locationName(b.location_id) },
    { key: "qty", header: "Qty", className: "tabular-nums", cell: (b) => formatQty(b.qty) },
    { key: "mfg", header: "Mfg", hideOnMobile: true, cell: (b) => formatDate(b.mfg_date) },
    { key: "expiry", header: "Expiry", cell: (b) => <ExpiryBadge date={b.expiry_date} /> },
    { key: "status", header: "Status", hideOnMobile: true, cell: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <ResourceList<Batch>
      resource="batches"
      title="Batches (FEFO)"
      description="Lots in first-expiry-first-out order — the order stock is consumed in."
      columns={columns}
      filters={[
        { field: "product_id", label: "Product", type: "select", options: lk.productOptions },
        { field: "location_id", label: "Location", type: "select", options: lk.locationOptions },
        { field: "expiring_before", label: "Expiring before", type: "date" },
        {
          field: "active_only",
          label: "Show",
          type: "select",
          allLabel: "Active only",
          options: [{ value: "false", label: "All batches" }],
        },
      ]}
      actions={
        <>
          <ActionDialog
            label="Expire batches"
            title="Write off expired batches"
            confirmVariant="danger"
            description="Every active batch past its expiry date (as of the date below, default today) is written off."
            fields={[
              {
                name: "as_of",
                label: "As of",
                type: "date",
                validate: (v) => !v || (v as string) <= todayIST() || "Can't be in the future",
              },
            ]}
            onConfirm={(v) => inventoryActions.expireBatches(v.as_of as string | undefined)}
            success="Expired batches written off"
            invalidate={["batches", "stock", "stock-low"]}
          />
          <ActionDialog
            label="Receive batch"
            variant="primary"
            fields={[
              {
                name: "product_id",
                label: "Product",
                type: "select",
                options: lk.productOptions,
                required: true,
              },
              {
                name: "location_id",
                label: "Location",
                type: "select",
                options: lk.locationOptions,
                placeholder: "Default location",
              },
              { name: "batch_no", label: "Batch no.", required: true, maxLength: 64, uppercase: true },
              { name: "qty", label: "Quantity", type: "number", required: true, gt: 0, max: 1_000_000 },
              { name: "mfg_date", label: "Manufactured", type: "date" },
              {
                name: "expiry_date",
                label: "Expiry",
                type: "date",
                validate: (v, all) =>
                  !v ||
                  !all.mfg_date ||
                  (v as string) >= (all.mfg_date as string) ||
                  "Expiry is before manufacture",
              },
            ]}
            onConfirm={(v) => inventoryActions.receiveBatch(v)}
            success="Batch received"
            invalidate={["batches", "stock", "stock-low", "reorder-suggestions"]}
          />
        </>
      }
      empty="No batches match."
    />
  );
}
