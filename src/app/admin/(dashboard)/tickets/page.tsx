"use client";

import { ResourceList } from "@/components/resource/resource-list";
import { PriorityBadge } from "@/components/customers/badges";
import { StatusBadge } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { humanize } from "@/lib/format";
import { OPTIONS } from "@/modules/options";

type Ticket = components["schemas"]["TicketOut"];

const columns: Column<Ticket>[] = [
  {
    key: "subject",
    header: "Ticket",
    cell: (t) => (
      <TextLink href={`/admin/tickets/${t.id}`} sub={`${t.ticket_no} · ${t.messages.length} message(s)`}>
        {t.subject}
      </TextLink>
    ),
  },
  { key: "cat", header: "Category", hideOnMobile: true, cell: (t) => humanize(t.category) },
  {
    key: "prio",
    header: "Priority",
    hideOnMobile: true,
    cell: (t) => <PriorityBadge priority={t.priority} />,
  },
  { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
];

export default function TicketsPage() {
  return (
    <ResourceList<Ticket>
      resource="tickets"
      title="Support tickets"
      description="Customer issues about orders, deliveries, payments and products."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.ticketStatus },
        { field: "category", label: "Category", type: "select", options: OPTIONS.ticketCategory },
      ]}
      initialFilters={[{ field: "status", operator: "eq", value: "open" }]}
      empty="No tickets match."
    />
  );
}
