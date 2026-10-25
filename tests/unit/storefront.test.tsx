import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "@/components/store/cart";
import { packLabel } from "@/components/store/product-card";
import { isAdminToken, isCustomerToken } from "@/lib/auth/jwt";
import { safeNext, zoneOf } from "@/lib/auth/zones";
import { categoryHref, categoryMeta } from "@/modules/store/categories";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const tokenFor = (role: string) => `${b64({ alg: "HS256" })}.${b64({ sub: "1", role })}.sig`;

describe("auth zones", () => {
  it("classifies routes into public, customer and admin zones", () => {
    expect(zoneOf("/")).toBe("public");
    expect(zoneOf("/products")).toBe("public");
    expect(zoneOf("/products/12")).toBe("public");
    expect(zoneOf("/cart")).toBe("public");
    expect(zoneOf("/about")).toBe("public");
    for (const p of [
      "/account",
      "/account/orders",
      "/checkout",
      "/orders/7",
      "/subscriptions",
      "/wallet/topup",
    ])
      expect(zoneOf(p)).toBe("customer");
    expect(zoneOf("/account/login")).toBe("customer-login");
    expect(zoneOf("/admin")).toBe("admin");
    expect(zoneOf("/admin/products/3")).toBe("admin");
    expect(zoneOf("/admin/login")).toBe("admin-login");
    // Prefix matching is by path segment, not string prefix.
    expect(zoneOf("/accounting")).toBe("public");
    expect(zoneOf("/administrator")).toBe("public");
  });

  it("keeps post-login redirects inside their zone and on-site", () => {
    expect(safeNext("/admin/orders?x=1", "admin", "/admin")).toBe("/admin/orders?x=1");
    expect(safeNext("/products", "admin", "/admin")).toBe("/admin");
    expect(safeNext("//evil.example", "admin", "/admin")).toBe("/admin");
    expect(safeNext("https://evil.example", "customer", "/")).toBe("/");
    expect(safeNext("/checkout", "customer", "/")).toBe("/checkout");
    expect(safeNext("/admin/users", "customer", "/")).toBe("/");
    expect(safeNext("/account/login", "customer", "/")).toBe("/");
    expect(safeNext(null, "customer", "/")).toBe("/");
  });

  it("recognises admin vs customer/subscriber tokens", () => {
    expect(isAdminToken(tokenFor("admin"))).toBe(true);
    expect(isCustomerToken(tokenFor("admin"))).toBe(false);
    expect(isCustomerToken(tokenFor("customer"))).toBe(true);
    expect(isCustomerToken(tokenFor("subscriber"))).toBe(true);
    expect(isCustomerToken(tokenFor("delivery"))).toBe(false);
    expect(isCustomerToken("garbage")).toBe(false);
    expect(isCustomerToken(undefined)).toBe(false);
  });
});

describe("storefront helpers", () => {
  it("formats pack sizes", () => {
    expect(packLabel(500, "ml")).toBe("500 ml");
    expect(packLabel(1000, "ml")).toBe("1 L");
    expect(packLabel(1, "litre")).toBe("1 L");
    expect(packLabel(200, "g")).toBe("200 g");
    expect(packLabel(1, "kg")).toBe("1 kg");
    expect(packLabel(6, "piece")).toBe("6 pcs");
  });

  it("maps categories to labels, icons and the milk line", () => {
    expect(categoryMeta("milk")).toMatchObject({ label: "Milk", milkLine: true });
    expect(categoryMeta("Buttermilk")).toMatchObject({ slug: "buttermilk", milkLine: true });
    expect(categoryMeta("ghee")).toMatchObject({ label: "Ghee", milkLine: false });
    expect(categoryMeta("flavoured_milk_shakes")).toMatchObject({
      label: "Flavoured Milk Shakes",
      milkLine: false,
    });
    expect(categoryHref("ghee")).toBe("/products?category=ghee");
  });
});

describe("cart", () => {
  beforeEach(() => window.localStorage.clear());

  function Probe() {
    const { count, add, clear } = useCart();
    return (
      <>
        <output>{count}</output>
        <button onClick={() => add(1)}>add</button>
        <button onClick={() => add(2, 3)}>add3</button>
        <button onClick={clear}>clear</button>
      </>
    );
  }

  it("counts items, persists them and survives corrupt storage", () => {
    window.localStorage.setItem("drs.cart", "{not json");
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("0");
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add3").click());
    expect(screen.getByRole("status")).toHaveTextContent("5");
    expect(JSON.parse(window.localStorage.getItem("drs.cart")!)).toEqual([
      { productId: 1, qty: 2 },
      { productId: 2, qty: 3 },
    ]);
    act(() => screen.getByText("clear").click());
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });
});
