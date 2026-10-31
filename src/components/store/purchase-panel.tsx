"use client";

import { CheckCircle2Icon, ShoppingBagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";
import { rupees } from "./product-card";
import { Stepper } from "./stepper";
import { buttonClass } from "@/components/ui/button";

/** One buyable pack. `price` is the GST-inclusive selling price of ONE pack (null = unavailable). */
export type PackOption = {
  key: string;
  label: string;
  packSize: number;
  price: number | null;
  mrp: number | null;
  strike: boolean;
};

export const MAX_PACKS = 20;

/** What the cart is asked for: the product in base units, so the cart line equals the price shown. */
export const cartQty = (pack: Pick<PackOption, "packSize">, packs: number) =>
  Math.round(pack.packSize * packs * 1000) / 1000;

export const discountPct = (price: number, mrp: number) => Math.round(((mrp - price) / mrp) * 100);

type Status =
  { kind: "idle" } | { kind: "adding" } | { kind: "added"; text: string } | { kind: "error"; text: string };

export function PurchasePanel({ productId, options }: { productId: number; options: PackOption[] }) {
  const cart = useCart();
  const router = useRouter();
  const groupId = useId();
  const firstBuyable = options.find((o) => o.price != null) ?? options[0];
  const [selectedKey, setSelectedKey] = useState(firstBuyable?.key);
  const [packs, setPacks] = useState(1);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const selected = options.find((o) => o.key === selectedKey) ?? firstBuyable;
  const buyable = selected?.price != null;
  const total = buyable ? selected.price! * packs : null;

  async function addToCart() {
    if (!selected || !buyable) return;
    setStatus({ kind: "adding" });
    const res = await cart.add(productId, cartQty(selected, packs));
    if (res.ok) {
      setStatus({ kind: "added", text: `Added ${packs} × ${selected.label} to your cart.` });
    } else if (res.reason === "auth") {
      router.push(`/account/login?next=${encodeURIComponent(window.location.pathname)}`);
    } else {
      setStatus({ kind: "error", text: res.message });
    }
  }

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Price of the selected pack */}
      <div>
        {buyable ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold text-drs-green" data-testid="pack-price">
              {rupees(selected.price!)}
            </span>
            {selected.strike && selected.mrp != null && (
              <>
                <span className="text-base text-drs-ink/70">
                  <span className="sr-only">MRP </span>
                  <s>{rupees(selected.mrp)}</s>
                </span>
                <span className="rounded-full bg-drs-green/10 px-2.5 py-0.5 text-xs font-semibold text-drs-green">
                  {discountPct(selected.price!, selected.mrp)}% off
                </span>
              </>
            )}
          </p>
        ) : (
          <p className="text-xl font-semibold text-drs-ink/80">Price unavailable</p>
        )}
        <p className="mt-1 text-xs text-drs-ink/70">
          {buyable ? `per ${selected.label} pack · ` : ""}Inclusive of all taxes
        </p>
      </div>

      {/* Pack options */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-drs-ink">Choose a pack</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {options.map((o) => {
            const available = o.price != null;
            const checked = o.key === selected.key;
            return (
              <label
                key={o.key}
                className={cn(
                  "relative flex min-h-16 flex-col justify-center rounded-xl border-2 px-3.5 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-drs-green",
                  checked
                    ? "border-drs-green bg-drs-green/5"
                    : "border-drs-ink/15 bg-drs-white hover:border-drs-green/50",
                  available
                    ? "cursor-pointer"
                    : "cursor-not-allowed border-dashed bg-drs-cream/60 hover:border-drs-ink/15",
                )}
              >
                <input
                  type="radio"
                  name={groupId}
                  value={o.key}
                  checked={checked}
                  disabled={!available}
                  onChange={() => {
                    setSelectedKey(o.key);
                    setStatus({ kind: "idle" });
                  }}
                  className="sr-only"
                />
                <span className={cn("text-sm font-semibold", available ? "text-drs-ink" : "text-drs-ink/70")}>
                  {o.label}
                </span>
                <span className="mt-0.5 text-sm">
                  {available ? (
                    <>
                      <span className="font-medium text-drs-green">{rupees(o.price!)}</span>
                      {o.strike && o.mrp != null && (
                        <span className="ml-1.5 text-xs text-drs-ink/70">
                          <span className="sr-only">MRP </span>
                          <s>{rupees(o.mrp)}</s>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-drs-ink/70">Price unavailable</span>
                  )}
                </span>
                {checked && available && (
                  <CheckCircle2Icon aria-hidden className="absolute top-2 right-2 size-4 text-drs-green" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Quantity + add to cart */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <span id={`${groupId}-qty`} className="mb-2.5 block text-sm font-semibold text-drs-ink">
            Packs
          </span>
          <Stepper
            aria-labelledby={`${groupId}-qty`}
            value={packs}
            max={MAX_PACKS}
            onChange={setPacks}
            disabled={!buyable}
            decreaseLabel="Fewer packs"
            increaseLabel="More packs"
          />
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={!buyable || status.kind === "adding"}
          aria-disabled={!buyable || undefined}
          className={buttonClass("primary", "flex-1 px-6 text-base", "pill")}
        >
          <ShoppingBagIcon aria-hidden className="size-5" strokeWidth={1.75} />
          {status.kind === "adding"
            ? "Adding…"
            : buyable
              ? `Add to cart · ${rupees(total!)}`
              : "Price unavailable"}
        </button>
      </div>

      <p
        role="status"
        className={cn(
          "min-h-5 text-sm",
          status.kind === "error" ? "text-drs-maroon" : "text-drs-green",
          status.kind === "added" && "flex items-center gap-1.5 font-medium",
        )}
      >
        {status.kind === "added" && <CheckCircle2Icon aria-hidden className="size-4" />}
        {status.kind === "added" || status.kind === "error" ? status.text : ""}
      </p>
    </div>
  );
}
