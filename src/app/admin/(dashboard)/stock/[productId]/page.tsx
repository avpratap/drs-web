"use client";

import { useParams } from "next/navigation";
import { StockActions } from "@/components/inventory/stock-actions";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { formatQty, humanize } from "@/lib/format";
import { listHref } from "@/lib/list-href";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Movement = components["schemas"]["StockMovementOut"];

export default function StockMovementsPage() {
  const { productId } = useParams<{ productId: string }>();
  const pid = Number(productId);
  const lk = useInventoryLookups();
  const columns: Column<Movement>[] = [
    { key: "id", header: "#", cell: (m) => m.id },
    { key: "reason", header: "Reason", cell: (m) => <Badge>{humanize(m.reason)}</Badge> },
    {
      key: "change",
      header: "Change",
      className: "tabular-nums",
      cell: (m) => (
        <span className={cn("font-medium", m.change < 0 ? "text-drs-maroon" : "text-drs-green")}>
          {m.change > 0 ? "+" : ""}
          {formatQty(m.change)}
        </span>
      ),
    },
    { key: "location", header: "Location", hideOnMobile: true, cell: (m) => lk.locationName(m.location_id) },
    { key: "note", header: "Note", hideOnMobile: true, cell: (m) => m.note ?? "—" },
  ];
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/stock">Stock</BackLink>}
        title={lk.productName(pid)}
        description="Every stock movement for this product, newest first."
        actions={
          <StockActions
            productOptions={lk.productOptions}
            locationOptions={lk.locationOptions}
            productId={pid}
          />
        }
      />
      <p className="mb-4 text-sm">
        <TextLink href={listHref("/admin/batches", { product_id: pid })}>View batches</TextLink>
      </p>
      <ResourceList<Movement>
        embedded
        resource="stock-movements"
        title="Stock movements"
        meta={{ productId: pid }}
        columns={columns}
        empty="No movements yet."
      />
    </>
  );
}
