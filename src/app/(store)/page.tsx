import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { HeroArt } from "@/components/store/hero-art";
import {
  CategoryGrid,
  CategoryGridSkeleton,
  FeaturedProducts,
  ProductStripSkeleton,
  Promises,
  SectionHeading,
  SubscriptionBand,
} from "@/components/store/sections";

export default function StoreHome() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-12 md:px-6 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-drs-white px-3 py-1.5 text-xs font-semibold tracking-wide text-drs-green ring-1 ring-drs-green/15">
              <span aria-hidden className="size-1.5 rounded-full bg-drs-gold" />
              Farm-fresh · Delivered daily
            </p>
            <h1
              id="hero-heading"
              className="mt-5 max-w-xl text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-drs-green md:text-5xl lg:text-[3.5rem]"
            >
              Pure milk at your door, every morning.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-drs-ink/80 md:text-lg">
              Milk, curd, paneer and ghee from DRS — pasteurised at dawn, chilled all the way and delivered
              before 7&nbsp;am. Subscribe once, pause whenever.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-drs-green px-7 text-[0.9375rem] font-semibold text-drs-cream shadow-sm transition-colors hover:bg-drs-green/90"
              >
                Shop fresh
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-drs-green/30 bg-drs-white px-7 text-[0.9375rem] font-semibold text-drs-green transition-colors hover:border-drs-green"
              >
                Start a subscription
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm lg:max-w-none">
            <HeroArt className="h-auto w-full drop-shadow-xl" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 md:gap-20 md:px-6">
        <section aria-label="Why DRS">
          <Promises />
        </section>

        <section aria-labelledby="categories-heading" id="categories" className="scroll-mt-32">
          <SectionHeading
            id="categories-heading"
            eyebrow="Our range"
            title="Shop by category"
            action={{ href: "/products", label: "View all" }}
          />
          <Suspense fallback={<CategoryGridSkeleton />}>
            <CategoryGrid />
          </Suspense>
        </section>

        <section aria-labelledby="featured-heading">
          <SectionHeading
            id="featured-heading"
            eyebrow="Customer favourites"
            title="Fresh picks for you"
            action={{ href: "/products", label: "Shop all" }}
          />
          <Suspense fallback={<ProductStripSkeleton />}>
            <FeaturedProducts />
          </Suspense>
        </section>

        <SubscriptionBand />
      </div>
    </>
  );
}
