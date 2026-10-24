"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { StatusBadge } from "@/components/ui/badge";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { OPTIONS } from "@/modules/options";

type Sub = components["schemas"]["SubscriberOut"];

const columns: Column<Sub>[] = [
  { key: "email", header: "Email", cell: (s) => <span className="font-medium break-all">{s.email}</span> },
  { key: "name", header: "Name", hideOnMobile: true, cell: (s) => s.name ?? "—" },
  { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
];

export default function NewsletterPage() {
  return (
    <ResourceList<Sub>
      resource="newsletter"
      title="Newsletter"
      description="Subscribers (double opt-in: only confirmed addresses are “subscribed”)."
      columns={columns}
      filters={[{ field: "status", label: "Status", type: "select", options: OPTIONS.newsletterStatus }]}
      empty="No subscribers yet."
    />
  );
}
