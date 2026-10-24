"use client";

import { useList } from "@refinedev/core";
import { useSearchParams } from "next/navigation";
import { ResourceForm } from "@/components/resource/resource-form";
import { Card, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Bom = components["schemas"]["BomOut"];

export default function ProductionCreatePage() {
  const lk = useInventoryLookups();
  const preset = Number(useSearchParams().get("bom_id")) || undefined;
  const boms = useList<Bom>({ resource: "boms", pagination: { mode: "off" } });
  if (lk.loading || boms.query.isLoading) return <Card>Loading…</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/production-orders">Production</BackLink>}
        title="New production order"
      />
      <ResourceForm
        resource="production-orders"
        cancelHref="/production-orders"
        submitLabel="Create production order"
        successHref={(d) => `/production-orders/${d?.id ?? ""}`}
        defaultValues={preset ? { bom_id: preset } : undefined}
        fields={[
          {
            name: "bom_id",
            label: "Recipe (BOM)",
            type: "select",
            required: true,
            options: boms.result.data
              .filter((b) => b.status === "active")
              .map((b) => ({ value: b.id, label: `${b.name} → ${lk.productName(b.product_id)}` })),
          },
          {
            name: "planned_qty",
            label: "Planned quantity",
            type: "number",
            required: true,
            gt: 0,
            max: 1_000_000,
          },
          {
            name: "location_id",
            label: "Location",
            type: "select",
            options: lk.locationOptions,
            placeholder: "Default location",
          },
        ]}
      />
    </>
  );
}
