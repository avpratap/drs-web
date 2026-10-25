"use client";

import { StockActions } from "@/components/inventory/stock-actions";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { isLow } from "@/modules/inventory/stock";

type Stock = components["schemas"]["StockItemOut"];
type Suggestion = components["schemas"]["ReorderSuggestionOut"];

export default function StockPage() {
  const lk = useInventoryLookups();
  const key = (s: Stock) => `${s.product_id}-${s.location_id}`;
  const base: Column<Stock>[] = [
    {
      key: "product",
      header: "Product",
      cell: (s) => <TextLink href={`/admin/stock/${s.product_id}`}>{lk.productName(s.product_id)}</TextLink>,
    },
    { key: "location", header: "Location", cell: (s) => lk.locationName(s.location_id), hideOnMobile: true },
    {
      key: "qty",
      header: "On hand",
      className: "tabular-nums",
      cell: (s) => (
        <span className={isLow(s) ? "font-semibold text-drs-maroon" : ""}>
          {formatQty(s.qty_on_hand)}{" "}
          <span className="text-xs text-drs-ink/70">{lk.productUom(s.product_id)}</span>
        </span>
      ),
    },
    {
      key: "rp",
      header: "Reorder at",
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (s) => (s.reorder_point > 0 ? formatQty(s.reorder_point) : "—"),
    },
    {
      key: "flag",
      header: "Status",
      cell: (s) => (isLow(s) ? <Badge tone="maroon">Low</Badge> : <Badge tone="green">OK</Badge>),
    },
  ];
  const suggestions: Column<Suggestion>[] = [
    {
      key: "product",
      header: "Product",
      cell: (s) => <TextLink href={`/admin/stock/${s.product_id}`}>{lk.productName(s.product_id)}</TextLink>,
    },
    { key: "location", header: "Location", cell: (s) => lk.locationName(s.location_id), hideOnMobile: true },
    { key: "qty", header: "On hand", className: "tabular-nums", cell: (s) => formatQty(s.qty_on_hand) },
    {
      key: "rp",
      header: "Reorder at",
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (s) => formatQty(s.reorder_point),
    },
    {
      key: "suggest",
      header: "Suggested order",
      className: "tabular-nums font-semibold text-drs-green",
      cell: (s) => formatQty(s.suggested_qty),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock"
        description="On-hand quantity by product and location, low-stock alerts and reorder suggestions."
        actions={<StockActions productOptions={lk.productOptions} locationOptions={lk.locationOptions} />}
      />
      <Tabs
        tabs={[
          {
            id: "all",
            label: "All stock",
            content: (
              <ResourceList<Stock>
                embedded
                resource="stock"
                title="Stock levels"
                columns={base}
                rowKey={key}
                filters={[
                  { field: "product_id", label: "Product", type: "select", options: lk.productOptions },
                  { field: "location_id", label: "Location", type: "select", options: lk.locationOptions },
                ]}
                empty="No stock recorded yet."
              />
            ),
          },
          {
            id: "low",
            label: "Low stock",
            content: (
              <ResourceList<Stock>
                embedded
                resource="stock-low"
                title="Low stock"
                columns={base}
                rowKey={key}
                empty="Nothing below its reorder point."
              />
            ),
          },
          {
            id: "reorder",
            label: "Reorder suggestions",
            content: (
              <ResourceList<Suggestion>
                embedded
                resource="reorder-suggestions"
                title="Reorder suggestions"
                columns={suggestions}
                rowKey={(s) => `${s.product_id}-${s.location_id}`}
                empty="No reorders needed."
              />
            ),
          },
        ]}
      />
    </>
  );
}
