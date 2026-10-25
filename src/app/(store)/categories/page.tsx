import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/store/sections";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse DRS Dairy by category: milk, buttermilk, curd, paneer, ghee and sweets.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <nav aria-label="Breadcrumb" className="text-sm text-drs-ink/75">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-drs-green hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">Categories</li>
        </ol>
      </nav>
      <header className="mt-3 mb-8 flex flex-col gap-3 md:mt-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:text-4xl">
            Shop by category
          </h1>
          <p className="mt-1 text-sm text-drs-ink/75 md:text-base">
            Everything from our dairy, fresh from the morning&apos;s milk.
          </p>
          <div aria-hidden className="mt-3 h-0.5 w-10 rounded bg-drs-gold" />
        </div>
        <Link
          href="/products"
          className="group inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-drs-green hover:underline md:self-auto"
        >
          See every product
          <ArrowRightIcon aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>
    </div>
  );
}
