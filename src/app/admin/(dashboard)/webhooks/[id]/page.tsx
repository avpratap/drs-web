"use client";

import { useNotification, useOne } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import { ActiveToggle } from "@/components/engagement/webhook-toggle";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BackLink } from "@/components/ui/links";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { useApiAction } from "@/lib/use-api-action";
import { engagementActions } from "@/modules/engagement/handlers";
import { webhookFields } from "@/modules/engagement/fields";

type Hook = components["schemas"]["WebhookOut"];
type Delivery = components["schemas"]["WebhookDeliveryOut"];

const deliveryColumns: Column<Delivery>[] = [
  { key: "id", header: "Delivery", cell: (d) => `#${d.id}` },
  { key: "event", header: "Event", cell: (d) => <span className="font-mono text-sm">{d.event_type}</span> },
  { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
  {
    key: "code",
    header: "HTTP",
    className: "tabular-nums",
    cell: (d) =>
      d.response_code == null ? (
        "—"
      ) : (
        <Badge tone={d.response_code < 300 ? "green" : "maroon"}>{d.response_code}</Badge>
      ),
  },
  { key: "attempts", header: "Attempts", className: "tabular-nums", cell: (d) => d.attempts },
];

export default function WebhookShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { open } = useNotification();
  const { run, pending } = useApiAction();
  const { result: h, query } = useOne<Hook>({ resource: "webhooks", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !h) return <Card>{query.error?.message ?? "Webhook not found."}</Card>;

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/webhooks">Webhooks</BackLink>}
        title={h.event_type}
        description={h.url}
        actions={
          <>
            <Button
              variant="primary"
              loading={pending}
              onClick={async () => {
                const d = await run(() => engagementActions.testWebhook(h.id), {
                  invalidate: ["webhook-deliveries"],
                }).catch(() => undefined);
                if (d)
                  open?.({
                    type: d.status === "failed" ? "error" : "success",
                    message: `Test delivery ${d.status}`,
                    description: d.response_code ? `Endpoint answered HTTP ${d.response_code}` : undefined,
                  });
              }}
            >
              Send test event
            </Button>
            <ActionDialog
              label="Edit"
              title="Edit webhook"
              defaultValues={{ event_type: h.event_type, url: h.url, active: h.active, secret: "" }}
              fields={webhookFields(true)}
              onConfirm={(v) => engagementActions.updateWebhook(h.id, v)}
              success="Webhook updated"
              invalidate={["webhooks"]}
            />
            <ActiveToggle hook={h} />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" className="text-drs-maroon hover:bg-drs-maroon/10">
                  Delete
                </Button>
              }
              title="Delete this webhook?"
              description="Events stop being sent to this endpoint. The delivery log is removed too."
              confirmLabel="Delete webhook"
              danger
              onConfirm={async () => {
                await run(() => engagementActions.deleteWebhook(h.id), {
                  success: "Webhook deleted",
                  invalidate: ["webhooks"],
                });
                router.push("/admin/webhooks");
              }}
            />
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "Event", value: <span className="font-mono">{h.event_type}</span> },
            { label: "Endpoint", value: <span className="break-all">{h.url}</span> },
            {
              label: "Status",
              value: h.active ? <Badge tone="green">Active</Badge> : <Badge>Disabled</Badge>,
            },
          ]}
        />
      </Card>
      <section className="mt-8" aria-labelledby="deliveries-heading">
        <h2 id="deliveries-heading" className="mb-3 text-lg font-semibold text-drs-green">
          Recent deliveries
        </h2>
        <ResourceList<Delivery>
          resource="webhook-deliveries"
          title="Recent deliveries"
          caption="Recent deliveries"
          embedded
          meta={{ hookId: h.id }}
          columns={deliveryColumns}
          empty="No deliveries yet. Send a test event to check the endpoint."
        />
      </section>
    </>
  );
}
