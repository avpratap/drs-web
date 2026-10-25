"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { ButtonLink } from "@/components/ui/button";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Suggestion = components["schemas"]["ReorderSuggestionOut"];

function Cover({ s }: { s: Suggestion }) {
  // How much of the reorder point is still on hand.
  const pct = s.reorder_point > 0 ? Math.min(100, Math.round((s.qty_on_hand / s.reorder_point) * 100)) : 0;
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-drs-ink/10">
        <span className="block h-full rounded-full bg-drs-maroon" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-drs-ink/70 tabular-nums">{pct}% of reorder point</span>
    </span>
  );
}

export default function ReorderSuggestionsPage() {
  const lk = useInventoryLookups();
  const columns: Column<Suggestion>[] = [
    {
      key: "product",
      header: "Product",
      cell: (s) => (
        <TextLink href={`/admin/stock/${s.product_id}`} sub={lk.locationName(s.location_id)}>
          {lk.productName(s.product_id)}
        </TextLink>
      ),
    },
    {
      key: "onhand",
      header: "On hand",
      className: "tabular-nums",
      cell: (s) => `${formatQty(s.qty_on_hand)} ${lk.productUom(s.product_id)}`,
    },
    {
      key: "rp",
      header: "Reorder point",
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (s) => formatQty(s.reorder_point),
    },
    { key: "cover", header: "Cover", hideOnMobile: true, cell: (s) => <Cover s={s} /> },
    {
      key: "suggest",
      header: "Suggested order",
      className: "tabular-nums",
      cell: (s) => <span className="font-semibold text-drs-green">{formatQty(s.suggested_qty)}</span>,
    },
  ];
  return (
    <ResourceList<Suggestion>
      resource="reorder-suggestions"
      title="Reorder suggestions"
      description="Stock below its reorder point, with the quantity to order to get back to a healthy level."
      columns={columns}
      rowKey={(s) => `${s.product_id}-${s.location_id}`}
      actions={<ButtonLink href="/admin/purchase-orders/create">New purchase order</ButtonLink>}
      empty="Nothing to reorder: every product is above its reorder point."
    />
  );
}
