"use client";

import { useList, useNotification } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { humanize } from "@/lib/format";
import { useApiAction } from "@/lib/use-api-action";
import { engagementActions } from "@/modules/engagement/handlers";
import { EVENT_TYPES } from "@/modules/engagement/fields";
import { OPTIONS } from "@/modules/options";

type Notif = components["schemas"]["app__api__v1__admin__NotificationOut"];
type User = components["schemas"]["UserAdminOut"];

function Resend({ n }: { n: Notif }) {
  const { run, pending } = useApiAction();
  if (n.status !== "failed" && n.status !== "skipped") return <span className="text-drs-ink/70">—</span>;
  return (
    <Button
      variant="ghost"
      loading={pending}
      aria-label={`Resend notification ${n.id}`}
      onClick={() =>
        run(() => engagementActions.resendNotification(n.id), {
          success: "Notification re-queued",
          invalidate: ["notifications"],
        }).catch(() => undefined)
      }
    >
      Resend
    </Button>
  );
}

function Flush() {
  const { run, pending } = useApiAction();
  const { open } = useNotification();
  return (
    <ConfirmDialog
      trigger={<Button variant="secondary">Flush outbox</Button>}
      title="Send queued notifications now?"
      description="Delivers up to 100 due notifications immediately instead of waiting for the background worker."
      confirmLabel="Flush now"
      pending={pending}
      onConfirm={async () => {
        const r = await run(() => engagementActions.flushNotifications(), { invalidate: ["notifications"] });
        if (r)
          open?.({
            type: r.failed ? "error" : "success",
            message: `Processed ${r.processed}: ${r.sent} sent, ${r.failed} failed`,
          });
      }}
    />
  );
}

export default function NotificationsPage() {
  const users = useList<User>({ resource: "users", pagination: { pageSize: 200 } });
  const userOptions = users.result.data.map((u) => ({
    value: u.id,
    label: [u.full_name || "User", u.phone].join(" · "),
  }));
  const userName = (id: number) => userOptions.find((o) => o.value === id)?.label ?? `User #${id}`;
  const { open } = useNotification();

  const columns: Column<Notif>[] = [
    {
      key: "event",
      header: "Event",
      cell: (n) => (
        <span className="font-medium">
          {n.event_type}
          <span className="block text-xs font-normal text-drs-ink/70">#{n.id}</span>
        </span>
      ),
    },
    { key: "to", header: "Recipient", hideOnMobile: true, cell: (n) => userName(n.user_id) },
    {
      key: "channel",
      header: "Channel",
      cell: (n) => (
        <span className="flex flex-wrap gap-1">
          <Badge>{humanize(n.channel)}</Badge>
          {n.category && <Badge>{humanize(n.category)}</Badge>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (n) => (
        <span>
          <StatusBadge status={n.status} />
          {n.skip_reason && (
            <span className="mt-1 block text-xs text-drs-ink/70">{humanize(n.skip_reason)}</span>
          )}
        </span>
      ),
    },
    {
      key: "body",
      header: "Message",
      hideOnMobile: true,
      cell: (n) => <span className="line-clamp-2 max-w-sm text-sm text-drs-ink/80">{n.body ?? "—"}</span>,
    },
    {
      key: "attempts",
      header: "Tries",
      hideOnMobile: true,
      className: "tabular-nums",
      cell: (n) => n.attempts,
    },
    { key: "actions", header: "Actions", className: "text-right", cell: (n) => <Resend n={n} /> },
  ];

  return (
    <ResourceList<Notif>
      resource="notifications"
      title="Notifications"
      description="The outbound SMS, push and email outbox. Resend failed or skipped messages, send a test, or flush the queue."
      columns={columns}
      filters={[
        { field: "status", label: "Status", type: "select", options: OPTIONS.notificationStatus },
        { field: "user_id", label: "Recipient", type: "select", options: userOptions, allLabel: "Everyone" },
      ]}
      actions={
        <>
          <Flush />
          <ActionDialog
            label="Send test"
            variant="primary"
            description="Emits an event to one user through their enabled channels, respecting their preferences."
            defaultValues={{ event_type: "payment.success" }}
            fields={[
              { name: "user_id", label: "Recipient", type: "select", required: true, options: userOptions },
              {
                name: "event_type",
                label: "Event type",
                type: "select",
                required: true,
                options: EVENT_TYPES,
              },
              {
                name: "data",
                label: "Template data (JSON)",
                type: "json",
                placeholder: '{ "order_no": "ORD-0001" }',
                hint: "Optional values for the message template.",
              },
            ]}
            onConfirm={async (v) => {
              const r = await engagementActions.testNotification(v);
              open?.({
                type: "success",
                message: `Test queued on ${r.created.length} channel${r.created.length === 1 ? "" : "s"}`,
                description:
                  r.created.map((c) => `${humanize(c.channel)}: ${humanize(c.status)}`).join(" · ") ||
                  undefined,
              });
              return r;
            }}
            invalidate={["notifications"]}
          />
        </>
      }
      empty="No notifications match."
    />
  );
}
