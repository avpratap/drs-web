"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { OPTIONS } from "@/modules/options";

type Pro = components["schemas"]["ProductionOut"];

export default function ProductionOrdersPage() {
  const lk = useInventoryLookups();
  const columns: Column<Pro>[] = [
    {
      key: "no",
      header: "Order",
      cell: (p) => <TextLink href={`/production-orders/${p.id}`}>{p.pro_no}</TextLink>,
    },
    { key: "product", header: "Product", cell: (p) => lk.productName(p.product_id) },
    {
      key: "qty",
      header: "Planned",
      className: "tabular-nums",
      cell: (p) => `${formatQty(p.planned_qty)} ${lk.productUom(p.product_id)}`,
    },
    { key: "location", header: "At", hideOnMobile: true, cell: (p) => lk.locationName(p.location_id) },
    {
      key: "batch",
      header: "Output batch",
      hideOnMobile: true,
      cell: (p) => (p.output_batch_no ? <span className="font-mono text-xs">{p.output_batch_no}</span> : "—"),
    },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  ];
  return (
    <ResourceList<Pro>
      resource="production-orders"
      title="Production"
      description="Production orders: draft → in progress (components consumed) → completed (output batch created)."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.productionStatus }]}
      createHref="/production-orders/create"
      createLabel="New production order"
      empty="No production orders."
    />
  );
}
