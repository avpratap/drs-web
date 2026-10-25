"use client";

import { useList, useNotification } from "@refinedev/core";
import { ResourceList } from "@/components/resource/resource-list";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextLink } from "@/components/ui/links";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";
import { useApiAction } from "@/lib/use-api-action";
import { useAccountOptions } from "@/modules/engagement/use-account-options";
import { insightsActions } from "@/modules/insights/handlers";
import { OPTIONS } from "@/modules/options";

type Score = components["schemas"]["ChurnScoreOut"] & { id: number };

const RISK_TONE: Record<string, Tone> = { high: "maroon", medium: "gold", low: "green" };

/** Count of accounts at one risk level (from the list's X-Total-Count). */
function useRiskCount(risk: string) {
  const { result, query } = useList({
    resource: "churn",
    pagination: { pageSize: 1 },
    filters: [{ field: "risk", operator: "eq", value: risk }],
  });
  return query.isLoading ? "—" : (result.total ?? 0).toLocaleString("en-IN");
}

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.round(Math.min(Math.max(score, 0), 1) * 100);
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-drs-ink/10">
        <span className="block h-full rounded-full bg-drs-green" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">{pct}%</span>
    </span>
  );
}

function RunScoring() {
  const { run, pending } = useApiAction();
  const { open } = useNotification();
  return (
    <ConfirmDialog
      trigger={<Button variant="primary">Re-score accounts</Button>}
      title="Re-score churn risk now?"
      description="Recomputes every account's churn score from its recent ordering. It also runs nightly."
      confirmLabel="Run scoring"
      pending={pending}
      onConfirm={async () => {
        const r = await run(() => insightsActions.runChurnScoring(), { invalidate: ["churn"] });
        if (r)
          open?.({
            type: "success",
            message: `Scored ${r.scored} accounts`,
            description: `${r.high} high · ${r.medium} medium · ${r.low} low risk`,
          });
      }}
    />
  );
}

export default function ChurnPage() {
  const accounts = useAccountOptions();
  const high = useRiskCount("high");
  const medium = useRiskCount("medium");
  const low = useRiskCount("low");
  const columns: Column<Score>[] = [
    {
      key: "account",
      header: "Account",
      cell: (c) => (
        <TextLink href={`/admin/accounts/${c.account_id}`}>{accounts.name(c.account_id)}</TextLink>
      ),
    },
    { key: "score", header: "Churn score", cell: (c) => <ScoreMeter score={c.score} /> },
    {
      key: "risk",
      header: "Risk",
      cell: (c) => (
        <Badge tone={RISK_TONE[c.risk] ?? "neutral"}>{c.risk[0]?.toUpperCase() + c.risk.slice(1)}</Badge>
      ),
    },
  ];
  return (
    <ResourceList<Score>
      resource="churn"
      title="Churn risk"
      description="Model-scored likelihood that an account stops ordering, highest risk first. Reach out to high-risk accounts before they lapse."
      columns={columns}
      filters={[{ field: "risk", label: "Risk", type: "select", options: OPTIONS.churnRisk }]}
      actions={<RunScoring />}
      empty="No scores yet. Run scoring to compute them."
    >
      <section aria-label="Accounts by risk" className="mb-6">
        <StatGrid>
          <StatCard label="High risk" value={high} tone="alert" />
          <StatCard label="Medium risk" value={medium} />
          <StatCard label="Low risk" value={low} />
        </StatGrid>
      </section>
    </ResourceList>
  );
}
