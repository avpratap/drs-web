"use client";

import { useOne } from "@refinedev/core";
import { ActionDialog } from "@/components/resource/action-dialog";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { todayIST } from "@/lib/forms";
import { operationsActions } from "@/modules/operations/handlers";
import { OPTIONS } from "@/modules/options";

type Run = components["schemas"]["CutoffRunOut"];
type Status = components["schemas"]["CutoffStatusOut"] & { id: string };

function tomorrowIST(): string {
  const [y, m, d] = todayIST().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

const columns: Column<Run>[] = [
  {
    key: "date",
    header: "Delivery date",
    cell: (r) => <span className="font-medium">{formatDate(r.for_delivery_date)}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} />,
  },
  { key: "orders", header: "Orders", className: "tabular-nums", cell: (r) => r.orders_generated },
  { key: "started", header: "Started", hideOnMobile: true, cell: (r) => formatDateTime(r.started_at) },
  {
    key: "took",
    header: "Took",
    hideOnMobile: true,
    className: "tabular-nums",
    cell: (r) => (r.duration_seconds == null ? "Running…" : `${r.duration_seconds.toFixed(1)} s`),
  },
];

export default function CutoffPage() {
  const { result: s, query } = useOne<Status>({ resource: "cutoff-status", id: "status" });
  const tomorrow = s?.tomorrow_run;
  return (
    <>
      <PageHeader
        title="Cutoff runs"
        description="Each night at the cutoff hour, active subscriptions become the next day's delivery orders and are frozen."
        actions={
          <ActionDialog
            label="Run cutoff now"
            variant="primary"
            title="Run the cutoff"
            description="Re-running for a date rebuilds its unfrozen orders. Today or past dates need “force” — they can change orders already out for delivery."
            defaultValues={{ date: tomorrowIST(), force: false }}
            fields={[
              { name: "date", label: "Delivery date", type: "date", required: true },
              { name: "force", label: "Force (today or a past date)", type: "checkbox" },
            ]}
            onConfirm={(v) => operationsActions.runCutoff(v.date as string, !!v.force)}
            success="Cutoff run finished"
            invalidate={["cutoff-runs", "cutoff-status", "delivery-orders", "delivery-summary"]}
          />
        }
      />
      <section aria-label="Cutoff status" aria-busy={query.isLoading || undefined} className="mb-8">
        <StatGrid>
          <StatCard
            label="Next cutoff"
            value={s ? formatDateTime(s.next_cutoff_at) : "—"}
            sub={s ? `Builds deliveries for ${formatDate(s.next_delivery_date)}` : undefined}
            accent
          />
          <StatCard
            label="Tomorrow"
            value={
              !s ? "—" : tomorrow ? <StatusBadge status={tomorrow.status} /> : <Badge>Not run yet</Badge>
            }
            sub={tomorrow ? `${tomorrow.orders_generated} orders` : undefined}
          />
          <StatCard
            label="Last run"
            value={s?.last_run ? formatDate(s.last_run.for_delivery_date) : "—"}
            sub={s?.last_run ? `${s.last_run.orders_generated} orders · ${s.last_run.status}` : undefined}
            tone={s?.last_run?.status === "failed" ? "alert" : "default"}
          />
          <StatCard
            label="Customer edits"
            value={s ? (s.standing_changes_frozen ? "Frozen" : "Open") : "—"}
            sub={s ? `Cutoff ${String(s.cutoff_hour).padStart(2, "0")}:00 ${s.timezone}` : undefined}
          />
        </StatGrid>
      </section>
      <ResourceList<Run>
        embedded
        resource="cutoff-runs"
        title="Run history"
        caption="Cutoff run history"
        columns={columns}
        filters={[
          { field: "status", label: "Status", type: "select", options: OPTIONS.cutoffStatus },
          { field: "date_from", label: "From", type: "date" },
          { field: "date_to", label: "To", type: "date" },
        ]}
        empty="No cutoff runs yet."
      />
    </>
  );
}
