"use client";

import { ChevronRightIcon, RepeatIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { formatDate } from "@/lib/format";
import { shopAddress, type Shop, type Subscription } from "@/modules/store/b2b";
import { detailOf } from "../cart";
import { LoadError, PanelSkeleton, useLoad } from "../use-load";
import { ShopSwitcher, useShops } from "./shops";

/**
 * POST /subscriptions for a shop: creates its standing order, returns the existing one, or
 * restarts a cancelled one (the backend decides) — then opens it.
 */
export function StartStandingOrder({
  shop,
  label = "Start a standing order",
}: {
  shop: Shop;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inactive = shop.status !== "active";
  return (
    <div>
      <Button
        type="button"
        className="rounded-full"
        disabled={busy || inactive}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const { data, error: err } = await api.POST("/api/v1/subscriptions", {
              body: { shop_id: shop.id },
            });
            if (data) return router.push(`/account/subscriptions/${data.id}`);
            setError(detailOf(err) ?? "Couldn't start the standing order. Please try again.");
          } catch {
            setError("You seem to be offline.");
          }
          setBusy(false);
        }}
      >
        <RepeatIcon aria-hidden className="size-4" />
        {busy ? "Starting…" : label}
      </Button>
      {inactive && (
        <p className="mt-2 text-sm text-drs-ink/75">
          This shop is inactive, so it can&apos;t get new deliveries.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-drs-maroon">
          {error}
        </p>
      )}
    </div>
  );
}

function SubscriptionCard({ sub, shop }: { sub: Subscription; shop?: Shop }) {
  return (
    <Link
      href={`/account/subscriptions/${sub.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-colors hover:border-drs-green/40 md:p-5"
    >
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full bg-drs-green/10 text-drs-green"
      >
        <RepeatIcon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-drs-ink">{shop?.name ?? `Shop #${sub.shop_id}`}</span>
          <StatusBadge status={sub.status} />
        </span>
        <span className="mt-0.5 block text-sm text-drs-ink/75">
          {sub.status === "cancelled"
            ? `Ended${sub.end_date ? ` ${formatDate(sub.end_date)}` : ""}`
            : `Since ${formatDate(sub.start_date)}`}
          {shop && shopAddress(shop) ? ` · ${shopAddress(shop)}` : ""}
        </span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-drs-ink/60 group-hover:text-drs-green" />
    </Link>
  );
}

/** The selected shop's standing order (or a way to start one), then every shop's at a glance. */
export function SubscriptionsView() {
  const { shops, current, error: shopsError } = useShops();
  const subs = useLoad(
    () => api.GET("/api/v1/subscriptions", { params: { query: { limit: 100 } } }),
    "Couldn't load your standing orders.",
  );
  const error = shopsError ?? subs.error;
  if (error) return <LoadError text={error} />;
  if (!shops || !subs.data) return <PanelSkeleton rows={2} label="Loading standing orders" />;

  const shopById = new Map(shops.map((s) => [s.id, s]));
  const mine = current ? subs.data.find((s) => s.shop_id === current.id) : undefined;
  const others = subs.data.filter((s) => s !== mine);

  return (
    <div className="space-y-6">
      <ShopSwitcher />
      {current && (
        <section aria-labelledby="this-shop-h">
          <h2 id="this-shop-h" className="mb-3 text-lg font-semibold text-drs-ink">
            {current.name}
          </h2>
          {mine && mine.status !== "cancelled" ? (
            <SubscriptionCard sub={mine} shop={current} />
          ) : (
            <div className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white p-5 md:p-6">
              <p className="font-medium text-drs-ink">
                {mine ? "This shop's standing order was cancelled." : "No standing order for this shop yet."}
              </p>
              <p className="mt-1 mb-4 text-sm text-drs-ink/75">
                Set the products and quantities you need on a regular schedule — we deliver them before 7 am,
                and you can skip or change any day before the evening cutoff.
              </p>
              <StartStandingOrder shop={current} label={mine ? "Restart standing order" : undefined} />
            </div>
          )}
        </section>
      )}
      {others.length > 0 && (
        <section aria-labelledby="all-subs-h">
          <h2 id="all-subs-h" className="mb-3 text-lg font-semibold text-drs-ink">
            {current ? "Your other shops" : "Your standing orders"}
          </h2>
          <ul aria-labelledby="all-subs-h" className="grid grid-cols-1 gap-3">
            {others.map((s) => (
              <li key={s.id}>
                <SubscriptionCard sub={s} shop={shopById.get(s.shop_id)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
