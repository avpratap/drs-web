"use client";

import { useList, useOne, type CrudFilter } from "@refinedev/core";
import {
  ArrowRightIcon,
  BotIcon,
  CalendarClockIcon,
  GiftIcon,
  PackagePlusIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { StatCard, StatGrid } from "@/components/ui/stat";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";

type Overview = components["schemas"]["OverviewOut"] & { id: string };

const status = (value: string): CrudFilter[] => [{ field: "status", operator: "eq", value }];
const ATTENTION: { label: string; href: string; resource: string; filters?: CrudFilter[]; hint: string }[] = [
  {
    label: "Withdrawals to approve",
    href: "/withdrawals",
    resource: "withdrawals",
    filters: status("requested"),
    hint: "Wallet payouts awaiting a decision",
  },
  {
    label: "Returns to review",
    href: "/returns",
    resource: "returns",
    filters: status("requested"),
    hint: "Customer return requests",
  },
  {
    label: "Open support tickets",
    href: "/tickets",
    resource: "tickets",
    filters: status("open"),
    hint: "Waiting for a reply",
  },
  {
    label: "Low-stock items",
    href: "/reorder-suggestions",
    resource: "stock-low",
    hint: "At or below reorder point",
  },
  {
    label: "High churn risk",
    href: "/churn",
    resource: "churn",
    filters: [{ field: "risk", operator: "eq", value: "high" }],
    hint: "Accounts likely to lapse",
  },
];

const QUICK = [
  { label: "Today's deliveries", href: "/delivery", icon: TruckIcon },
  { label: "Cutoff runs", href: "/cutoff", icon: CalendarClockIcon },
  { label: "New product", href: "/products/create", icon: PackagePlusIcon },
  { label: "New purchase order", href: "/purchase-orders/create", icon: ShoppingCartIcon },
  { label: "Issue a gift card", href: "/gift-cards", icon: GiftIcon },
  { label: "Ask the AI copilot", href: "/copilot", icon: BotIcon },
];

function AttentionItem({ item }: { item: (typeof ATTENTION)[number] }) {
  const { result, query } = useList({
    resource: item.resource,
    pagination: { pageSize: 1 },
    filters: item.filters,
  });
  const n = result.total ?? 0;
  return (
    <li>
      <Link
        href={item.href}
        className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-drs-ink/10 bg-drs-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-drs-ink">{item.label}</span>
          <span className="block text-xs text-drs-ink/70">{item.hint}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            aria-label={query.isLoading ? "Loading" : `${n}`}
            className={cn(
              "min-w-9 rounded-full px-2.5 py-0.5 text-center text-sm font-semibold tabular-nums",
              query.isLoading
                ? "text-drs-ink/50"
                : n > 0
                  ? "bg-drs-maroon/10 text-drs-maroon"
                  : "bg-drs-green/10 text-drs-green",
            )}
          >
            {query.isLoading ? "—" : n.toLocaleString("en-IN")}
          </span>
          <ArrowRightIcon
            aria-hidden
            className="size-4 text-drs-green transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </li>
  );
}

/** Home: headline KPIs, what needs attention now, and quick links to frequent tasks. */
export function OverviewDashboard() {
  const { result: o, query } = useOne<Overview>({ resource: "reports", id: "overview" });
  const v = (fn: (x: Overview) => string) => (query.isLoading || !o ? "—" : fn(o));
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="ov-kpis" aria-busy={query.isLoading || undefined}>
        <h2
          id="ov-kpis"
          className="mb-3 text-xs leading-4 font-semibold tracking-[0.14em] text-drs-ink/70 uppercase"
        >
          At a glance
        </h2>
        <StatGrid>
          <StatCard label="Paid order revenue" value={v((x) => money(x.paid_order_revenue))} accent />
          <StatCard
            label="Orders"
            value={v((x) => x.orders.toLocaleString("en-IN"))}
            sub={v((x) => `${x.delivered_orders.toLocaleString("en-IN")} delivered`)}
          />
          <StatCard
            label="Active subscriptions"
            value={v((x) => x.active_subscriptions.toLocaleString("en-IN"))}
          />
          <StatCard
            label="Credit outstanding"
            value={v((x) => money(x.credit_outstanding))}
            tone={(o?.credit_outstanding ?? 0) > 0 ? "alert" : "default"}
            sub={v((x) => `Wallet float ${money(x.wallet_float)}`)}
          />
        </StatGrid>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="ov-attention">
          <h2
            id="ov-attention"
            className="mb-3 text-xs leading-4 font-semibold tracking-[0.14em] text-drs-ink/70 uppercase"
          >
            Needs attention
          </h2>
          <ul className="grid gap-3">
            {ATTENTION.map((a) => (
              <AttentionItem key={a.label} item={a} />
            ))}
          </ul>
        </section>
        <section aria-labelledby="ov-quick">
          <h2
            id="ov-quick"
            className="mb-3 text-xs leading-4 font-semibold tracking-[0.14em] text-drs-ink/70 uppercase"
          >
            Quick actions
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {QUICK.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-full min-h-20 flex-col justify-between gap-2 rounded-xl border border-drs-ink/10 bg-drs-white p-4 text-sm font-medium text-drs-green shadow-sm transition-shadow hover:shadow-md"
                >
                  <Icon aria-hidden className="size-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
