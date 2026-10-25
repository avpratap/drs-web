"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { RowLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { humanize } from "@/lib/format";

type Location = components["schemas"]["LocationOut"];

const columns: Column<Location>[] = [
  {
    key: "name",
    header: "Location",
    cell: (l) => (
      <span className="font-medium">
        {l.name}{" "}
        {l.is_default && (
          <Badge tone="green" className="ml-1">
            Default
          </Badge>
        )}
      </span>
    ),
  },
  { key: "kind", header: "Kind", cell: (l) => humanize(l.kind) },
  { key: "state", header: "State", hideOnMobile: true, cell: (l) => l.state ?? "—" },
  {
    key: "driver",
    header: "Driver",
    hideOnMobile: true,
    cell: (l) => (l.driver_user_id ? `User #${l.driver_user_id}` : "—"),
  },
  { key: "status", header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (l) => (
      <RowLink href={`/admin/locations/${l.id}/edit`} srLabel={l.name}>
        Edit
      </RowLink>
    ),
  },
];

export default function LocationsPage() {
  return (
    <ResourceList<Location>
      resource="locations"
      title="Locations"
      description="Plants, hubs, cold storage and vehicles that hold stock."
      columns={columns}
      createHref="/admin/locations/create"
      createLabel="New location"
      empty="No locations yet."
    />
  );
}
