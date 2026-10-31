"use client";

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CreditCardIcon,
  MapPinIcon,
  PlusIcon,
  SunriseIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { deliveryLabel, formatAddress, type Address } from "@/modules/store/checkout";
import { AddressForm } from "./address-form";
import { detailOf, useCart } from "./cart";
import { CartSkeleton } from "./cart-view";
import { OrderSummary, useQuote } from "./order-summary";
import { rupees } from "./product-card";
import { useAttemptKey } from "./use-attempt-key";
import { useProducts } from "./use-products";

type Serviceability = { serviceable: boolean; etd_days?: number | null } | null;

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${n}`}
      className="rounded-2xl border border-drs-ink/10 bg-drs-white p-4 shadow-sm sm:p-6"
    >
      <h2 id={`step-${n}`} className="flex items-center gap-3 text-lg font-semibold text-drs-ink">
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
            done ? "bg-drs-green text-drs-cream" : "border-2 border-drs-green/30 text-drs-green",
          )}
        >
          {done ? <CheckCircle2Icon className="size-4" /> : n}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function useAddresses() {
  const [state, setState] = useState<{ loaded: boolean; list: Address[]; error: string | null }>({
    loaded: false,
    list: [],
    error: null,
  });
  useEffect(() => {
    let live = true;
    void api
      .GET("/api/v1/addresses")
      .then(({ data, error }) => {
        if (live)
          setState({
            loaded: true,
            list: data ?? [],
            error: data ? null : (detailOf(error) ?? "Couldn't load your addresses."),
          });
      })
      .catch(() => live && setState({ loaded: true, list: [], error: "You seem to be offline." }));
    return () => {
      live = false;
    };
  }, []);
  return [state, setState] as const;
}

function useServiceability(pincode: string | null): { result: Serviceability; checking: boolean } {
  const [state, setState] = useState<{ pin: string | null; result: Serviceability }>({
    pin: null,
    result: null,
  });
  useEffect(() => {
    if (!pincode) return;
    let live = true;
    void api
      .GET("/api/v1/shipping/serviceability", { params: { query: { pincode, weight_kg: 0.5, cod: false } } })
      .then(({ data }) => live && setState({ pin: pincode, result: data ?? { serviceable: false } }))
      .catch(() => live && setState({ pin: pincode, result: null }));
    return () => {
      live = false;
    };
  }, [pincode]);
  return {
    result: state.pin === pincode ? state.result : null,
    checking: !!pincode && state.pin !== pincode,
  };
}

function AddressCard({ a, checked, onSelect }: { a: Address; checked: boolean; onSelect: () => void }) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-drs-green",
        checked ? "border-drs-green bg-drs-green/5" : "border-drs-ink/15 hover:border-drs-green/50",
      )}
    >
      <input type="radio" name="address" checked={checked} onChange={onSelect} className="sr-only" />
      <MapPinIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
      <span className="min-w-0 text-sm">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-drs-ink">
          {a.contact_name ?? a.label ?? "Address"}
          {a.label && (
            <span className="rounded-full bg-drs-cream px-2 py-0.5 text-xs font-medium text-drs-ink/80">
              {a.label}
            </span>
          )}
          {a.is_default && <span className="text-xs font-medium text-drs-green">Default</span>}
        </span>
        <span className="mt-1 block text-drs-ink/80">
          {[a.line1, a.line2, a.landmark && `Near ${a.landmark}`].filter(Boolean).join(", ")}
        </span>
        <span className="block text-drs-ink/80">
          {a.city}, {a.state} {a.pincode}
        </span>
        {a.contact_phone && <span className="block text-drs-ink/70">{a.contact_phone}</span>}
      </span>
      {checked && <CheckCircle2Icon aria-hidden className="absolute top-3 right-3 size-5 text-drs-green" />}
    </label>
  );
}

export function CheckoutView({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const router = useRouter();
  const { cart, count, session, coupon, setCoupon, refresh } = useCart();
  const [{ loaded, list, error: addrError }, setAddresses] = useAddresses();
  const [picked, setPicked] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const selected = useMemo(
    () => list.find((a) => a.id === picked) ?? list.find((a) => a.is_default) ?? list[0] ?? null,
    [list, picked],
  );
  const { result: svc, checking } = useServiceability(selected?.pincode ?? null);
  const { quote, error: quoteError } = useQuote({ coupon, pincode: selected?.pincode });
  const lines = cart?.items ?? [];
  const { products } = useProducts(lines.map((l) => l.product_id));
  const attempt = useAttemptKey();
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<{ text: string; retry: boolean } | null>(null);

  if (session === "unknown" || !loaded || (session === "customer" && !cart)) return <CartSkeleton />;
  if (!lines.length) {
    return (
      <div className="rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-14 text-center">
        <h2 className="text-xl font-semibold text-drs-ink">Your cart is empty</h2>
        <p className="mt-1 text-sm text-drs-ink/75">Add something fresh before checking out.</p>
        <Link href="/products" className={buttonClass("primary", "mt-6 rounded-full px-6")}>
          Shop fresh dairy
        </Link>
      </div>
    );
  }

  const showForm = adding || list.length === 0;
  const canPlace = !!selected && svc?.serviceable === true && !!quote && !placing && !showForm;

  async function placeOrder() {
    if (!selected || !quote) return;
    setPlacing(true);
    setPlaceError(null);
    let status: number | null = null;
    try {
      const { data, error, response } = await api.POST("/api/v1/cart/checkout", {
        params: { header: attempt.header() },
        body: {
          address: formatAddress(selected),
          state: selected.state,
          pincode: selected.pincode,
          coupon_code: coupon || undefined,
        },
      });
      status = response.status;
      attempt.settle(status);
      if (data) {
        setCoupon(null);
        void refresh(); // the cart is converted; the header count resets
        router.replace(`/account/orders/${data.id}?placed=1`);
        return;
      }
      const retry = status >= 500 || status === 409;
      setPlaceError({ text: detailOf(error) ?? "We couldn't place your order.", retry });
    } catch {
      attempt.settle(null);
      setPlaceError({ text: "You seem to be offline — your order wasn't placed yet.", retry: true });
    }
    setPlacing(false);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
      <div className="space-y-4">
        <Step n={1} title="Delivery address" done={!!selected && svc?.serviceable === true && !showForm}>
          {addrError && (
            <p role="alert" className="mb-3 text-sm text-drs-maroon">
              {addrError}
            </p>
          )}
          {showForm ? (
            <AddressForm
              defaultOpen={list.length === 0}
              onCancel={list.length ? () => setAdding(false) : undefined}
              onSaved={(a) => {
                setAddresses((s) => ({
                  ...s,
                  list: [a, ...s.list.map((x) => (a.is_default ? { ...x, is_default: false } : x))],
                }));
                setPicked(a.id);
                setAdding(false);
              }}
            />
          ) : (
            <>
              <fieldset>
                <legend className="sr-only">Choose a delivery address</legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {list.map((a) => (
                    <AddressCard
                      key={a.id}
                      a={a}
                      checked={selected?.id === a.id}
                      onSelect={() => setPicked(a.id)}
                    />
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-drs-green hover:bg-drs-green/5"
              >
                <PlusIcon aria-hidden className="size-4" /> Add a new address
              </button>
              <div role="status" className="mt-2 min-h-6 text-sm">
                {checking ? (
                  <span className="text-drs-ink/70">Checking delivery to {selected?.pincode}…</span>
                ) : svc?.serviceable ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-drs-green">
                    <CheckCircle2Icon aria-hidden className="size-4" /> We deliver to {selected?.pincode}
                  </span>
                ) : svc ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-drs-maroon">
                    <CircleAlertIcon aria-hidden className="size-4" /> Sorry, we don&apos;t deliver to{" "}
                    {selected?.pincode} yet. Try another address.
                  </span>
                ) : null}
              </div>
            </>
          )}
        </Step>

        <Step n={2} title="Delivery" done={svc?.serviceable === true}>
          <div className="flex items-start gap-3 rounded-xl bg-drs-cream/70 p-4">
            <SunriseIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
            <div className="text-sm">
              <p className="font-semibold text-drs-ink">
                {svc?.serviceable ? deliveryLabel(svc.etd_days) : "Early-morning doorstep delivery"}
              </p>
              <p className="mt-0.5 text-drs-ink/75">
                Chilled all the way, left at your door. Delivery is free.
              </p>
            </div>
          </div>
        </Step>

        <Step n={3} title="Review & pay">
          <ul aria-label="Items in this order" className="divide-y divide-drs-ink/10 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0 text-drs-ink">
                  {products.get(l.product_id)?.name ?? `Product #${l.product_id}`}
                </span>
                <span className="shrink-0 tabular-nums text-drs-ink">{rupees(l.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-drs-ink/10 p-4 text-sm">
            {paymentsEnabled ? (
              <>
                <CreditCardIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
                <p>
                  <span className="font-semibold text-drs-ink">Pay online</span>
                  <span className="block text-drs-ink/75">
                    UPI, cards and netbanking — secured by Razorpay.
                  </span>
                </p>
              </>
            ) : (
              <>
                <WalletIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
                <p>
                  <span className="font-semibold text-drs-ink">Pay on delivery</span>
                  <span className="block text-drs-ink/75">
                    Online payment is coming soon. Place your order now and pay when it arrives.
                  </span>
                </p>
              </>
            )}
          </div>
        </Step>
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-drs-green hover:underline"
        >
          <ArrowLeftIcon aria-hidden className="size-4" /> Back to cart
        </Link>
      </div>

      <div className="lg:sticky lg:top-28">
        <OrderSummary quote={quote} count={count}>
          {coupon && quote && quote.discount > 0 && (
            <p className="mt-3 text-sm text-drs-green">Coupon {coupon} applied</p>
          )}
          {quoteError && (
            <p role="alert" className="mt-3 text-sm text-drs-maroon">
              {quoteError}{" "}
              {coupon && (
                <button type="button" onClick={() => setCoupon(null)} className="font-medium underline">
                  Remove coupon
                </button>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={placeOrder}
            disabled={!canPlace}
            className={buttonClass("primary", "mt-5 w-full px-6 text-base", "pill")}
          >
            {placing
              ? "Placing your order…"
              : quote
                ? `${paymentsEnabled ? "Place order & pay" : "Place order"} · ${rupees(quote.total)}`
                : "Place order"}
          </button>
          {placeError && (
            <div role="alert" className="mt-3 text-sm text-drs-maroon">
              <p>{placeError.text}</p>
              {placeError.retry && (
                <button type="button" onClick={placeOrder} className="mt-1 font-semibold underline">
                  Try again
                </button>
              )}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-drs-ink/70">
            By placing the order you agree to our terms of service.
          </p>
        </OrderSummary>
      </div>
    </div>
  );
}
