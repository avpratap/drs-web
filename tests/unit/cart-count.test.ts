import { describe, expect, it } from "vitest";
import { cartCount, linePacks } from "@/components/store/cart";

const milk = {
  pack_size: 500,
  variants: [
    { pack_size: 500, selling_price: 33 },
    { pack_size: 1000, selling_price: 66 },
    { pack_size: 5000, selling_price: null },
  ],
};
const ghee = { pack_size: 1, variants: [] };

describe("cart count (B): packs, not lines", () => {
  it("counts a line in its smallest buyable pack", () => {
    expect(linePacks(1000, milk)).toBe(2);
    expect(linePacks(2000, milk)).toBe(4);
    expect(linePacks(3, ghee)).toBe(3);
    // Unknown product details, or an odd quantity: one per line rather than a wrong number.
    expect(linePacks(1000, undefined)).toBe(1);
    expect(linePacks(750, milk)).toBe(1);
  });

  it("changes when a quantity changes, not just when lines are added", () => {
    const info = new Map([
      [1, milk],
      [3, ghee],
    ]);
    const cart = (milkQty: number) => ({
      items: [
        { id: 1, product_id: 1, qty: milkQty, unit_price: 0.066, line_total: 0 },
        { id: 2, product_id: 3, qty: 1, unit_price: 899, line_total: 899 },
      ],
    });
    expect(cartCount(cart(1000), info)).toBe(3);
    expect(cartCount(cart(1500), info)).toBe(4);
    expect(cartCount(cart(1000))).toBe(2); // details not loaded yet: lines
    expect(cartCount(null)).toBe(0);
  });
});
