"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { useProducts } from "./use-products";

/**
 * Storefront cart, backed by the customer's server cart (/api/v1/cart via the BFF).
 * Signed-out visitors simply have an empty cart; adding asks them to sign in. The header
 * count is the number of products in the cart. Cart writes need no Idempotency-Key (only
 * checkout, order and payment do).
 */
export type ServerCart = components["schemas"]["CartOut"];
export type CartLine = components["schemas"]["CartLineOut"];
export type WriteResult = { ok: true } | { ok: false; reason: "auth" | "error"; message: string };

type CartApi = {
  cart: ServerCart | null;
  /** Distinct products in the cart. */
  count: number;
  /** "unknown" until the first read; "signed-out" when there's no customer session. */
  session: "unknown" | "customer" | "signed-out";
  add: (productId: number, qty: number) => Promise<WriteResult>;
  setQty: (itemId: number, qty: number) => Promise<WriteResult>;
  remove: (itemId: number) => Promise<WriteResult>;
  refresh: () => Promise<void>;
  /** Coupon applied on the cart page, carried into checkout (this tab only). */
  coupon: string | null;
  setCoupon: (code: string | null) => void;
};
const CartContext = createContext<CartApi | null>(null);

/** What a line's count needs from the catalogue: its pack sizes (and which are on sale). */
export type PackInfo = {
  pack_size: number;
  variants?: { pack_size: number; selling_price?: number | null }[] | null;
} | null;

/**
 * Packs in one cart line: qty (base units) over the smallest buyable pack — the same pack the
 * cart's stepper counts in. 1 while the product details are unknown, or if qty isn't a whole
 * number of packs.
 */
export function linePacks(qty: number, info: PackInfo | undefined): number {
  if (!info) return 1;
  const all = info.variants?.length ? info.variants : [{ pack_size: info.pack_size, selling_price: 0 }];
  const priced = all.filter((v) => v.selling_price != null);
  const size = Math.min(...(priced.length ? priced : all).map((v) => v.pack_size).filter((n) => n > 0));
  if (!Number.isFinite(size)) return 1;
  const packs = Math.round(qty / size);
  return packs >= 1 && Math.abs(qty / size - packs) < 1e-6 ? packs : 1;
}

/**
 * The cart's item count: packs, not lines, so the header badge and the "N items" summary
 * change when a quantity does. `info` gives each product's packs (see useProducts).
 */
export const cartCount = (
  cart: Pick<ServerCart, "items"> | null | undefined,
  info?: ReadonlyMap<number, PackInfo | undefined>,
) => (cart?.items ?? []).reduce((n, i) => n + linePacks(i.qty, info?.get(i.product_id)), 0);

export function detailOf(body: unknown): string | undefined {
  const d = (body as { detail?: unknown } | undefined)?.detail;
  return typeof d === "string" ? d : undefined;
}

const COUPON_KEY = "drs.coupon";
function readCoupon(): string | null {
  try {
    return window.sessionStorage.getItem(COUPON_KEY);
  } catch {
    return null;
  }
}

type CartRead = { cart: ServerCart | null; session: CartApi["session"] };

async function readCart(): Promise<CartRead> {
  try {
    const hint = await fetch(`${window.location.origin}/api/store-auth/session`, {
      credentials: "same-origin",
    });
    const { customer } = (await hint.json()) as { customer?: boolean };
    if (!customer) return { cart: null, session: "signed-out" };
    const { data, response } = await api.GET("/api/v1/cart");
    // 401 (signed out) or 403 (a staff session): no customer cart.
    return response.ok && data ? { cart: data, session: "customer" } : { cart: null, session: "signed-out" };
  } catch {
    return { cart: null, session: "signed-out" };
  }
}

type CartCall = Promise<{ data?: ServerCart; error?: unknown; response: Response }>;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ServerCart | null>(null);
  // Pack sizes for the badge count (shared, cached reads; see use-products).
  const { products } = useProducts((cart?.items ?? []).map((i) => i.product_id));
  const [session, setSession] = useState<CartApi["session"]>("unknown");
  const [coupon, setCouponState] = useState<string | null>(null);

  const apply = useCallback((r: CartRead) => {
    setCart(r.cart);
    setSession(r.session);
  }, []);
  const refresh = useCallback(async () => apply(await readCart()), [apply]);

  useEffect(() => {
    // Read once on mount; writes and sign-in keep it current afterwards.
    let live = true;
    void readCart().then((r) => {
      if (!live) return;
      apply(r);
      setCouponState(readCoupon());
    });
    return () => {
      live = false;
    };
  }, [apply]);

  const setCoupon = useCallback((code: string | null) => {
    setCouponState(code);
    try {
      if (code) window.sessionStorage.setItem(COUPON_KEY, code);
      else window.sessionStorage.removeItem(COUPON_KEY);
    } catch {
      // Storage unavailable: the coupon lasts for this page view.
    }
  }, []);

  /** Run a cart write; the response is the whole cart, so state stays exactly the server's. */
  const write = useCallback(async (call: () => CartCall, fallback: string): Promise<WriteResult> => {
    try {
      const { data, error, response } = await call();
      if (response.ok && data) {
        setCart(data);
        setSession("customer");
        return { ok: true };
      }
      if (response.status === 401 || response.status === 403) {
        setSession("signed-out");
        return { ok: false, reason: "auth", message: "Please sign in to continue." };
      }
      return { ok: false, reason: "error", message: detailOf(error) ?? fallback };
    } catch {
      return { ok: false, reason: "error", message: "You seem to be offline. Please try again." };
    }
  }, []);

  const add = useCallback(
    (productId: number, qty: number) =>
      write(
        () => api.POST("/api/v1/cart/items", { body: { product_id: productId, qty } }),
        "We couldn't add that to your cart. Please try again.",
      ),
    [write],
  );
  const setQty = useCallback(
    (itemId: number, qty: number) =>
      write(
        () =>
          api.PATCH("/api/v1/cart/items/{item_id}", { params: { path: { item_id: itemId } }, body: { qty } }),
        "We couldn't update that item. Please try again.",
      ),
    [write],
  );
  const remove = useCallback(
    (itemId: number) =>
      write(
        () => api.DELETE("/api/v1/cart/items/{item_id}", { params: { path: { item_id: itemId } } }),
        "We couldn't remove that item. Please try again.",
      ),
    [write],
  );

  const value = useMemo(
    () => ({
      cart,
      count: cartCount(cart, products),
      session,
      add,
      setQty,
      remove,
      refresh,
      coupon,
      setCoupon,
    }),
    [cart, products, session, add, setQty, remove, refresh, coupon, setCoupon],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
