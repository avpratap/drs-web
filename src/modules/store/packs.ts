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
