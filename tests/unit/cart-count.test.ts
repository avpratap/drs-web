import { describe, expect, it } from "vitest";
import { cartCount, linePacks } from "@/components/store/cart";

describe("cart count: packs, not lines", () => {
  it("counts a line by its own chosen pack", () => {
    expect(linePacks({ qty: 1, pack_size: 0.5 })).toBe(2); // 1 kg bought as 0.5 kg packs
    expect(linePacks({ qty: 2, pack_size: 0.5 })).toBe(4);
    expect(linePacks({ qty: 3, pack_size: 1 })).toBe(3);
    // No usable pack size: one per line rather than a wrong number.
    expect(linePacks({ qty: 1, pack_size: 0 })).toBe(1);
  });

  it("changes when a quantity changes, not just when lines are added", () => {
    const cart = (milkQty: number) => ({
      items: [
        { id: 1, product_id: 1, qty: milkQty, pack_size: 0.5, unit_price: 54, line_total: 0 },
        { id: 2, product_id: 3, qty: 1, pack_size: 1, unit_price: 899, line_total: 899 },
      ],
    });
    expect(cartCount(cart(1))).toBe(3); // 2 milk packs + 1 ghee
    expect(cartCount(cart(1.5))).toBe(4); // 3 milk packs + 1 ghee
    expect(cartCount(null)).toBe(0);
  });
});
