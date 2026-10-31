"use client";

import { ArrowRightIcon, ShoppingBagIcon, TagIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/utils";
import { categoryMeta, productHref } from "@/modules/store/categories";
import { MAX_PACKS } from "./purchase-panel";
import { linePack } from "@/modules/store/packs";
import { detailOf, useCart, type CartLine } from "./cart";
import { OrderSummary, useQuote } from "./order-summary";
import { rupees } from "./product-card";
import { Stepper } from "./stepper";
import { useProducts, type ProductInfo } from "./use-products";

export function CartSkeleton() {
  const pulse = "animate-pulse rounded-xl bg-drs-ink/[0.06] motion-reduce:animate-none";
  return (
    <div
      aria-busy="true"
      aria-label="Loading your cart"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10"
    >
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(pulse, "h-28")} />
        ))}
      </div>
      <div className={cn(pulse, "h-64")} />
    </div>
  );
}

function SignedOut() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-drs-ink/10 bg-drs-white px-6 py-14 text-center shadow-sm">
      <ShoppingBagIcon aria-hidden className="size-10 text-drs-green" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-semibold text-drs-ink">Sign in to see your cart</h2>
      <p className="mt-1 max-w-sm text-sm text-drs-ink/75">
        Your cart is saved to your account, on every device.
      </p>
      <Link href="/account/login?next=%2Fcart" className={buttonClass("primary", "mt-6 px-6", "pill")}>
        Sign in
      </Link>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-14 text-center">
      <span aria-hidden className="grid size-20 place-items-center rounded-full bg-drs-sky/20">
        <ShoppingBagIcon className="size-9 text-drs-green" strokeWidth={1.5} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-drs-ink">Your cart is empty</h2>
      <p className="mt-1 max-w-sm text-sm text-drs-ink/75">
        Fresh milk, curd, paneer and ghee — delivered before 7 am.
      </p>
      <Link href="/products" className={buttonClass("primary", "mt-6 px-6", "pill")}>
        Start shopping <ArrowRightIcon aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

function LineItem({ line, product }: { line: CartLine; product: ProductInfo | null | undefined }) {
  const { setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pack = linePack(product, line.qty, line.unit_price);
  const name = product?.name ?? `Product #${line.product_id}`;
  const meta = categoryMeta(product?.category ?? "");
  const Icon = meta.icon;

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    setError(null);
    const r = await fn();
    if (!r.ok) setError(r.message ?? "Something went wrong.");
    setBusy(false);
  }

  return (
    <li
      className="flex gap-3 rounded-2xl border border-drs-ink/10 bg-drs-white p-3 shadow-sm sm:gap-4 sm:p-4"
      aria-busy={busy || undefined}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-16 shrink-0 place-items-center rounded-xl sm:size-20",
          meta.milkLine ? "bg-drs-sky/20" : "bg-drs-cream",
        )}
      >
        <Icon className="size-7 text-drs-green sm:size-8" strokeWidth={1.5} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link
                href={productHref(product)}
                // -my/py: a 44px tap target without changing the line's layout.
                className="-my-3 inline-block py-3 font-semibold text-drs-ink hover:text-drs-green hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span className="font-semibold text-drs-ink">{name}</span>
            )}
            <p className="mt-0.5 text-sm text-drs-ink/75">
              {pack.label} pack · {rupees(pack.packPrice)} each
            </p>
          </div>
          <p className="shrink-0 text-base font-semibold text-drs-ink tabular-nums">
            <span className="sr-only">Line total </span>
            {rupees(line.line_total)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {pack.packs != null ? (
            <Stepper
              aria-label={`Packs of ${name}`}
              value={pack.packs}
              max={MAX_PACKS}
              disabled={busy}
              decreaseLabel={`One fewer pack of ${name}`}
              increaseLabel={`One more pack of ${name}`}
              onChange={(n) => run(() => setQty(line.id, Math.round(n * pack.size * 1000) / 1000))}
            />
          ) : (
            <p className="text-sm text-drs-ink/80">Quantity: {line.qty}</p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => remove(line.id))}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-drs-maroon transition-colors hover:bg-drs-maroon/5 disabled:opacity-50"
            aria-label={`Remove ${name}`}
          >
            <Trash2Icon aria-hidden className="size-4" />
            <span aria-hidden>Remove</span>
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-drs-maroon">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

export function CouponBox() {
  const { coupon, setCoupon } = useCart();
  const id = useId();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "checking" } | { kind: "error"; text: string }>({
    kind: "idle",
  });

  if (coupon) {
    return (
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-drs-green/5 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-drs-green">
          <TagIcon aria-hidden className="size-4" />
          {coupon} applied
        </span>
        <button
          type="button"
          onClick={() => setCoupon(null)}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-drs-ink/80 hover:text-drs-maroon"
          aria-label={`Remove coupon ${coupon}`}
        >
          <XIcon aria-hidden className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <form
      className="mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const c = code.trim().toUpperCase();
        if (!c) return;
        setState({ kind: "checking" });
        try {
          const { data, error } = await api.POST("/api/v1/cart/coupon-preview", { body: { code: c } });
          if (data) {
            setCoupon(c);
            setCode("");
            setState({ kind: "idle" });
          } else setState({ kind: "error", text: detailOf(error) ?? "That coupon can't be used." });
        } catch {
          setState({ kind: "error", text: "You seem to be offline." });
        }
      }}
    >
      <label htmlFor={id} className="text-sm font-medium text-drs-ink">
        Coupon code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
          aria-invalid={state.kind === "error" || undefined}
          aria-describedby={state.kind === "error" ? `${id}-err` : undefined}
          className="h-11 min-w-0 flex-1 rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm uppercase text-drs-ink placeholder:normal-case placeholder:text-drs-ink/70 hover:border-drs-green/50 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon"
          placeholder="e.g. WELCOME50"
        />
        <button
          type="submit"
          disabled={state.kind === "checking"}
          className={buttonClass("secondary", "shrink-0")}
        >
          {state.kind === "checking" ? "Checking…" : "Apply"}
        </button>
      </div>
      {state.kind === "error" && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-drs-maroon">
          {state.text}
        </p>
      )}
    </form>
  );
}

export function CartView() {
  const { cart, count, session, coupon, setCoupon } = useCart();
  const lines = cart?.items ?? [];
  const { products, loading } = useProducts(lines.map((l) => l.product_id));
  const { quote, error } = useQuote({ coupon });

  if (session === "unknown" || (session === "customer" && !cart)) return <CartSkeleton />;
  if (session === "signed-out") return <SignedOut />;
  if (!lines.length) return <EmptyCart />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
      {loading ? (
        <CartSkeleton />
      ) : (
        <ul aria-label="Items in your cart" className="space-y-3">
          {lines.map((l) => (
            <LineItem key={l.id} line={l} product={products.get(l.product_id)} />
          ))}
        </ul>
      )}
      <div className="lg:sticky lg:top-[calc(var(--header-h)+0.75rem)]">
        <OrderSummary quote={quote} count={count}>
          {error && coupon && (
            <p role="alert" className="mt-3 text-sm text-drs-maroon">
              {error}{" "}
              <button type="button" onClick={() => setCoupon(null)} className="font-medium underline">
                Remove coupon
              </button>
            </p>
          )}
          <CouponBox />
          <Link href="/checkout" className={buttonClass("primary", "mt-5 w-full text-base", "pill")}>
            Checkout <ArrowRightIcon aria-hidden className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-drs-ink/70">
            Delivered before 7 am · Pause or skip any day
          </p>
        </OrderSummary>
      </div>
    </div>
  );
}
