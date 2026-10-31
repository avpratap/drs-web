import { packLabel } from "@/components/store/product-card";

/**
 * Shop facets applied on the web server over the (small) filtered catalogue: price bands on
 * the "from" price, the product's pack size as shown on its card, and a minimum rating. The
 * backend list has no such filters; category, search and sort still run there.
 */
type Facetable = {
  id: number;
  from_price?: number | null;
  pack_size: number;
  uom: string;
  avg_rating: number;
  rating_count: number;
};

export const PRICE_BANDS = [
  { value: "under-50", label: "Under ₹50", min: 0, max: 50 },
  { value: "50-100", label: "₹50–100", min: 50, max: 100 },
  { value: "100-250", label: "₹100–250", min: 100, max: 250 },
  { value: "250-plus", label: "₹250 and above", min: 250, max: Infinity },
] as const;

export const RATING_MINS = [
  { value: "4", label: "4★ & up", min: 4 },
  { value: "3", label: "3★ & up", min: 3 },
] as const;

export type FacetParams = { price?: string; pack?: string; rating?: string };

/** "500 ml" → "500-ml": the URL value of a pack-size option. */
export const packSlug = (p: Pick<Facetable, "pack_size" | "uom">) =>
  packLabel(p.pack_size, p.uom)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-");

const matchPrice = (p: Facetable, v?: string) => {
  if (!v) return true;
  const band = PRICE_BANDS.find((b) => b.value === v);
  if (!band) return true;
  return p.from_price != null && p.from_price >= band.min && p.from_price < band.max;
};
const matchPack = (p: Facetable, v?: string) => !v || packSlug(p) === v;
const matchRating = (p: Facetable, v?: string) => {
  const r = RATING_MINS.find((x) => x.value === v);
  return !r || (p.rating_count > 0 && p.avg_rating >= r.min);
};

export function applyFacets<T extends Facetable>(items: readonly T[], f: FacetParams): T[] {
  return items.filter((p) => matchPrice(p, f.price) && matchPack(p, f.pack) && matchRating(p, f.rating));
}

export type FacetOption = { value: string; label: string; count: number };

/**
 * The options for each facet with how many products each would show, counting against the
 * *other* active facets (so choosing a price never zeroes the price list itself). Options
 * with no products are dropped, except the active one (so it can still be cleared).
 */
export function facetOptions<T extends Facetable>(items: readonly T[], f: FacetParams) {
  const keep = (o: FacetOption, active?: string) => o.count > 0 || o.value === active;
  const forPrice = applyFacets(items, { ...f, price: undefined });
  const forPack = applyFacets(items, { ...f, pack: undefined });
  const forRating = applyFacets(items, { ...f, rating: undefined });
  const packs = new Map<string, { label: string; size: number; count: number }>();
  for (const p of forPack) {
    const slug = packSlug(p);
    const e = packs.get(slug) ?? { label: packLabel(p.pack_size, p.uom), size: p.pack_size, count: 0 };
    e.count += 1;
    packs.set(slug, e);
  }
  return {
    price: PRICE_BANDS.map((b) => ({
      value: b.value,
      label: b.label,
      count: forPrice.filter((p) => matchPrice(p, b.value)).length,
    })).filter((o) => keep(o, f.price)),
    pack: [...packs.entries()]
      .sort((a, b) => a[1].label.localeCompare(b[1].label, "en", { numeric: true }))
      .map(([value, e]) => ({ value, label: e.label, count: e.count }))
      .filter((o) => keep(o, f.pack)),
    rating: RATING_MINS.map((r) => ({
      value: r.value,
      label: r.label,
      count: forRating.filter((p) => matchRating(p, r.value)).length,
    })).filter((o) => keep(o, f.rating)),
  };
}

/**
 * Numbered pagination: always the first and last page, the current one ±1, and "gap"
 * markers between runs — e.g. 1 … 4 5 6 … 12.
 */
export function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const want = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(n - sorted[i - 1] === 2 ? n - 1 : "gap");
    out.push(n);
  });
  return out;
}

export function paginate<T>(items: readonly T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * size, current * size),
    page: current,
    pages,
    total: items.length,
  };
}
