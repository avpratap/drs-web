"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";

export type ProductInfo = components["schemas"]["ProductFullOut"];

// One request per product per page load, shared by every component that asks. Only a
// successful read stays cached: a failure (offline, 5xx, a missing product) is dropped so the
// next render that needs it asks again instead of showing "Product #id" for the whole session.
const cache = new Map<number, Promise<ProductInfo | null>>();

export function loadProduct(id: number): Promise<ProductInfo | null> {
  let p = cache.get(id);
  if (!p) {
    p = api
      .GET("/api/v1/products/{product_id}/full", { params: { path: { product_id: id } } })
      .then(({ data }) => data ?? null)
      .catch(() => null)
      .then((info) => {
        if (info === null) cache.delete(id);
        return info;
      });
    cache.set(id, p);
  }
  return p;
}

/** Catalogue details (name, packs, category) for the products on cart and order lines. */
export function useProducts(ids: readonly number[]): {
  products: Map<number, ProductInfo | null>;
  loading: boolean;
} {
  const key = [...new Set(ids)].sort((a, b) => a - b).join(",");
  const [state, setState] = useState<{ key: string; products: Map<number, ProductInfo | null> }>({
    key: "",
    products: new Map(),
  });
  useEffect(() => {
    if (!key) return;
    let live = true;
    const list = key.split(",").map(Number);
    void Promise.all(list.map(loadProduct)).then((rows) => {
      if (live) setState({ key, products: new Map(list.map((id, i) => [id, rows[i]])) });
    });
    return () => {
      live = false;
    };
  }, [key]);
  return { products: state.products, loading: !!key && state.key !== key };
}
