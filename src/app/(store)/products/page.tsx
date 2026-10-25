import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton, pulse } from "@/components/store/sections";
import { cn } from "@/lib/utils";
import { Shop, type SearchParams } from "./shop";

export const metadata: Metadata = {
  title: "Shop fresh dairy",
  description:
    "Milk, curd, paneer, ghee and more from DRS Dairy — GST-inclusive prices, delivered before 7 am.",
  alternates: { canonical: "/products" },
};

export default function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <Suspense fallback={<ShopSkeleton />}>
        <Shop searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className={cn(pulse, "h-4 w-32")} />
      <div className={cn(pulse, "mt-4 h-9 w-56")} />
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={cn(pulse, "h-11 w-24 shrink-0 rounded-full")} />
        ))}
      </div>
      <div className={cn(pulse, "mt-4 mb-6 h-11 w-full md:w-96")} />
      <ProductGridSkeleton />
    </div>
  );
}
