import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/lib/api/server";
import type { components } from "@/lib/api/client";

export type StoreProduct = components["schemas"]["ProductOut"];
export type Loaded<T> = { ok: true; data: T } | { ok: false };

/**
 * Public catalogue reads for the storefront, fetched on the server (no session) and cached
 * for a few minutes. A failed fetch returns `{ ok: false }` instead of throwing, so a backend
 * blip shows a calm fallback (and is retried on the next revalidation) rather than an error page.
 */
export async function getCategories(): Promise<Loaded<string[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  try {
    const { data, response } = await serverApi().GET("/api/v1/products/categories");
    return response.ok && data ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Loaded<StoreProduct[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  try {
    const { data, response } = await serverApi().GET("/api/v1/products", {
      params: { query: { sort: "rating", limit } },
    });
    return response.ok && data ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
  }
}
