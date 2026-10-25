"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";

type Supplier = components["schemas"]["SupplierOut"];

const columns: Column<Supplier>[] = [
  { key: "name", header: "Supplier", cell: (s) => <span className="font-medium">{s.name}</span> },
  { key: "gstin", header: "GSTIN", cell: (s) => <span className="font-mono text-xs">{s.gstin ?? "—"}</span> },
  { key: "state", header: "State", hideOnMobile: true, cell: (s) => s.state ?? "—" },
  { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
];

export default function SuppliersPage() {
  return (
    <ResourceList<Supplier>
      resource="suppliers"
      title="Suppliers"
      description="Milk, packaging and ingredient vendors for purchase orders."
      columns={columns}
      createHref="/admin/suppliers/create"
      createLabel="New supplier"
      empty="No suppliers yet."
    />
  );
}
