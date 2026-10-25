import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pulse } from "@/components/store/sections";
import { cn } from "@/lib/utils";
import { getProductFull } from "@/modules/store/catalog";
import { productIdFromSlug, productHref } from "@/modules/store/categories";
import { ProductDetail } from "./product-detail";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = productIdFromSlug((await params).slug);
  if (id == null) notFound();
  const res = await getProductFull(id);
  if (res.ok && res.data === null) notFound();
  if (!res.ok) return { title: "Product" };
  const p = res.data!;
  const description =
    p.description?.slice(0, 160) ?? `${p.name} from DRS Dairy — farm-fresh and delivered before 7 am.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: productHref(p) },
    openGraph: { title: p.name, description, images: p.image_url ? [p.image_url] : undefined },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <div className={cn(pulse, "h-4 w-48")} />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={cn(pulse, "aspect-square rounded-3xl")} />
        <div className="space-y-4">
          <div className={cn(pulse, "h-3 w-20")} />
          <div className={cn(pulse, "h-9 w-3/4")} />
          <div className={cn(pulse, "h-4 w-40")} />
          <div className={cn(pulse, "h-9 w-32")} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn(pulse, "h-16 rounded-xl")} />
            ))}
          </div>
          <div className={cn(pulse, "h-12 rounded-full")} />
        </div>
      </div>
    </div>
  );
}
