"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, money } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { OPTIONS } from "@/modules/options";

type PO = components["schemas"]["POOut"];

export default function PurchaseOrdersPage() {
  const lk = useInventoryLookups({ suppliers: true });
  const columns: Column<PO>[] = [
    {
      key: "no",
      header: "PO",
      cell: (p) => (
        <TextLink href={`/admin/purchase-orders/${p.id}`} sub={`${p.items.length} line(s)`}>
          {p.po_no}
        </TextLink>
      ),
    },
    { key: "supplier", header: "Supplier", cell: (p) => lk.supplierName(p.supplier_id) },
    {
      key: "location",
      header: "Deliver to",
      hideOnMobile: true,
      cell: (p) => lk.locationName(p.location_id),
    },
    { key: "expected", header: "Expected", hideOnMobile: true, cell: (p) => formatDate(p.expected_date) },
    { key: "total", header: "Total", className: "tabular-nums", cell: (p) => money(p.total) },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  ];
  return (
    <ResourceList<PO>
      resource="purchase-orders"
      title="Purchase orders"
      description="Draft → placed with the supplier → received into stock as batches (GRN)."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.poStatus }]}
      createHref="/admin/purchase-orders/create"
      createLabel="New purchase order"
      empty="No purchase orders."
    />
  );
}
