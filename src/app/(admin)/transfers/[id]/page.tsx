"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ItemsTable } from "@/components/inventory/items-table";
import { ActionDialog } from "@/components/resource/action-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { BackLink, TextLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatQty } from "@/lib/format";
import { inventoryActions } from "@/modules/inventory/actions";
import { useInventoryLookups } from "@/modules/inventory/lookups";

type Transfer = components["schemas"]["TransferOut"];
type Item = components["schemas"]["TransferItemOut"];
const REFRESH = ["transfers", "stock", "batches"];

export default function TransferShowPage() {
  const { id } = useParams<{ id: string }>();
  const lk = useInventoryLookups();
  const { result: t, query } = useOne<Transfer>({ resource: "transfers", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !t) return <Card>{query.error?.message ?? "Transfer not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/transfers">Transfers</BackLink>}
        title={t.transfer_no}
        actions={
          <>
            {t.status === "draft" && (
              <ActionDialog
                label="Dispatch"
                variant="primary"
                description={`Stock leaves ${lk.locationName(t.from_location_id)} now (FEFO) and is in transit.`}
                onConfirm={() => inventoryActions.dispatchTransfer(t.id)}
                success="Transfer dispatched"
                invalidate={REFRESH}
              />
            )}
            {t.status === "in_transit" && (
              <ActionDialog
                label="Receive"
                variant="primary"
                description={`Stock arrives at ${lk.locationName(t.to_location_id)}.`}
                onConfirm={() => inventoryActions.receiveTransfer(t.id)}
                success="Transfer received"
                invalidate={REFRESH}
              />
            )}
            {t.status === "draft" && (
              <ActionDialog
                label="Cancel transfer"
                variant="ghost"
                triggerClassName="text-drs-maroon hover:bg-drs-maroon/10"
                confirmVariant="danger"
                description="Only draft transfers can be cancelled; once dispatched, goods must be received."
                onConfirm={() => inventoryActions.cancelTransfer(t.id)}
                success="Transfer cancelled"
                invalidate={REFRESH}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Status", value: <StatusBadge status={t.status} /> },
            { label: "From", value: lk.locationName(t.from_location_id) },
            { label: "To", value: lk.locationName(t.to_location_id) },
            { label: "Note", value: t.note ?? "—" },
          ]}
        />
      </Card>
      <ItemsTable<Item>
        caption="Items"
        rows={t.items}
        columns={[
          {
            key: "product",
            header: "Product",
            cell: (i) => <TextLink href={`/stock/${i.product_id}`}>{lk.productName(i.product_id)}</TextLink>,
          },
          {
            key: "qty",
            header: "Quantity",
            className: "tabular-nums",
            cell: (i) => `${formatQty(i.qty)} ${lk.productUom(i.product_id)}`,
          },
        ]}
      />
    </>
  );
}
