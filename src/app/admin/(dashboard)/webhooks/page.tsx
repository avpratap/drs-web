"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge } from "@/components/ui/badge";
import { RowLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { ActiveToggle } from "@/components/engagement/webhook-toggle";
import { engagementActions } from "@/modules/engagement/handlers";
import { webhookFields } from "@/modules/engagement/fields";

type Hook = components["schemas"]["WebhookOut"];

const columns: Column<Hook>[] = [
  {
    key: "event",
    header: "Event",
    cell: (h) => <span className="font-mono text-sm text-drs-green">{h.event_type}</span>,
  },
  { key: "url", header: "Endpoint", cell: (h) => <span className="text-sm break-all">{h.url}</span> },
  {
    key: "active",
    header: "Status",
    cell: (h) => (h.active ? <Badge tone="green">Active</Badge> : <Badge>Disabled</Badge>),
  },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (h) => (
      <span className="inline-flex flex-wrap items-center justify-end gap-1">
        <ActiveToggle hook={h} />
        <RowLink href={`/admin/webhooks/${h.id}`} srLabel={`${h.event_type} → ${h.url}`}>
          Manage
        </RowLink>
      </span>
    ),
  },
];

export default function WebhooksPage() {
  return (
    <ResourceList<Hook>
      resource="webhooks"
      title="Webhooks"
      description="Send DRS events (orders, payments, refunds…) to other systems as signed HTTP POSTs."
      columns={columns}
      actions={
        <ActionDialog
          label="New webhook"
          variant="primary"
          defaultValues={{ active: true }}
          fields={webhookFields()}
          onConfirm={(v) => engagementActions.createWebhook(v)}
          success="Webhook created"
          invalidate={["webhooks"]}
        />
      }
      empty="No webhooks yet. Add one to start sending events."
    />
  );
}
