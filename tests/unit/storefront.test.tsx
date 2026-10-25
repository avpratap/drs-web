import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartButton } from "@/components/store/header-actions";
import { CartProvider } from "@/components/store/cart";
import { packLabel, rupees } from "@/components/store/product-card";
import { cartQty, discountPct, PurchasePanel, type PackOption } from "@/components/store/purchase-panel";
import { isAdminToken, isCustomerToken } from "@/lib/auth/jwt";
import { safeNext, zoneOf } from "@/lib/auth/zones";
import type { StoreProductFull } from "@/modules/store/catalog";
import { categoryHref, categoryMeta, productHref, productIdFromSlug } from "@/modules/store/categories";
import { packOptions } from "@/modules/store/packs";
import { parseShopParams, shopHref } from "@/modules/store/shop";
import { nav } from "../setup";

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

describe("catalog helpers", () => {
  it("builds and parses product slugs", () => {
    expect(productHref({ id: 12, name: "A2 Desi Ghee (1 L)" })).toBe("/products/12-a2-desi-ghee-1-l");
    expect(productIdFromSlug("12-a2-desi-ghee")).toBe(12);
    expect(productIdFromSlug("12")).toBe(12);
    expect(productIdFromSlug("ghee-12")).toBeNull();
    expect(productIdFromSlug("0-x")).toBeNull();
  });

  it("formats GST-inclusive rupees and discounts", () => {
    expect(rupees(66)).toBe("₹66");
    expect(rupees(33.5)).toBe("₹33.50");
    expect(rupees(1299)).toBe("₹1,299");
    expect(discountPct(899, 999)).toBe(10);
  });

  it("reads and writes shop URLs", () => {
    expect(parseShopParams({ category: "Ghee", q: " paneer ", sort: "bogus", page: "-2" })).toEqual({
      category: "ghee",
      q: "paneer",
      sort: "featured",
      page: 1,
    });
    expect(shopHref({ category: "ghee", sort: "featured", page: 1 })).toBe("/products?category=ghee");
    expect(shopHref({ q: "a2 milk", sort: "rating", page: 2 })).toBe(
      "/products?q=a2+milk&sort=rating&page=2",
    );
    expect(shopHref({})).toBe("/products");
  });

  it("charges the pack: qty = pack_size x packs", () => {
    expect(cartQty({ packSize: 500 }, 3)).toBe(1500);
    expect(cartQty({ packSize: 0.5 }, 3)).toBe(1.5);
    expect(cartQty({ packSize: 0.2 }, 3)).toBe(0.6); // no 0.6000000000000001
  });

  const product = (over: Partial<StoreProductFull> = {}): StoreProductFull => ({
    id: 3,
    sku: "GHEE",
    name: "A2 Desi Ghee",
    uom: "litre",
    pack_size: 1,
    is_subscribable: false,
    perishable: false,
    gst_rate: 12,
    status: "active",
    avg_rating: 0,
    rating_count: 0,
    from_price: 469,
    variants: [],
    ...over,
  });

  it("turns variants (or the product's own pack) into pack options", () => {
    expect(packOptions(product())).toEqual([
      { key: "base", label: "1 L", packSize: 1, price: 469, mrp: null, strike: false },
    ]);
    expect(packOptions(product({ from_price: null }))[0].price).toBeNull();
    const v = { product_id: 3, sku: "x", price: 1, status: "active", sort_order: 1, image_url: null };
    expect(
      packOptions(
        product({
          variants: [
            { ...v, id: 5, label: "1 L", pack_size: 1, selling_price: 899, mrp: 999, show_mrp_strike: true },
            {
              ...v,
              id: 6,
              label: "",
              pack_size: 0.5,
              selling_price: null,
              mrp: null,
              show_mrp_strike: false,
            },
          ],
        }),
      ),
    ).toEqual([
      { key: "5", label: "1 L", packSize: 1, price: 899, mrp: 999, strike: true },
      { key: "6", label: "0.5 L", packSize: 0.5, price: null, mrp: null, strike: false },
    ]);
  });
});

describe("purchase panel + server cart", () => {
  const OPTIONS: PackOption[] = [
    { key: "1", label: "500 ml", packSize: 500, price: 34, mrp: 34, strike: false },
    { key: "2", label: "1 L", packSize: 1000, price: 66, mrp: 68, strike: true },
    { key: "3", label: "Crate of 12", packSize: 6000, price: null, mrp: null, strike: false },
  ];

  /** A fake backend cart behind the BFF: GET /cart and POST /cart/items. */
  function fakeCart({ signedIn = true } = {}) {
    const items: { id: number; product_id: number; qty: number; unit_price: number; line_total: number }[] =
      [];
    const posts: unknown[] = [];
    const cart = () => ({ id: 1, status: "open", items, subtotal: 0 });
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const req = new Request(input, init);
        const path = new URL(req.url).pathname;
        if (path === "/api/store-auth/session") return json(200, { customer: signedIn });
        if (path.endsWith("/refresh")) return json(401, {});
        if (!signedIn) return json(401, { detail: "Not authenticated" });
        if (path === "/api/backend/api/v1/cart") return json(200, cart());
        if (path === "/api/backend/api/v1/cart/items" && req.method === "POST") {
          const body = (await req.json()) as { product_id: number; qty: number };
          posts.push(body);
          const line = items.find((i) => i.product_id === body.product_id);
          if (line) line.qty += body.qty;
          else items.push({ id: items.length + 1, unit_price: 0.066, line_total: 0, ...body });
          return json(200, cart());
        }
        return json(404, {});
      }),
    );
    return { posts };
  }

  const renderPanel = () =>
    render(
      <CartProvider>
        <CartButton />
        <PurchasePanel productId={1} options={OPTIONS} />
      </CartProvider>,
    );

  it("prices the selected pack, disables unpriced packs and posts qty = pack_size x packs", async () => {
    const { posts } = fakeCart();
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(screen.getByRole("link", { name: "Cart, empty" })).toBeInTheDocument());

    expect(screen.getByRole("radio", { name: /Crate of 12/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /500 ml/ })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /1 L/ }));
    expect(screen.getByTestId("pack-price")).toHaveTextContent("₹66");
    expect(screen.getAllByText("₹68", { selector: "s" })).toHaveLength(2); // headline + its pack card
    expect(screen.getByText("3% off")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More packs" }));
    await user.click(screen.getByRole("button", { name: "More packs" }));
    const add = screen.getByRole("button", { name: /Add to cart · ₹198/ });
    await user.click(add);

    expect(await screen.findByText("Added 3 × 1 L to your cart.")).toBeInTheDocument();
    expect(posts).toEqual([{ product_id: 1, qty: 3000 }]);
    expect(screen.getByRole("link", { name: "Cart, 1 item" })).toBeInTheDocument();
  });

  it("sends signed-out shoppers to sign in and back to the product (without reading a cart)", async () => {
    fakeCart({ signedIn: false });
    window.history.replaceState({}, "", "/products/1-full-cream-milk");
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /Add to cart/ }));
    await waitFor(() =>
      expect(nav.push).toHaveBeenCalledWith("/account/login?next=%2Fproducts%2F1-full-cream-milk"),
    );
    const paths = vi
      .mocked(fetch)
      .mock.calls.map(([i]) => new URL(String(i instanceof Request ? i.url : i)).pathname);
    expect(paths).not.toContain("/api/backend/api/v1/cart"); // no 401 noise for signed-out visitors
    window.history.replaceState({}, "", "/");
  });
});
