"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ItemsTable } from "@/components/inventory/items-table";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Bom = components["schemas"]["BomOut"];
type Comp = components["schemas"]["BomComponentOut"];

export default function BomShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: b, query } = useOne<Bom>({ resource: "boms", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !b) return <Card>{query.error?.message ?? "BOM not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/boms">Bills of materials</BackLink>}
        title={b.name}
        actions={<ButtonLink href={`/production-orders/create?bom_id=${b.id}`}>Plan production</ButtonLink>}
      />
      <Card>
        <DescriptionList
          items={[
            {
              label: "Makes",
              value: <TextLink href={`/stock/${b.product_id}`}>{lk.productName(b.product_id)}</TextLink>,
            },
            { label: "Output per batch", value: `${formatQty(b.output_qty)} ${lk.productUom(b.product_id)}` },
            { label: "Status", value: <StatusBadge status={b.status} /> },
          ]}
        />
      </Card>
      <ItemsTable<Comp>
        caption="Components"
        rows={b.components}
        columns={[
          {
            key: "c",
            header: "Component",
            cell: (c) => (
              <TextLink href={`/stock/${c.component_product_id}`}>
                {lk.productName(c.component_product_id)}
              </TextLink>
            ),
          },
          {
            key: "q",
            header: "Quantity",
            className: "tabular-nums",
            cell: (c) => `${formatQty(c.qty)} ${lk.productUom(c.component_product_id)}`,
          },
        ]}
      />
    </>
  );
}
