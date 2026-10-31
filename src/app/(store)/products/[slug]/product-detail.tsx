import { LeafIcon, RepeatIcon, SnowflakeIcon, StarIcon } from "lucide-react";
import { JsonLd, productLd } from "@/components/marketing/json-ld";
import { ProductImage } from "@/components/store/product-image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { WishlistButton } from "@/components/store/engagement";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { Unavailable } from "@/components/store/sections";
import { cn } from "@/lib/utils";
import { getProductFull } from "@/modules/store/catalog";
import { categoryHref, categoryMeta, productIdFromSlug, productSlug } from "@/modules/store/categories";
import { packOptions } from "@/modules/store/packs";
import { Reviews, ReviewsSkeleton } from "./reviews";

export async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = productIdFromSlug(slug);
  if (id == null) notFound();
  const res = await getProductFull(id);
  if (!res.ok) return <Unavailable what="this product" />;
  const p = res.data;
  if (!p) notFound();
  // One URL per product: /products/12 or an old name redirects to the current slug.
  if (slug !== productSlug(p)) permanentRedirect(`/products/${productSlug(p)}`);

  const meta = categoryMeta(p.category ?? "");
  const Icon = meta.icon;
  const options = packOptions(p);
  const ld = productLd({
    ...p,
    path: `/products/${productSlug(p)}`,
    packs: options.map((o) => ({ label: o.label, price: o.price })),
  });

  return (
    <>
      <JsonLd data={ld} />
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
            <Link
              href="/products"
              className="-mx-2.5 -my-3 inline-block px-2.5 py-3 hover:text-drs-green hover:underline"
            >
              Shop
            </Link>
          </li>
          {p.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={categoryHref(meta.slug)}
                  className="-mx-2.5 -my-3 inline-block px-2.5 py-3 hover:text-drs-green hover:underline"
                >
                  {meta.label}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="min-w-0 truncate text-drs-ink">
            {p.name}
          </li>
        </ol>
      </nav>

      <div className="mt-5 grid gap-8 md:mt-8 lg:grid-cols-2 lg:gap-14">
        <div
          className={cn(
            "relative grid aspect-square place-items-center overflow-hidden rounded-3xl border border-drs-ink/5 lg:sticky lg:top-28 lg:self-start",
            meta.milkLine ? "bg-drs-sky/15" : "bg-drs-white",
          )}
        >
          <ProductImage
            src={p.image_url}
            alt={p.name}
            priority
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="object-cover"
            fallback={
              <span
                aria-hidden
                className="grid size-40 place-items-center rounded-full bg-drs-cream shadow-sm md:size-52"
              >
                <Icon className="size-20 text-drs-green md:size-24" strokeWidth={1.25} />
              </span>
            }
          />
          {p.is_subscribable && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-drs-white/95 px-3 py-1.5 text-xs font-semibold text-drs-green shadow-sm">
              <RepeatIcon aria-hidden className="size-3.5" strokeWidth={2.25} />
              Available on subscription
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-semibold tracking-[0.18em] text-drs-ink/70 uppercase">{meta.label}</p>
          <h1 className="mt-2 text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:text-[2.5rem]">
            {p.name}
          </h1>
          {p.rating_count > 0 && (
            <a
              href="#reviews"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-drs-ink hover:underline"
            >
              <StarIcon aria-hidden className="size-4 fill-drs-gold text-drs-gold" />
              <span className="font-semibold">{p.avg_rating.toFixed(1)}</span>
              <span className="text-drs-ink/75">
                · {p.rating_count} review{p.rating_count === 1 ? "" : "s"}
              </span>
            </a>
          )}
          <WishlistButton productId={p.id} productName={p.name} variant="full" className="mt-3 self-start" />
          <div aria-hidden className="mt-4 mb-6 h-0.5 w-10 rounded bg-drs-gold" />

          <PurchasePanel productId={p.id} options={options} />

          <ul className="mt-8 grid gap-3 border-t border-drs-ink/10 pt-6 text-sm text-drs-ink/85 sm:grid-cols-2">
            {p.perishable && (
              <li className="flex items-center gap-2.5">
                <SnowflakeIcon aria-hidden className="size-4 shrink-0 text-drs-green" />
                Keep refrigerated · delivered chilled
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <LeafIcon aria-hidden className="size-4 shrink-0 text-drs-green" />
              No preservatives, lab-tested every batch
            </li>
            {p.is_subscribable && (
              <li className="flex items-center gap-2.5">
                <RepeatIcon aria-hidden className="size-4 shrink-0 text-drs-green" />
                Subscribe for daily morning delivery
              </li>
            )}
          </ul>

          {p.description && (
            <section aria-labelledby="about-heading" className="mt-8">
              <h2 id="about-heading" className="text-lg font-semibold text-drs-ink">
                About this product
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed whitespace-pre-line text-drs-ink/85">
                {p.description}
              </p>
            </section>
          )}
        </div>
      </div>

      <section id="reviews" aria-labelledby="reviews-heading" className="mt-14 scroll-mt-28 md:mt-20">
        <h2 id="reviews-heading" className="text-2xl font-semibold text-drs-green md:text-[2rem]">
          Ratings &amp; reviews
        </h2>
        <div aria-hidden className="mt-3 mb-6 h-0.5 w-10 rounded bg-drs-gold" />
        <Suspense fallback={<ReviewsSkeleton />}>
          <Reviews productId={p.id} />
        </Suspense>
      </section>
    </>
  );
}
