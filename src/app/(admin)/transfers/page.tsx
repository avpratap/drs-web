"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { useInventoryLookups } from "@/modules/inventory/lookups";
import { OPTIONS } from "@/modules/options";

type Transfer = components["schemas"]["TransferOut"];

export default function TransfersPage() {
  const lk = useInventoryLookups();
  const columns: Column<Transfer>[] = [
    {
      key: "no",
      header: "Transfer",
      cell: (t) => (
        <TextLink href={`/transfers/${t.id}`} sub={`${t.items.length} line(s)`}>
          {t.transfer_no}
        </TextLink>
      ),
    },
    { key: "from", header: "From", cell: (t) => lk.locationName(t.from_location_id) },
    { key: "to", header: "To", cell: (t) => lk.locationName(t.to_location_id) },
    { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
  ];
  return (
    <ResourceList<Transfer>
      resource="transfers"
      title="Transfers"
      description="Stock moving between locations: draft → dispatched (in transit) → received."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.transferStatus }]}
      createHref="/transfers/create"
      createLabel="New transfer"
      empty="No transfers."
    />
  );
}
