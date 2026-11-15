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

/**
 * How a line reads as packs. The cart passes the line's stored `packSize`, so it uses the
 * exact pack the customer chose; orders (which don't store a pack) omit it and fall back to
 * the smallest buyable pack.
 */
export function linePack(
  p: StoreProductFull | null | undefined,
  qty: number,
  unitPrice: number,
  packSize?: number | null,
): LinePack {
  const opts = p ? packOptions(p) : [];
  const priced = opts.filter((o) => o.price != null);
  const chosen = packSize != null ? opts.find((o) => Math.abs(o.packSize - packSize) < 1e-6) : undefined;
  const step = chosen ?? [...(priced.length ? priced : opts)].sort((a, b) => a.packSize - b.packSize)[0];
  const size = packSize != null && packSize > 0 ? packSize : (step?.packSize ?? qty);
  const ratio = size > 0 ? qty / size : 1;
  const whole = Math.round(ratio);
  return {
    label: step?.label ?? (p ? packLabel(size, p.uom) : String(size)),
    size,
    packs: Math.abs(ratio - whole) < 1e-6 && whole > 0 ? whole : null,
    packPrice: Math.round(unitPrice * size * 100) / 100,
  };
}
