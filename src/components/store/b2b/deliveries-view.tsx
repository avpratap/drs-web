"use client";

import { TruckIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { api } from "@/lib/api/browser";
import { humanize, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addDays, dayLabel, todayIst, type DeliveryOrder } from "@/modules/store/b2b";
import { detailOf } from "../cart";
import { packLabel } from "../product-card";
import { LoadError, PanelSkeleton, useLoad } from "../use-load";
import { ShopSwitcher, useShops } from "./shops";
import { EmptyState } from "../empty-state";

const ORIGIN: Record<string, string> = { subscription: "Standing order", one_time: "One-off order" };

function useDeliveries(date: string) {
  const [state, setState] = useState<{ date: string; data: DeliveryOrder[] | null; error: string | null }>({
    date: "",
    data: null,
    error: null,
  });
  const fetchDay = useCallback(async () => {
    try {
      const { data, error } = await api.GET("/api/v1/delivery/orders", {
        params: { query: { date, limit: 100 } },
      });
      return {
        date,
        data: data ?? null,
        error: data ? null : (detailOf(error) ?? "Couldn't load deliveries."),
      };
    } catch {
      return { date, data: null, error: "You seem to be offline." };
    }
  }, [date]);
  useEffect(() => {
    let live = true;
    void fetchDay().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, [fetchDay]);
  const current = state.date === date;
  return { data: current ? state.data : null, error: current ? state.error : null };
}

/** Upcoming (and past) delivery orders for the selected shop, one date at a time. */
export function DeliveriesView() {
  const { shops, error } = useShops();
  if (error) return <LoadError text={error} />;
  // Dates are read on the client only (never frozen into the prerendered shell).
  if (!shops) return <PanelSkeleton rows={2} label="Loading deliveries" />;
  return <Deliveries />;
}

function Deliveries() {
  const { current } = useShops();
  const today = todayIst();
  const chips = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const [date, setDate] = useState(() => addDays(today, 1));
  const day = useDeliveries(date);
  const catalogue = useLoad(
    () => api.GET("/api/v1/products", { params: { query: { limit: 100 } } }),
    "Couldn't load the product list.",
  );
  const products = new Map((catalogue.data ?? []).map((p) => [p.id, p]));

  const orders = (day.data ?? []).filter((o) => !current || o.shop_id === current.id);

  return (
    <div className="space-y-5">
      <ShopSwitcher />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div role="group" aria-label="Delivery date" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === date}
              onClick={() => setDate(d)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                d === date
                  ? "border-drs-green bg-drs-green text-drs-cream"
                  : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
              )}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-1.5 md:w-48">
          <label htmlFor="other-date" className="text-sm font-medium text-drs-ink">
            Another date
          </label>
          <DatePicker id="other-date" value={date} onChange={(v) => v && setDate(v)} />
        </div>
      </div>

      <section aria-labelledby="day-h">
        <h2 id="day-h" className="mb-3 text-lg font-semibold text-drs-ink">
          {dayLabel(date)}
        </h2>
        {day.error ? (
          <LoadError text={day.error} />
        ) : !day.data ? (
          <PanelSkeleton rows={1} label="Loading the day's deliveries" />
        ) : orders.length ? (
          <ul aria-label={`Deliveries on ${dayLabel(date)}`} className="grid grid-cols-1 gap-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-drs-ink">
                      {o.shop_name ?? current?.name ?? `Shop #${o.shop_id}`}
                    </p>
                    <p className="text-sm text-drs-ink/75">
                      {ORIGIN[o.origin] ?? humanize(o.origin)} · Delivery #{o.id}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <ul
                  aria-label={`Items in delivery ${o.id}`}
                  className="mt-3 divide-y divide-drs-ink/10 text-sm"
                >
                  {o.items.map((i) => {
                    const p = products.get(i.product_id);
                    const q = (n: number) => (p ? packLabel(n, p.uom) : String(n));
                    const delivered = ["delivered", "partially_delivered"].includes(o.status);
                    return (
                      <li key={i.product_id} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0 text-drs-ink">
                          {p?.name ?? `Product #${i.product_id}`}
                          <span className="block text-xs text-drs-ink/70 tabular-nums">
                            {delivered && i.qty_delivered !== i.qty_planned
                              ? `${q(i.qty_delivered)} of ${q(i.qty_planned)} delivered`
                              : q(delivered ? i.qty_delivered : i.qty_planned)}
                          </span>
                        </span>
                        <span className="font-medium text-drs-ink tabular-nums">{money(i.line_total)}</span>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-drs-ink/10 pt-3 text-sm">
                  <div>
                    <dt className="text-drs-ink/75">Total</dt>
                    <dd className="font-semibold text-drs-ink tabular-nums">{money(o.total)}</dd>
                  </div>
                  <div>
                    <dt className="text-drs-ink/75">Due on delivery</dt>
                    <dd className="font-semibold text-drs-ink tabular-nums">{money(o.amount_due)}</dd>
                  </div>
                </dl>
                {o.failure_reason && (
                  <p className="mt-2 text-sm text-drs-maroon">Not delivered: {o.failure_reason}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={TruckIcon}
            title={`No deliveries ${date > today ? "planned" : "recorded"}.`}
            body={
              date > today
                ? "Orders appear here once the evening cutoff fixes them — check your standing order to see what's coming."
                : "Nothing was delivered to this shop on that day."
            }
          />
        )}
      </section>
    </div>
  );
}
