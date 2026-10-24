"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Bom = components["schemas"]["BomOut"];

export default function BomsPage() {
  const lk = useInventoryLookups();
  const columns: Column<Bom>[] = [
    {
      key: "name",
      header: "Recipe",
      cell: (b) => (
        <TextLink href={`/boms/${b.id}`} sub={`${b.components.length} component(s)`}>
          {b.name}
        </TextLink>
      ),
    },
    { key: "product", header: "Makes", cell: (b) => lk.productName(b.product_id) },
    {
      key: "out",
      header: "Output",
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (b) => `${formatQty(b.output_qty)} ${lk.productUom(b.product_id)}`,
    },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <ResourceList<Bom>
      resource="boms"
      title="Bills of materials"
      description="Recipes: which components (milk, cultures, packaging) make one output batch."
      columns={columns}
      filters={[{ field: "product_id", label: "Output product", type: "select", options: lk.productOptions }]}
      createHref="/boms/create"
      createLabel="New BOM"
      empty="No bills of materials."
    />
  );
}
