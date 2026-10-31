import { PRICE_BANDS, RATING_MINS, type FacetParams } from "./facets";

/** Shop URL state, shared by the server page and its client controls. */
export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name, A–Z" },
] as const;

export type ShopParams = { category?: string; q?: string; sort?: string } & FacetParams;

/** `/products?…` for these filters, dropping empty values and the default sort. */
export function shopHref(params: ShopParams & { page?: number }): string {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "featured") sp.set("sort", params.sort);
  if (params.price) sp.set("price", params.price);
  if (params.pack) sp.set("pack", params.pack);
  if (params.rating) sp.set("rating", params.rating);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

/** Read the shop filters from the page's search params (unknown sorts/facets are ignored). */
export function parseShopParams(
  sp: Record<string, string | string[] | undefined>,
): ShopParams & { page: number } {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const sort = one("sort");
  const page = Number(one("page") ?? 1);
  const price = one("price");
  const pack = one("pack")?.toLowerCase();
  const rating = one("rating");
  return {
    category: one("category")?.toLowerCase(),
    q: one("q")?.slice(0, 80),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "featured",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    price: PRICE_BANDS.some((b) => b.value === price) ? price : undefined,
    pack: pack && /^[a-z0-9.-]{1,24}$/.test(pack) ? pack : undefined,
    rating: RATING_MINS.some((r) => r.value === rating) ? rating : undefined,
  };
}
