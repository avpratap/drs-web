import { packLabel } from "@/components/store/product-card";
import type { PackOption } from "@/components/store/purchase-panel";
import type { StoreProductFull } from "./catalog";

/**
 * The buyable packs of a product: its active variants (selling_price per pack, null when no
 * retail price applies), or — for a product without variants — its own pack at `from_price`.
 */
export function packOptions(p: StoreProductFull): PackOption[] {
  if (p.variants.length) {
    return p.variants.map((v) => ({
      key: String(v.id),
      label: v.label || packLabel(v.pack_size, p.uom),
      packSize: v.pack_size,
      price: v.selling_price ?? null,
      mrp: v.mrp ?? null,
      strike: v.show_mrp_strike,
    }));
  }
  return [
    {
      key: "base",
      label: packLabel(p.pack_size, p.uom),
      packSize: p.pack_size,
      price: p.from_price ?? null,
      mrp: null,
      strike: false,
    },
  ];
}

/** How a cart/order line reads: its smallest buyable pack, and how many of them it holds. */
export type LinePack = { label: string; size: number; packs: number | null; packPrice: number };

export function linePack(p: StoreProductFull | null | undefined, qty: number, unitPrice: number): LinePack {
  const opts = p ? packOptions(p) : [];
  const priced = opts.filter((o) => o.price != null);
  const step = [...(priced.length ? priced : opts)].sort((a, b) => a.packSize - b.packSize)[0];
  const size = step?.packSize ?? qty;
  const ratio = size > 0 ? qty / size : 1;
  const whole = Math.round(ratio);
  return {
    label: step?.label ?? (p ? packLabel(qty, p.uom) : String(qty)),
    size,
    packs: Math.abs(ratio - whole) < 1e-6 && whole > 0 ? whole : null,
    packPrice: Math.round(unitPrice * size * 100) / 100,
  };
}
