import { ChevronLeftIcon, ChevronRightIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Unavailable } from "@/components/store/sections";
import { ShopSearch, SortSelect } from "@/components/store/shop-controls";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCategories, getProducts } from "@/modules/store/catalog";
import { categoryMeta } from "@/modules/store/categories";
import { parseShopParams, shopHref } from "@/modules/store/shop";

export type SearchParams = Record<string, string | string[] | undefined>;

const chip =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors";

/** Shop grid: category chips, name search and sort over the public catalogue (SSR, cached). */
export async function Shop({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseShopParams(await searchParams);
  const [categories, products] = await Promise.all([getCategories(), getProducts(params)]);
  const active = params.category ? categoryMeta(params.category) : null;
  const title = active ? active.label : "Shop all";
  const filters = { category: params.category, q: params.q, sort: params.sort };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-drs-ink/75">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-drs-green hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            {active ? (
              <Link href="/products" className="hover:text-drs-green hover:underline">
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

      {!products.ok ? (
        <Unavailable what="products" />
      ) : products.data.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/60 px-6 py-14 text-center">
          <SearchXIcon aria-hidden className="size-8 text-drs-green" strokeWidth={1.5} />
          <h2 className="mt-3 text-lg font-semibold text-drs-ink">No products found</h2>
          <p className="mt-1 max-w-sm text-sm text-drs-ink/75">
            {params.q
              ? `Nothing matches “${params.q}”${active ? ` in ${active.label}` : ""}. Try another word.`
              : "Nothing here yet — fresh batches are on their way."}
          </p>
          <Link href="/products" className={buttonClass("secondary", "mt-5")}>
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">
            {products.data.items.length} products{params.q ? ` matching ${params.q}` : ""}
          </p>
          <ul
            aria-label={`${title} products`}
            className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4"
          >
            {products.data.items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} className="h-full" />
              </li>
            ))}
          </ul>
          {(params.page > 1 || products.data.more) && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
              {params.page > 1 && (
                <Link
                  href={shopHref({ ...filters, page: params.page - 1 })}
                  className={buttonClass("secondary")}
                  rel="prev"
                >
                  <ChevronLeftIcon aria-hidden className="size-4" /> Previous
                </Link>
              )}
              <span className="text-sm text-drs-ink/75">Page {params.page}</span>
              {products.data.more && (
                <Link
                  href={shopHref({ ...filters, page: params.page + 1 })}
                  className={buttonClass("secondary")}
                  rel="next"
                >
                  Next <ChevronRightIcon aria-hidden className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
