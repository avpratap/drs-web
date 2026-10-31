"use client";

import {
  CheckCircle2Icon,
  ChevronRightIcon,
  ExternalLinkIcon,
  PackageIcon,
  PartyPopperIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { categoryMeta, productHref } from "@/modules/store/categories";
import { deliveryLabel } from "@/modules/store/checkout";
import { ORDER_STEPS, orderStage, orderStatusLabel, paymentLabel } from "@/modules/store/orders";
import { linePack } from "@/modules/store/packs";
import { detailOf } from "./cart";
import { InvoiceLink } from "./invoice-link";
import { PaymentPanel } from "./payment-panel";
import { rupees } from "./product-card";
import { useProducts } from "./use-products";
import { EmptyState } from "./empty-state";

type Order = components["schemas"]["OrderOut"];
type Tracking = components["schemas"]["OrderTrackingOut"];

const pulse = "animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none";

export function OrdersSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading orders" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn(pulse, "h-24")} />
      ))}
    </div>
  );
}

function Problem({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
    >
      {text}
    </p>
  );
}

/** Order history (newest first). */
export function OrdersList() {
  const [state, setState] = useState<{ orders: Order[] | null; error: string | null }>({
    orders: null,
    error: null,
  });
  useEffect(() => {
    let live = true;
    void api
      .GET("/api/v1/orders", { params: { query: { limit: 50 } } })
      .then(
        ({ data, error }) =>
          live &&
          setState({
            orders: data ?? null,
            error: data ? null : (detailOf(error) ?? "Couldn't load your orders."),
          }),
      )
      .catch(() => live && setState({ orders: null, error: "You seem to be offline." }));
    return () => {
      live = false;
    };
  }, []);

  if (state.error) return <Problem text={state.error} />;
  if (!state.orders) return <OrdersSkeleton />;
  if (!state.orders.length) {
    return (
      <EmptyState
        as="h2"
        icon={PackageIcon}
        title="No orders yet"
        body="Your first fresh delivery is a few taps away."
        action={{ href: "/products", label: "Shop fresh dairy" }}
      />
    );
  }
  return (
    <ul aria-label="Your orders" className="space-y-3">
      {state.orders.map((o) => {
        const st = orderStatusLabel(o.status);
        const pay = paymentLabel(o.payment_status);
        const n = o.items.length;
        return (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
            >
              <span
                aria-hidden
                className="hidden size-12 shrink-0 place-items-center rounded-full bg-drs-green/10 sm:grid"
              >
                <PackageIcon className="size-6 text-drs-green" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-drs-ink group-hover:text-drs-green">
                    Order {o.order_no}
                  </span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <Badge tone={pay.tone}>{pay.label}</Badge>
                </span>
                <span className="mt-1 block text-sm text-drs-ink/75">
                  {n} item{n === 1 ? "" : "s"} · {rupees(o.total)}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                className="size-5 shrink-0 text-drs-ink/50 group-hover:text-drs-green"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Timeline({ status }: { status: string }) {
  const stage = orderStage(status);
  if (stage === "cancelled") {
    return (
      <p className="rounded-xl bg-drs-maroon/5 px-4 py-3 text-sm font-medium text-drs-maroon">
        This order was {status}.
      </p>
    );
  }
  return (
    <ol aria-label="Order progress" className="grid grid-cols-4 gap-1">
      {ORDER_STEPS.map((label, i) => {
        const done = i <= stage;
        return (
          <li
            key={label}
            className="flex flex-col items-center gap-2 text-center"
            aria-current={i === stage ? "step" : undefined}
          >
            <span className="flex w-full items-center">
              <span
                aria-hidden
                className={cn(
                  "h-0.5 flex-1",
                  i === 0 ? "bg-transparent" : done ? "bg-drs-green" : "bg-drs-ink/15",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-drs-green text-drs-cream"
                    : "border-2 border-drs-ink/15 bg-drs-white text-drs-ink/60",
                )}
              >
                {done ? <CheckCircle2Icon className="size-4" /> : i + 1}
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-0.5 flex-1",
                  i === ORDER_STEPS.length - 1
                    ? "bg-transparent"
                    : i < stage
                      ? "bg-drs-green"
                      : "bg-drs-ink/15",
                )}
              />
            </span>
            <span
              className={cn(
                "text-xs leading-tight sm:text-sm",
                done ? "font-semibold text-drs-ink" : "text-drs-ink/70",
              )}
            >
              {label}
              <span className="sr-only">{done ? " (done)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Shipments({ tracking }: { tracking: Tracking | null }) {
  if (!tracking?.shipments.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-drs-ink/75">
        <TruckIcon aria-hidden className="size-4 text-drs-green" />
        Tracking appears here once your order leaves the dairy.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {tracking.shipments.map((s) => (
        <li key={s.id} className="rounded-xl border border-drs-ink/10 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-drs-ink">
              {s.courier ?? "DRS Fleet"}{" "}
              {s.awb && <span className="font-normal text-drs-ink/75">· AWB {s.awb}</span>}
            </p>
            {s.tracking_url && (
              <a
                href={s.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1 font-medium text-drs-green hover:underline"
              >
                Track with courier <ExternalLinkIcon aria-hidden className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
          {s.events.length > 0 && (
            <ol className="mt-3 space-y-2 border-l-2 border-drs-green/20 pl-4">
              {s.events.map((e, i) => (
                <li key={i}>
                  <p className="font-medium text-drs-ink">
                    {e.status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                  </p>
                  <p className="text-drs-ink/70">{[e.location, e.note].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ul>
  );
}

/** One order: confirmation (just placed), progress, payment, tracking and items. */
export function OrderDetail({
  id,
  placed,
  paymentsEnabled,
}: {
  id: number;
  placed: boolean;
  paymentsEnabled: boolean;
}) {
  const [state, setState] = useState<{
    order: Order | null;
    tracking: Tracking | null;
    error: string | null;
  }>({
    order: null,
    tracking: null,
    error: null,
  });
  const load = useCallback(async () => {
    try {
      const [o, t] = await Promise.all([
        api.GET("/api/v1/orders/{order_id}", { params: { path: { order_id: id } } }),
        api.GET("/api/v1/orders/{order_id}/tracking", { params: { path: { order_id: id } } }),
      ]);
      return {
        order: o.data ?? null,
        tracking: t.data ?? null,
        error: o.data
          ? null
          : o.response.status === 404
            ? "We couldn't find that order."
            : (detailOf(o.error) ?? "Couldn't load this order."),
      };
    } catch {
      return { order: null, tracking: null, error: "You seem to be offline." };
    }
  }, [id]);
  useEffect(() => {
    let live = true;
    void load().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, [load]);
  const { products } = useProducts(state.order?.items.map((i) => i.product_id) ?? []);

  if (state.error) return <Problem text={state.error} />;
  const o = state.order;
  if (!o) return <OrdersSkeleton rows={4} />;
  const pay = paymentLabel(o.payment_status);
  const due = o.payment_status === "pending" && orderStage(o.status) !== "cancelled";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8">
      <div className="space-y-4">
        {placed && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl bg-drs-green p-5 text-drs-cream shadow-sm md:p-6"
          >
            <PartyPopperIcon aria-hidden className="mt-0.5 size-6 shrink-0" />
            <div>
              <p className="text-lg font-semibold">Thank you! Your order is placed.</p>
              <p className="mt-0.5 text-sm text-drs-cream/90">
                Order {o.order_no} · arriving {deliveryLabel(1).toLowerCase()}. We&apos;ll keep you posted.
              </p>
            </div>
          </div>
        )}

        {due && (
          <PaymentPanel
            purpose={{ kind: "order", orderId: o.id, orderNo: o.order_no }}
            total={o.total}
            enabled={paymentsEnabled}
            onPaid={() => void load().then(setState)}
          />
        )}

        <section
          aria-labelledby="progress-heading"
          className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="progress-heading" className="text-lg font-semibold text-drs-ink">
              Order status
            </h2>
            <Badge tone={pay.tone}>{pay.label}</Badge>
          </div>
          <Timeline status={o.status} />
          <h3 className="mt-6 mb-3 text-sm font-semibold text-drs-ink">Tracking</h3>
          <Shipments tracking={state.tracking} />
        </section>

        <section
          aria-labelledby="items-heading"
          className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
        >
          <h2 id="items-heading" className="text-lg font-semibold text-drs-ink">
            Items
          </h2>
          <ul className="mt-3 divide-y divide-drs-ink/10">
            {o.items.map((it, i) => {
              const p = products.get(it.product_id);
              const pack = linePack(p, it.qty, it.unit_price);
              const meta = categoryMeta(p?.category ?? "");
              const Icon = meta.icon;
              return (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-xl",
                      meta.milkLine ? "bg-drs-sky/20" : "bg-drs-cream",
                    )}
                  >
                    <Icon className="size-6 text-drs-green" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    {p ? (
                      <Link
                        href={productHref(p)}
                        className="font-semibold text-drs-ink hover:text-drs-green hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-drs-ink">Product #{it.product_id}</span>
                    )}
                    <span className="block text-drs-ink/75">
                      {pack.packs != null ? `${pack.packs} × ${pack.label}` : `Qty ${it.qty}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-drs-ink">
                    {rupees(it.line_total)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside
        aria-labelledby="totals-heading"
        className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6 xl:sticky xl:top-3"
      >
        <h2 id="totals-heading" className="text-lg font-semibold text-drs-ink">
          Bill details
        </h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-drs-ink/80">Subtotal</dt>
            <dd className="tabular-nums">{rupees(o.subtotal)}</dd>
          </div>
          {o.discount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-drs-ink/80">Coupon{o.coupon_code ? ` (${o.coupon_code})` : ""}</dt>
              <dd className="tabular-nums text-drs-green">−{rupees(o.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-drs-ink/80">Delivery</dt>
            <dd className="font-medium text-drs-green">Free</dd>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-drs-ink/10 pt-3">
            <dt className="text-base font-semibold text-drs-ink">Total</dt>
            <dd className="text-lg font-semibold tabular-nums text-drs-green">{rupees(o.total)}</dd>
          </div>
        </dl>
        <p className="mt-1.5 text-xs text-drs-ink/70">Includes {rupees(o.tax_total)} GST</p>
        {["paid", "partially_refunded", "refunded"].includes(o.payment_status) && (
          <InvoiceLink orderId={o.id} />
        )}
        <Link
          href="/account/orders"
          className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-drs-green hover:underline"
        >
          All orders <ChevronRightIcon aria-hidden className="size-4" />
        </Link>
      </aside>
    </div>
  );
}
