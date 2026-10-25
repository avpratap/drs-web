"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/resource/action-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { todayIST } from "@/lib/forms";
import { inventoryActions } from "@/modules/inventory/actions";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Pro = components["schemas"]["ProductionOut"];
const REFRESH = ["production-orders", "stock", "batches", "stock-low"];

export default function ProductionShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: p, query } = useOne<Pro>({ resource: "production-orders", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !p) return <Card>{query.error?.message ?? "Production order not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/production-orders">Production</BackLink>}
        title={p.pro_no}
        actions={
          <>
            {p.status === "draft" && (
              <ActionDialog
                label="Start"
                variant="primary"
                description="Components are consumed from stock (FEFO) now."
                onConfirm={() => inventoryActions.startProduction(p.id)}
                success="Production started"
                invalidate={REFRESH}
              />
            )}
            {p.status === "in_progress" && (
              <ActionDialog
                label="Complete"
                variant="primary"
                description="Creates the output batch in stock."
                defaultValues={{ mfg_date: todayIST() }}
                fields={[
                  {
                    name: "output_batch_no",
                    label: "Output batch no.",
                    required: true,
                    maxLength: 64,
                    uppercase: true,
                  },
                  { name: "mfg_date", label: "Manufactured", type: "date" },
                  {
                    name: "expiry_date",
                    label: "Expiry",
                    type: "date",
                    validate: (v, all) =>
                      !v ||
                      !all.mfg_date ||
                      (v as string) >= (all.mfg_date as string) ||
                      "Expiry is before manufacture",
                  },
                ]}
                onConfirm={(v) => inventoryActions.completeProduction(p.id, v)}
                success="Production completed"
                invalidate={REFRESH}
              />
            )}
            {p.status === "draft" && (
              <ActionDialog
                label="Cancel"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                title="Cancel production order?"
                description="Only draft orders can be cancelled — once started, components have been issued."
                onConfirm={() => inventoryActions.cancelProduction(p.id)}
                success="Production cancelled"
                invalidate={REFRESH}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={p.status} /> },
            {
              label: "Product",
              value: (
                <TextLink href={`/admin/stock/${p.product_id}`}>{lk.productName(p.product_id)}</TextLink>
              ),
            },
            { label: "Recipe", value: <TextLink href={`/admin/boms/${p.bom_id}`}>BOM #{p.bom_id}</TextLink> },
            { label: "Planned", value: `${formatQty(p.planned_qty)} ${lk.productUom(p.product_id)}` },
            { label: "Location", value: lk.locationName(p.location_id) },
            { label: "Output batch", value: p.output_batch_no ?? "—" },
          ]}
        />
      </Card>
    </>
  );
}
