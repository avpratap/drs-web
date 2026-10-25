"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { detailOf, useCart } from "./cart";
import { rupees } from "./product-card";

export type Quote = components["schemas"]["QuoteOut"];

/**
 * The server's pre-pay quote for the current cart (POST /cart/quote): subtotal, coupon
 * discount, the GST already inside the prices, and the payable total. Re-asked whenever
 * the cart, coupon or pincode changes; read-only (never reserves the coupon).
 */
export function useQuote({ coupon, pincode }: { coupon?: string | null; pincode?: string | null }) {
  const { cart } = useCart();
  const version = cart ? cart.items.map((i) => `${i.id}:${i.qty}`).join("|") : "";
  const ask = cart && cart.items.length ? `${version}#${coupon ?? ""}#${pincode ?? ""}` : "";
  const [state, setState] = useState<{ ask: string; quote: Quote | null; error: string | null }>({
    ask: "",
    quote: null,
    error: null,
  });
  useEffect(() => {
    if (!ask) return;
    let live = true;
    void api
      .POST("/api/v1/cart/quote", {
        body: { coupon_code: coupon || undefined, pincode: pincode || undefined, weight_kg: 0.5, cod: false },
      })
      .then(({ data, error }) => {
        if (live)
          setState({
            ask,
            quote: data ?? null,
            error: data ? null : (detailOf(error) ?? "Couldn't price your cart."),
          });
      })
      .catch(() => live && setState({ ask, quote: null, error: "You seem to be offline." }));
    return () => {
      live = false;
    };
  }, [ask, coupon, pincode]);
  return {
    quote: state.ask === ask ? state.quote : null,
    error: state.ask === ask ? state.error : null,
    loading: !!ask && state.ask !== ask,
  };
}

function Row({
  label,
  value,
  strong,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <dt className={strong ? "text-base font-semibold text-drs-ink" : "text-sm text-drs-ink/80"}>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          strong ? "text-lg font-semibold text-drs-green" : "text-sm text-drs-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Subtotal → coupon → delivery → total, with the GST that's already included. */
export function OrderSummary({
  quote,
  count,
  children,
}: {
  quote: Quote | null;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <h2 id="summary-heading" className="text-lg font-semibold text-drs-ink">
        Order summary
      </h2>
      {quote ? (
        <dl className="mt-4 space-y-2.5">
          <Row label={`Subtotal (${count} item${count === 1 ? "" : "s"})`} value={rupees(quote.subtotal)} />
          {quote.discount > 0 && (
            <Row
              label="Coupon discount"
              value={<span className="text-drs-green">−{rupees(quote.discount)}</span>}
            />
          )}
          <Row label="Delivery" value={<span className="font-medium text-drs-green">Free</span>} />
          <Row
            label="Total"
            value={rupees(quote.total)}
            strong
            className="mt-3 border-t border-drs-ink/10 pt-3"
          />
        </dl>
      ) : (
        <div aria-hidden className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-drs-ink/[0.06] motion-reduce:animate-none" />
          ))}
          <div className="mt-4 h-6 animate-pulse rounded bg-drs-ink/[0.06] motion-reduce:animate-none" />
        </div>
      )}
      {quote && <p className="mt-1.5 text-xs text-drs-ink/70">Includes {rupees(quote.tax_total)} GST</p>}
      {children}
    </section>
  );
}
