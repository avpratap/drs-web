"use client";

import { useList, useOne } from "@refinedev/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarList } from "@/components/charts/bar-list";
import { ChartFrame } from "@/components/charts/chart-frame";
import { TrendChart } from "@/components/charts/trend-chart";
import { PageHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { fillDays } from "@/modules/reports/series";

type S = components["schemas"];
const RANGES = [7, 30, 90] as const;

const compactMoney = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export default function ReportsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const days = RANGES.includes(Number(params.get("days")) as (typeof RANGES)[number])
    ? Number(params.get("days"))
    : 30;

  const summary = useOne<S["ReportsSummaryOut"] & { id: string }>({ resource: "reports", id: "summary" });
  const overview = useOne<S["OverviewOut"] & { id: string }>({ resource: "reports", id: "overview" });
  const revenue = useList<S["RevenuePoint"] & { id?: string }>({
    resource: "analytics-revenue",
    filters: [{ field: "days", operator: "eq", value: days }],
    pagination: { mode: "off" },
  });
  const top = useList<S["TopProductOut"] & { id?: string }>({
    resource: "analytics-top-products",
    filters: [
      { field: "days", operator: "eq", value: days },
      { field: "limit", operator: "eq", value: 10 },
    ],
    pagination: { mode: "off" },
  });

  const s = summary.result;
  const o = overview.result;
  const series = fillDays(revenue.result.data, days);
  const totalRev = series.reduce((a, p) => a + p.revenue, 0);
  const totalOrders = series.reduce((a, p) => a + p.orders, 0);

  return (
    <>
      <PageHeader title="Reports" description="Business health at a glance. Figures are net of refunds." />

      <section
        aria-labelledby="kpi-heading"
        aria-busy={summary.query.isLoading || overview.query.isLoading || undefined}
      >
        <h2 id="kpi-heading" className="mb-3 text-sm font-semibold text-drs-ink/75">
          All time
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Paid order revenue" value={s ? money(s.paid_order_revenue) : "—"} accent />
          <StatCard label="Orders" value={o?.orders?.toLocaleString("en-IN") ?? "—"} />
          <StatCard label="Delivered orders" value={s?.delivered_orders?.toLocaleString("en-IN") ?? "—"} />
          <StatCard
            label="Active subscriptions"
            value={s?.active_subscriptions?.toLocaleString("en-IN") ?? "—"}
          />
          <StatCard label="Shops" value={s?.shops?.toLocaleString("en-IN") ?? "—"} />
          <StatCard
            label="Wallet float"
            value={s ? money(s.wallet_float) : "—"}
            sub="Prepaid balances held"
          />
          <StatCard
            label="Credit outstanding"
            value={s ? money(s.credit_outstanding) : "—"}
            tone={(s?.credit_outstanding ?? 0) > 0 ? "alert" : "default"}
            sub="Postpaid receivables"
          />
          <StatCard
            label="Low-stock items"
            value={o?.low_stock_items ?? "—"}
            tone={(o?.low_stock_items ?? 0) > 0 ? "alert" : "default"}
          />
        </div>
      </section>

      <div role="group" aria-label="Date range" className="mt-8 mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-drs-ink/75">Range</span>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === days}
            onClick={() => router.replace(`${pathname}?days=${r}`)}
            className={cn(
              "min-h-11 rounded-lg border px-4 text-sm font-medium",
              r === days
                ? "border-drs-green bg-drs-green text-drs-cream"
                : "border-drs-ink/15 bg-drs-white text-drs-green hover:border-drs-green",
            )}
          >
            Last {r} days
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Revenue per day"
          subtitle={`${money(totalRev)} over the last ${days} days`}
          loading={revenue.query.isFetching}
          table={{
            headers: ["Date", "Revenue", "Orders"],
            rows: series.map((p) => [p.date, money(p.revenue), p.orders]),
          }}
        >
          <TrendChart
            data={series.map((p) => ({ x: p.date, y: p.revenue }))}
            label="Revenue"
            format={money}
          />
        </ChartFrame>
        <ChartFrame
          title="Paid orders per day"
          subtitle={`${totalOrders.toLocaleString("en-IN")} orders over the last ${days} days`}
          loading={revenue.query.isFetching}
          table={{ headers: ["Date", "Orders"], rows: series.map((p) => [p.date, p.orders]) }}
        >
          <TrendChart
            kind="column"
            data={series.map((p) => ({ x: p.date, y: p.orders }))}
            label="Orders"
            format={(n) => `${n.toLocaleString("en-IN")} orders`}
            tickFormat={(n) => n.toLocaleString("en-IN")}
          />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <ChartFrame
          title="Top products by revenue"
          subtitle={`Last ${days} days`}
          loading={top.query.isFetching}
          table={{
            headers: ["Product", "Revenue", "Quantity"],
            rows: top.result.data.map((t) => [
              t.name ?? `#${t.product_id}`,
              money(t.revenue),
              t.qty.toLocaleString("en-IN"),
            ]),
          }}
        >
          <BarList
            label="Top products by revenue"
            format={compactMoney}
            data={top.result.data.map((t) => ({
              label: t.name ?? `Product #${t.product_id}`,
              value: t.revenue,
              detail: `${t.qty.toLocaleString("en-IN")} sold`,
            }))}
          />
        </ChartFrame>
      </div>
    </>
  );
}
