import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd, organizationLd } from "@/components/marketing/json-ld";
import { PromoBanners } from "@/components/marketing/promo-banners";
import {
  CategoryGrid,
  CategoryGridSkeleton,
  FeaturedProducts,
  ProductStripSkeleton,
  Promises,
  SectionHeading,
  SubscriptionBand,
} from "@/components/store/sections";
import { mediaUrl } from "@/lib/media";
import { buttonClass } from "@/components/ui/button";

export default function StoreHome() {
  return (
    <>
      <JsonLd data={organizationLd()} />
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
              <Link href="/products" className={buttonClass("primary", undefined, "pill")}>
                Shop fresh
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
              <Link href="/subscriptions" className={buttonClass("secondary", undefined, "pill")}>
                Start a subscription
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] shadow-xl shadow-drs-green/15 ring-1 ring-drs-ink/5 lg:max-w-none">
            <Image
              src={mediaUrl("/files/storefront-demo/hero.jpg")!}
              alt="A bottle and glass of fresh DRS milk in soft morning light"
              width={1024}
              height={1024}
              priority
              sizes="(min-width: 1024px) 36rem, 22rem"
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 md:gap-20 md:px-6">
        <section aria-label="Why DRS">
          <Promises />
        </section>

        <Suspense fallback={null}>
          <PromoBanners />
        </Suspense>

        <section
          aria-labelledby="categories-heading"
          id="categories"
          className="scroll-mt-[calc(var(--header-h)+1rem)]"
        >
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
