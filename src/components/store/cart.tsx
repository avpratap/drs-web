"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";

/**
 * Storefront cart, backed by the customer's server cart (GET/POST /api/v1/cart via the BFF).
 * Signed-out visitors simply have an empty cart; adding asks them to sign in. The header
 * count is the number of products in the cart. Cart writes need no Idempotency-Key (only
 * checkout/order/payment do, in the checkout PR).
 */
export type ServerCart = components["schemas"]["CartOut"];
export type AddResult = { ok: true } | { ok: false; reason: "auth" | "error"; message: string };

type CartApi = {
  /** Distinct products in the cart. */
  count: number;
  /** "unknown" until the first read; "signed-out" when there's no customer session. */
  session: "unknown" | "customer" | "signed-out";
  add: (productId: number, qty: number) => Promise<AddResult>;
  refresh: () => Promise<void>;
};
const CartContext = createContext<CartApi | null>(null);

export const cartCount = (cart: Pick<ServerCart, "items"> | null | undefined) => cart?.items.length ?? 0;

function detailOf(body: unknown): string | undefined {
  const d = (body as { detail?: unknown } | undefined)?.detail;
  return typeof d === "string" ? d : undefined;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ServerCart | null>(null);
  const [session, setSession] = useState<CartApi["session"]>("unknown");

  const apply = useCallback((r: CartRead) => {
    setCart(r.cart);
    setSession(r.session);
  }, []);
  const refresh = useCallback(async () => apply(await readCart()), [apply]);

  useEffect(() => {
    // Read once on mount; `add` and sign-in keep it current afterwards.
    let live = true;
    void readCart().then((r) => live && apply(r));
    return () => {
      live = false;
    };
  }, [apply]);

  const add = useCallback(async (productId: number, qty: number): Promise<AddResult> => {
    try {
      const { data, error, response } = await api.POST("/api/v1/cart/items", {
        body: { product_id: productId, qty },
      });
      if (response.ok && data) {
        setCart(data);
        setSession("customer");
        return { ok: true };
      }
      if (response.status === 401 || response.status === 403) {
        setSession("signed-out");
        return { ok: false, reason: "auth", message: "Please sign in to add to your cart." };
      }
      return {
        ok: false,
        reason: "error",
        message: detailOf(error) ?? "We couldn't add that to your cart. Please try again.",
      };
    } catch {
      return { ok: false, reason: "error", message: "You seem to be offline. Please try again." };
    }
  }, []);

  const value = useMemo(
    () => ({ count: cartCount(cart), session, add, refresh }),
    [cart, session, add, refresh],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
