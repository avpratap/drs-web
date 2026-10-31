import { describe, expect, it } from "vitest";
import { productLd } from "@/components/marketing/json-ld";
import { consentCookie, readConsent } from "@/modules/store/consent";
import { applyFacets, facetOptions, packSlug, pageList, paginate } from "@/modules/store/facets";
import { parseShopParams, shopHref } from "@/modules/store/shop";

const p = (
  id: number,
  from_price: number | null,
  pack_size: number,
  uom: string,
  avg_rating = 0,
  rating_count = 0,
) => ({
  id,
  from_price,
  pack_size,
  uom,
  avg_rating,
  rating_count,
});
const items = [
  p(1, 33, 500, "ml", 4.6, 120),
  p(2, 15, 200, "ml", 4.4, 40),
  p(3, 899, 1, "litre", 4.9, 210),
  p(4, 60, 500, "ml", 3.2, 5),
  p(5, null, 400, "g"),
];

describe("shop facets", () => {
  it("filters by price band, pack size and minimum rating together", () => {
    expect(applyFacets(items, { price: "under-50" }).map((x) => x.id)).toEqual([1, 2]);
    expect(applyFacets(items, { pack: "500-ml" }).map((x) => x.id)).toEqual([1, 4]);
    expect(applyFacets(items, { rating: "4" }).map((x) => x.id)).toEqual([1, 2, 3]);
    expect(applyFacets(items, { price: "50-100", pack: "500-ml" }).map((x) => x.id)).toEqual([4]);
    // Unpriced and unrated products never match a price band or rating.
    expect(applyFacets(items, { price: "250-plus" }).map((x) => x.id)).toEqual([3]);
    expect(packSlug({ pack_size: 1, uom: "litre" })).toBe("1-l");
  });

  it("counts each option against the other active facets and hides empty ones", () => {
    const o = facetOptions(items, { pack: "500-ml" });
    expect(o.price).toEqual([
      { value: "under-50", label: "Under ₹50", count: 1 },
      { value: "50-100", label: "₹50–100", count: 1 },
    ]);
    // The pack list itself ignores the active pack, so another pack can be picked.
    expect(o.pack.map((x) => [x.value, x.count])).toEqual([
      ["1-l", 1],
      ["200-ml", 1],
      ["400-g", 1],
      ["500-ml", 2],
    ]);
    expect(o.rating.map((x) => [x.value, x.count])).toEqual([
      ["4", 1],
      ["3", 2],
    ]);
  });

  it("round-trips facets through the URL and drops unknown values", () => {
    const parsed = parseShopParams({ price: "50-100", pack: "500-ML", rating: "4", sort: "rating" });
    expect(parsed).toMatchObject({ price: "50-100", pack: "500-ml", rating: "4" });
    expect(shopHref({ ...parsed, page: 2 })).toBe(
      "/products?sort=rating&price=50-100&pack=500-ml&rating=4&page=2",
    );
    expect(parseShopParams({ price: "free", rating: "5", pack: "<script>" })).toMatchObject({
      price: undefined,
      rating: undefined,
      pack: undefined,
    });
  });
});

describe("numbered pagination", () => {
  it("lists every page when there are few, and collapses long runs", () => {
    expect(pageList(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageList(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageList(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageList(3, 12)).toEqual([1, 2, 3, 4, "gap", 12]);
    expect(pageList(12, 12)).toEqual([1, "gap", 11, 12]);
  });

  it("clamps the page and reports totals", () => {
    const r = paginate(
      Array.from({ length: 50 }, (_, i) => i),
      9,
      24,
    );
    expect(r).toMatchObject({ page: 3, pages: 3, total: 50 });
    expect(r.items).toEqual([48, 49]);
    expect(paginate([], 1, 24)).toMatchObject({ page: 1, pages: 1, total: 0 });
  });
});

describe("cookie consent", () => {
  it("reads and writes the first-party choice", () => {
    expect(readConsent("a=1; drs_consent=essential; b=2")).toBe("essential");
    expect(readConsent("drs_consent=maybe")).toBeNull();
    expect(readConsent("")).toBeNull();
    expect(consentCookie("all", true)).toBe(
      "drs_consent=all; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
    );
  });
});

describe("product JSON-LD", () => {
  const base = {
    name: "Full Cream Milk",
    sku: "MILK-FC-500",
    image_url: "https://media.example/milk.jpg",
    avg_rating: 4.6,
    rating_count: 120,
    path: "/products/1-full-cream-milk",
  };
  it("is a Product with an AggregateOffer over its priced packs and an AggregateRating", () => {
    const ld = productLd({
      ...base,
      packs: [
        { label: "500 ml", price: 33 },
        { label: "1 L", price: 64 },
        { label: "5 L", price: null },
      ],
    }) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(ld["@type"]).toBe("Product");
    expect(ld.image).toEqual(["https://media.example/milk.jpg"]);
    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "33.00",
      highPrice: "64.00",
      offerCount: 2,
    });
    expect(ld.aggregateRating).toMatchObject({ ratingValue: "4.6", reviewCount: 120 });
    expect(ld.url).toMatch(/\/products\/1-full-cream-milk$/);
  });
  it("uses a single Offer, and omits offers/rating when there are none", () => {
    const one = productLd({ ...base, packs: [{ label: "500 ml", price: 33 }] }) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(one.offers).toMatchObject({ "@type": "Offer", price: "33.00", priceCurrency: "INR" });
    const none = productLd({ ...base, rating_count: 0, packs: [{ label: "500 ml", price: null }] });
    expect(none).not.toHaveProperty("offers");
    expect(none).not.toHaveProperty("aggregateRating");
  });
});
