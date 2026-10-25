"use client";

import {
  ChevronRightIcon,
  LifeBuoyIcon,
  MapPinIcon,
  PackageIcon,
  RepeatIcon,
  SparklesIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { orderStatusLabel } from "@/modules/store/orders";
import { detailOf } from "./cart";
import { rupees } from "./product-card";

type Home = components["schemas"]["HomeOut"];
type Profile = components["schemas"]["ProfileOut"];

const pulse = "animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none";

function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your account" className="space-y-4">
      <div className={cn(pulse, "h-8 w-56")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(pulse, "h-28")} />
        <div className={cn(pulse, "h-28")} />
      </div>
      <div className={cn(pulse, "h-48")} />
    </div>
  );
}

/** /account: greeting, wallet + subscriptions at a glance, recent orders, shortcuts. */
export function AccountOverview() {
  const [state, setState] = useState<{ home: Home | null; profile: Profile | null; error: string | null }>({
    home: null,
    profile: null,
    error: null,
  });
  useEffect(() => {
    let live = true;
    void Promise.all([api.GET("/api/v1/me/home"), api.GET("/api/v1/profile")])
      .then(([h, p]) => {
        if (!live) return;
        setState({
          home: h.data ?? null,
          profile: p.data ?? null,
          error: h.data ? null : (detailOf(h.error) ?? "Couldn't load your account."),
        });
      })
      .catch(() => live && setState({ home: null, profile: null, error: "You seem to be offline." }));
    return () => {
      live = false;
    };
  }, []);

  if (state.error)
    return (
      <p
        role="alert"
        className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
      >
        {state.error}
      </p>
    );
  const { home, profile } = state;
  if (!home) return <OverviewSkeleton />;
  const name = profile?.display_name || profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:text-4xl">
          {name ? `Hello, ${name}` : "Your account"}
        </h1>
        <p className="mt-1 text-sm text-drs-ink/75 md:text-base">
          Your deliveries, wallet and details in one place.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/account/wallet"
          className="group rounded-2xl bg-drs-green p-5 text-drs-cream shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-sm text-drs-cream/85">
            <WalletIcon aria-hidden className="size-4" /> Wallet balance
          </span>
          <span className="mt-2 block text-3xl font-semibold tabular-nums">
            {rupees(home.wallet_balance)}
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-drs-cream group-hover:underline">
            Top up or see history <ChevronRightIcon aria-hidden className="size-4" />
          </span>
        </Link>
        <div className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm">
          <span className="flex items-center gap-2 text-sm text-drs-ink/75">
            <RepeatIcon aria-hidden className="size-4 text-drs-green" /> Active subscriptions
          </span>
          <span className="mt-2 block text-3xl font-semibold text-drs-ink tabular-nums">
            {home.active_subscriptions}
          </span>
          <span className="mt-3 block text-sm text-drs-ink/75">
            {home.active_subscriptions
              ? "Delivered every morning before 7 am."
              : "Subscribe to get milk every morning."}
          </span>
        </div>
        {home.credit_outstanding > 0 && (
          <div className="rounded-2xl border border-drs-maroon/20 bg-drs-white p-5 shadow-sm sm:col-span-2">
            <span className="text-sm text-drs-ink/75">Credit outstanding</span>
            <span className="mt-1 block text-2xl font-semibold text-drs-maroon tabular-nums">
              {rupees(home.credit_outstanding)}
            </span>
          </div>
        )}
      </div>

      <section
        aria-labelledby="recent-heading"
        className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-lg font-semibold text-drs-ink">
            Recent orders
          </h2>
          {home.recent_orders.length > 0 && (
            <Link
              href="/account/orders"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-drs-green hover:underline"
            >
              View all <ChevronRightIcon aria-hidden className="size-4" />
            </Link>
          )}
        </div>
        {home.recent_orders.length ? (
          <ul className="mt-2 divide-y divide-drs-ink/10">
            {home.recent_orders.map((o) => {
              const st = orderStatusLabel(o.status);
              return (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="group flex min-h-14 items-center gap-3 py-2"
                  >
                    <PackageIcon aria-hidden className="size-5 shrink-0 text-drs-green" strokeWidth={1.6} />
                    <span className="min-w-0 flex-1 font-medium text-drs-ink group-hover:text-drs-green">
                      Order {o.order_no}
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {rupees(o.total)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 text-sm text-drs-ink/75">
            No orders yet.{" "}
            <Link href="/products" className={buttonClass("ghost", "-ml-2 inline-flex")}>
              Shop fresh dairy
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="sr-only">
          Shortcuts
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/account/rewards",
              icon: SparklesIcon,
              title: "Rewards",
              body: `${home.loyalty_points.toLocaleString("en-IN")} points · refer a friend`,
            },
            {
              href: "/account/support",
              icon: LifeBuoyIcon,
              title: "Help & support",
              body: "We usually reply within hours",
            },
            {
              href: "/account/addresses",
              icon: MapPinIcon,
              title: "Addresses",
              body: "Where we deliver each morning",
            },
            {
              href: "/account/profile",
              icon: UserRoundIcon,
              title: "Profile",
              body: "Name, email and notifications",
            },
          ].map(({ href, icon: Icon, title, body }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-drs-green/10"
                >
                  <Icon className="size-5 text-drs-green" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-drs-ink group-hover:text-drs-green">{title}</span>
                  <span className="block text-sm text-drs-ink/75">{body}</span>
                </span>
                <ChevronRightIcon aria-hidden className="size-5 text-drs-ink/50" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
