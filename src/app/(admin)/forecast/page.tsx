"use client";

import { useOne } from "@refinedev/core";
import { useState } from "react";
import { BarList } from "@/components/charts/bar-list";
import { ChartFrame } from "@/components/charts/chart-frame";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { StatCard, StatGrid } from "@/components/ui/stat";
import { DataTable, type Column } from "@/components/ui/table";
import { formatQty, humanize } from "@/lib/format";
import { formatDate, todayIST } from "@/lib/forms";
import type { ForecastLine } from "@/modules/insights/handlers";

type Plan = { id: string; for_date: string; history_days: number; plan: ForecastLine[] };

const HISTORY = [7, 14, 28, 56, 90].map((d) => ({ value: d, label: `${d} days` }));

function tomorrow(): string {
  const [y, m, d] = todayIST().split("-").map(Number);
  const t = new Date(y, m - 1, d + 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

const sum = (rows: ForecastLine[], k: keyof ForecastLine) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
const name = (r: ForecastLine) => r.product_name ?? `Product #${r.product_id}`;

const columns: Column<ForecastLine>[] = [
  { key: "p", header: "Product", cell: (r) => <span className="font-medium">{name(r)}</span> },
  { key: "c", header: "Committed", className: "tabular-nums", cell: (r) => formatQty(r.committed_qty, 2) },
  {
    key: "f",
    header: "Forecast (one-off)",
    className: "tabular-nums",
    hideOnMobile: true,
    cell: (r) => formatQty(r.forecast_variable_qty, 2),
  },
  {
    key: "s",
    header: "Safety",
    className: "tabular-nums",
    hideOnMobile: true,
    cell: (r) => formatQty(r.safety_qty, 2),
  },
  {
    key: "r",
    header: "Produce",
    className: "tabular-nums",
    cell: (r) => (
      <span className="font-semibold text-drs-green">{formatQty(r.recommended_production, 2)}</span>
    ),
  },
  { key: "m", header: "Method", hideOnMobile: true, cell: (r) => <Badge>{humanize(r.method)}</Badge> },
];

export default function ForecastPage() {
  const [date, setDate] = useState(tomorrow);
  const [history, setHistory] = useState(28);
  const { result, query } = useOne<Plan>({
    resource: "forecast",
    id: "plan",
    meta: { date, historyDays: history },
  });
  const rows = result?.plan ?? [];
  const sorted = [...rows].sort((a, b) => b.recommended_production - a.recommended_production);

  return (
    <>
      <PageHeader
        title="Demand forecast"
        description="Production plan per product: committed standing orders + forecast one-off demand + a safety buffer."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:flex md:items-end">
        <div className="flex flex-col gap-1.5 md:w-48">
          <label htmlFor="fc-date" className="text-xs font-medium text-drs-ink/75">
            Plan for
          </label>
          <DatePicker id="fc-date" value={date} onChange={(v) => setDate(v || tomorrow())} />
        </div>
        <div className="flex flex-col gap-1.5 md:w-40">
          <label htmlFor="fc-history" className="text-xs font-medium text-drs-ink/75">
            History
          </label>
          <Select id="fc-history" value={history} options={HISTORY} onChange={(v) => setHistory(Number(v))} />
        </div>
      </div>

      <section aria-label="Plan summary" aria-busy={query.isLoading || undefined} className="mb-6">
        <StatGrid>
          <StatCard label="Plan date" value={result ? formatDate(result.for_date) : "—"} accent />
          <StatCard label="Products" value={query.isLoading ? "—" : rows.length} />
          <StatCard
            label="Committed"
            value={query.isLoading ? "—" : formatQty(sum(rows, "committed_qty"), 2)}
          />
          <StatCard
            label="To produce"
            value={query.isLoading ? "—" : formatQty(sum(rows, "recommended_production"), 2)}
          />
        </StatGrid>
      </section>

      {query.error ? (
        <p role="alert" className="rounded-lg bg-drs-maroon/10 p-4 text-sm text-drs-maroon">
          {query.error.message}
        </p>
      ) : (
        <>
          <ChartFrame
            title="Recommended production"
            subtitle={`Based on the last ${history} days`}
            loading={query.isLoading}
            table={{
              headers: ["Product", "Produce"],
              rows: sorted.map((r) => [name(r), formatQty(r.recommended_production, 2)]),
            }}
          >
            <BarList
              label="Recommended production by product"
              data={sorted.slice(0, 10).map((r) => ({
                label: name(r),
                value: r.recommended_production,
                detail: `${formatQty(r.committed_qty, 2)} committed + ${formatQty(r.forecast_variable_qty, 2)} forecast + ${formatQty(r.safety_qty, 2)} safety`,
              }))}
              format={(n) => formatQty(n, 2)}
            />
          </ChartFrame>
          <div className="mt-6">
            <DataTable
              caption="Production plan"
              columns={columns}
              rows={sorted}
              rowKey={(r) => r.product_id}
              loading={query.isLoading}
              empty="No demand expected for this date."
            />
          </div>
        </>
      )}
    </>
  );
}
