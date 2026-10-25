"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

/**
 * Storefront cart (client-side, per browser) — the foundation for the cart/checkout PRs.
 * Persisted in localStorage best-effort; it renders empty when storage is unavailable.
 */
export type CartLine = { productId: number; qty: number };
const KEY = "drs.cart";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed))
      lines = parsed.filter(
        (l): l is CartLine =>
          !!l && typeof l.productId === "number" && typeof l.qty === "number" && l.qty > 0,
      );
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable: the cart lives for this page view only.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

type CartApi = {
  lines: CartLine[];
  count: number;
  add: (productId: number, qty?: number) => void;
  clear: () => void;
};
const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const add = useCallback((productId: number, qty = 1) => {
    const current = read();
    const existing = current.find((l) => l.productId === productId);
    write(
      existing
        ? current.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
        : [...current, { productId, qty }],
    );
  }, []);
  const clear = useCallback(() => write([]), []);
  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), add, clear }),
    [lines, add, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
