"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatQty, humanize } from "@/lib/format";

type Pack = components["schemas"]["UnpricedPackOut"] & { id: string };

const columns: Column<Pack>[] = [
  {
    key: "product",
    header: "Product",
    cell: (p) => (
      <TextLink href={`/admin/products/${p.product_id}`} sub={p.product_sku}>
        {p.label || p.variant_sku || p.product_sku}
      </TextLink>
    ),
  },
  {
    key: "variant",
    header: "Pack",
    hideOnMobile: true,
    cell: (p) => (p.variant_sku ? p.variant_sku : <Badge>Base product</Badge>),
  },
  { key: "size", header: "Pack size", className: "tabular-nums", cell: (p) => formatQty(p.pack_size, 3) },
  { key: "reason", header: "Why", cell: (p) => humanize(p.reason) },
];

/** Catalogue health: packs customers see as "price unavailable". */
export default function UnpricedPacksPage() {
  return (
    <ResourceList<Pack>
      resource="unpriced-packs"
      title="Unpriced packs"
      description="Active packs the storefront shows as “price unavailable”: no retail price applies at this pack size today. Add or fix a retail row under Product prices."
      columns={columns}
      paginate={false}
      empty="Every active pack has a retail price today."
    />
  );
}
