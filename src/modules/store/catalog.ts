import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/lib/api/server";
import type { components } from "@/lib/api/client";

export type StoreProduct = components["schemas"]["ProductOut"];
export type StoreProductFull = components["schemas"]["ProductFullOut"];
export type StoreVariant = components["schemas"]["VariantOut"];
export type StoreRatings = components["schemas"]["ProductRatingsOut"];
export type Loaded<T> = { ok: true; data: T } | { ok: false };

/**
 * The `{ ok: false }` of a failed read inside a `"use cache"` function. cacheLife keeps the
 * shortest profile set during the call, so this cuts the entry from "minutes" to a 1-second
 * revalidate: the next request after a backend blip refetches in the background instead of
 * serving the cached error for minutes. `expire` stays at Next's 5-minute prerenderable
 * minimum, so a build that runs while the backend is down still succeeds (and the static page
 * regenerates as soon as the backend is back) rather than failing as an uncached dynamic read.
 */
export function failed(): { ok: false } {
  cacheLife({ stale: 30, revalidate: 1, expire: 300 });
  return { ok: false };
}

/**
 * Public catalogue reads for the storefront, fetched on the server (no session) and cached
 * for a few minutes. A failed fetch returns `failed()` instead of throwing, so a backend blip
 * shows a calm fallback (and is retried on the next request) rather than an error page.
 */
export async function getCategories(): Promise<Loaded<string[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  try {
    const { data, response } = await serverApi().GET("/api/v1/products/categories");
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
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
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}

/** Everything available on a daily subscription (the backend has no filter for it). */
export async function getSubscribableProducts(): Promise<Loaded<StoreProduct[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  try {
    const { data, response } = await serverApi().GET("/api/v1/products", {
      params: { query: { limit: 100 } },
    });
    return response.ok && data ? { ok: true, data: data.filter((p) => p.is_subscribable) } : failed();
  } catch {
    return failed();
  }
}

export const PAGE_SIZE = 24;
/** The backend's page cap; the storefront catalogue is far smaller, so one read covers it. */
const CATALOGUE_LIMIT = 200;

/** Backend sorts: rating | newest | name; "featured" (or none) is the catalogue order. */
export type ProductQuery = { category?: string; q?: string; sort?: string };

/**
 * Every product matching the category/search, in the chosen order (one cached read). Price,
 * pack-size and rating facets and the page numbers are applied over it on the web server
 * (modules/store/facets), since the backend list has no such filters.
 */
export async function getCatalogue(query: ProductQuery): Promise<Loaded<StoreProduct[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  try {
    const { data, response } = await serverApi().GET("/api/v1/products", {
      params: {
        query: {
          category: query.category || undefined,
          q: query.q || undefined,
          sort: query.sort && query.sort !== "featured" ? query.sort : undefined,
          limit: CATALOGUE_LIMIT,
        },
      },
    });
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}

/** Product + its priced pack variants; `null` data when the product doesn't exist (or is retired). */
export async function getProductFull(id: number): Promise<Loaded<StoreProductFull | null>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `product-${id}`);
  try {
    const { data, response } = await serverApi().GET("/api/v1/products/{product_id}/full", {
      params: { path: { product_id: id } },
    });
    if (response.status === 404) return { ok: true, data: null };
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}

export async function getProductRatings(id: number): Promise<Loaded<StoreRatings>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `product-${id}`);
  try {
    const { data, response } = await serverApi().GET("/api/v1/products/{product_id}/ratings", {
      params: { path: { product_id: id }, query: { limit: 6 } },
    });
    return response.ok && data ? { ok: true, data } : failed();
  } catch {
    return failed();
  }
}
