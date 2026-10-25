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

export const PAGE_SIZE = 24;

/** Backend sorts: rating | newest | name; "featured" (or none) is the catalogue order. */
export type ProductQuery = { category?: string; q?: string; sort?: string; page?: number };

/** One page of the shop grid (plus one extra row to know whether a next page exists). */
export async function getProducts(
  query: ProductQuery,
): Promise<Loaded<{ items: StoreProduct[]; more: boolean }>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const page = Math.max(1, query.page ?? 1);
  try {
    const { data, response } = await serverApi().GET("/api/v1/products", {
      params: {
        query: {
          category: query.category || undefined,
          q: query.q || undefined,
          sort: query.sort && query.sort !== "featured" ? query.sort : undefined,
          limit: PAGE_SIZE + 1,
          offset: (page - 1) * PAGE_SIZE,
        },
      },
    });
    if (!response.ok || !data) return { ok: false };
    return { ok: true, data: { items: data.slice(0, PAGE_SIZE), more: data.length > PAGE_SIZE } };
  } catch {
    return { ok: false };
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
    return response.ok && data ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
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
    return response.ok && data ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
  }
}
