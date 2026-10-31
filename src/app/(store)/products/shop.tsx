import { ChevronLeftIcon, ChevronRightIcon, SearchXIcon, SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Unavailable } from "@/components/store/sections";
import { ShopSearch, SortSelect } from "@/components/store/shop-controls";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCatalogue, getCategories, PAGE_SIZE } from "@/modules/store/catalog";
import { categoryMeta } from "@/modules/store/categories";
import { applyFacets, facetOptions, pageList, paginate, type FacetOption } from "@/modules/store/facets";
import { parseShopParams, shopHref, type ShopParams } from "@/modules/store/shop";

export type SearchParams = Record<string, string | string[] | undefined>;

const chip =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors";

const FACETS = [
  { key: "price", legend: "Price" },
  { key: "pack", legend: "Pack size" },
  { key: "rating", legend: "Rating" },
] as const;

/** Price / pack-size / rating chips: links (no JS needed), the chosen one toggles off. */
function Facets({
  filters,
  options,
}: {
  filters: ShopParams;
  options: Record<(typeof FACETS)[number]["key"], FacetOption[]>;
}) {
  const activeCount = FACETS.filter((f) => filters[f.key]).length;
  const groups = FACETS.filter((f) => options[f.key].length > 0);
  if (!groups.length) return null;
  const body = (
    <div className="mt-3 grid grid-cols-1 gap-4 md:mt-0 md:flex md:flex-wrap md:gap-x-8">
      {groups.map(({ key, legend }) => (
        <div key={key} role="group" aria-labelledby={`facet-${key}`} className="min-w-0">
          <p
            id={`facet-${key}`}
            className="mb-1.5 text-xs font-semibold tracking-[0.16em] text-drs-ink/70 uppercase"
          >
            {legend}
          </p>
          <ul className="flex flex-wrap gap-2">
            {options[key].map((o) => {
              const on = filters[key] === o.value;
              return (
                <li key={o.value}>
                  <Link
                    href={shopHref({ ...filters, [key]: on ? undefined : o.value })}
                    aria-current={on ? "true" : undefined}
                    scroll={false}
                    className={cn(
                      chip,
                      "gap-1.5",
                      on
                        ? "border-drs-green bg-drs-green text-drs-cream"
                        : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
                    )}
                  >
                    {o.label}
                    <span className={cn("tabular-nums", on ? "text-drs-cream/85" : "text-drs-ink/70")}>
                      ({o.count})
                    </span>
                    {on && <span className="sr-only">, selected — remove filter</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {activeCount > 0 && (
        <Link
          href={shopHref({ category: filters.category, q: filters.q, sort: filters.sort })}
          scroll={false}
          className="inline-flex min-h-11 items-center self-end text-sm font-semibold text-drs-green hover:underline"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
  return (
    <section aria-label="Filters" className="mb-6">
      {/* Phones: collapsed behind a toggle; from md the chips are always shown. */}
      <details className="group md:hidden" open={activeCount > 0}>
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-drs-ink/15 bg-drs-white px-4 text-sm font-medium text-drs-ink [&::-webkit-details-marker]:hidden">
          <SlidersHorizontalIcon aria-hidden className="size-4 text-drs-green" />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </summary>
        {body}
      </details>
      <div className="hidden md:block">{body}</div>
    </section>
  );
}

/** Numbered pages with Previous/Next; long runs collapse to "…". */
function Pagination({ filters, page, pages }: { filters: ShopParams; page: number; pages: number }) {
  if (pages <= 1) return null;
  const item = "inline-grid min-h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 && (
          <li>
            <Link
              href={shopHref({ ...filters, page: page - 1 })}
              rel="prev"
              className={buttonClass("secondary", "rounded-full")}
            >
              <ChevronLeftIcon aria-hidden className="size-4" />{" "}
              <span className="max-sm:sr-only">Previous</span>
            </Link>
          </li>
        )}
        {pageList(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className={cn(item, "text-drs-ink/70")}>
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={shopHref({ ...filters, page: n })}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={cn(
                  item,
                  n === page
                    ? "bg-drs-green text-drs-cream"
                    : "border border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
                )}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        {page < pages && (
          <li>
            <Link
              href={shopHref({ ...filters, page: page + 1 })}
              rel="next"
              className={buttonClass("secondary", "rounded-full")}
            >
              <span className="max-sm:sr-only">Next</span> <ChevronRightIcon aria-hidden className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

/** Shop grid: category chips, search, sort, facets and numbered pages over the public catalogue (SSR, cached). */
export async function Shop({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseShopParams(await searchParams);
  const [categories, catalogue] = await Promise.all([getCategories(), getCatalogue(params)]);
  const active = params.category ? categoryMeta(params.category) : null;
  const title = active ? active.label : "Shop all";
  const filters: ShopParams = {
    category: params.category,
    q: params.q,
    sort: params.sort,
    price: params.price,
    pack: params.pack,
    rating: params.rating,
  };
  const products = catalogue.ok
    ? {
        ok: true as const,
        options: facetOptions(catalogue.data, filters),
        data: paginate(applyFacets(catalogue.data, filters), params.page, PAGE_SIZE),
      }
    : catalogue;

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-drs-ink/75">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="-mx-2.5 -my-3 inline-block px-2.5 py-3 hover:text-drs-green hover:underline"
            >
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            {active ? (
              <Link
                href="/products"
                className="-mx-2.5 -my-3 inline-block px-2.5 py-3 hover:text-drs-green hover:underline"
              >
                Shop
              </Link>
            ) : (
              <span aria-current="page">Shop</span>
            )}
          </li>
          {active && (
            <>
              <li aria-hidden>/</li>
              <li aria-current="page">{active.label}</li>
            </>
          )}
        </ol>
      </nav>

      <header className="mt-3 flex flex-col gap-1 md:mt-4">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-drs-ink/75 md:text-base">
          {active ? active.blurb : "Farm-fresh dairy, delivered before 7 am."} All prices include GST.
        </p>
      </header>

      {categories.ok && categories.data.length > 0 && (
        <nav aria-label="Categories" className="mt-6">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            <li>
              <Link
                href={shopHref({ ...filters, category: undefined })}
                aria-current={!active ? "page" : undefined}
                className={cn(
                  chip,
                  !active
                    ? "border-drs-green bg-drs-green text-drs-cream"
                    : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
                )}
              >
                All
              </Link>
            </li>
            {categories.data.map((slug) => {
              const m = categoryMeta(slug);
              const on = active?.slug === m.slug;
              return (
                <li key={m.slug}>
                  <Link
                    href={shopHref({ ...filters, category: m.slug })}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      chip,
                      on
                        ? "border-drs-green bg-drs-green text-drs-cream"
                        : "border-drs-ink/15 bg-drs-white text-drs-ink hover:border-drs-green/50",
                    )}
                  >
                    {m.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="mt-4 mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ShopSearch params={filters} className="md:w-96" />
        <SortSelect params={filters} />
      </div>

      {products.ok && <Facets filters={filters} options={products.options} />}

      {!products.ok ? (
        <Unavailable what="products" />
      ) : products.data.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/60 px-6 py-14 text-center">
          <SearchXIcon aria-hidden className="size-8 text-drs-green" strokeWidth={1.5} />
          <h2 className="mt-3 text-lg font-semibold text-drs-ink">No products found</h2>
          <p className="mt-1 max-w-sm text-sm text-drs-ink/75">
            {params.price || params.pack || params.rating
              ? "No products match these filters. Try removing one."
              : params.q
                ? `Nothing matches “${params.q}”${active ? ` in ${active.label}` : ""}. Try another word.`
                : "Nothing here yet — fresh batches are on their way."}
          </p>
          <Link href="/products" className={buttonClass("secondary", "mt-5")}>
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-drs-ink/75" role="status">
            {products.data.total} {products.data.total === 1 ? "product" : "products"}
            {params.q ? ` matching “${params.q}”` : ""}
            {products.data.pages > 1 ? ` · page ${products.data.page} of ${products.data.pages}` : ""}
          </p>
          <ul
            aria-label={`${title} products`}
            className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))] md:gap-5 lg:grid-cols-[repeat(4,minmax(0,1fr))]"
          >
            {products.data.items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} className="h-full" />
              </li>
            ))}
          </ul>
          <Pagination filters={filters} page={products.data.page} pages={products.data.pages} />
        </>
      )}
    </>
  );
}
