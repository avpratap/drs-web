"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/ui/disclosure";
import { JsonView } from "@/components/ui/json-view";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDateTime, humanize } from "@/lib/format";

type Entry = components["schemas"]["AuditLogOut"];

const columns: Column<Entry>[] = [
  {
    key: "when",
    header: "When",
    cell: (e) => <span className="whitespace-nowrap">{formatDateTime(e.created_at)}</span>,
  },
  { key: "who", header: "Admin", cell: (e) => `User #${e.admin_user_id}` },
  { key: "action", header: "Action", cell: (e) => <Badge>{e.action}</Badge> },
  {
    key: "resource",
    header: "Resource",
    hideOnMobile: true,
    cell: (e) =>
      e.resource_type ? `${humanize(e.resource_type)}${e.resource_id ? ` #${e.resource_id}` : ""}` : "—",
  },
  {
    key: "ip",
    header: "IP",
    hideOnMobile: true,
    cell: (e) => <span className="font-mono text-xs">{e.ip ?? "—"}</span>,
  },
  {
    key: "detail",
    header: "Detail",
    cell: (e) =>
      e.detail ? (
        <Disclosure
          summary={
            <>
              View<span className="sr-only"> detail of entry {e.id}</span>
            </>
          }
        >
          <div className="mt-2 w-[min(32rem,70vw)]">
            <JsonView value={e.detail} label={`Detail of audit entry ${e.id}`} />
          </div>
        </Disclosure>
      ) : (
        "—"
      ),
  },
];

export default function AuditLogPage() {
  return (
    <ResourceList<Entry>
      resource="audit-log"
      title="Audit log"
      description="Every admin write, who made it and from where. Read-only."
      columns={columns}
      filters={[
        {
          field: "action",
          label: "Action",
          type: "search",
          placeholder: "Exact action, e.g. POST /api/v1/admin/coupons",
        },
        { field: "admin_user_id", label: "Admin user #", type: "number" },
      ]}
      pageSize={50}
      empty="No audit entries match."
    />
  );
}
