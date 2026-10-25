"use client";

import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { useEngagement } from "./engagement";
import { ProductCard } from "./product-card";
import { PanelSkeleton } from "./use-load";
import { useProducts } from "./use-products";

/** Saved products as shop cards; the heart on each card removes it. */
export function WishlistView() {
  const { wishlist, wishlistReady } = useEngagement();
  const ids = [...wishlist];
  const { products, loading } = useProducts(ids);

  if (!wishlistReady || loading) return <PanelSkeleton rows={2} label="Loading your wishlist" />;
  if (ids.length === 0)
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-14 text-center">
        <HeartIcon aria-hidden className="size-10 text-drs-maroon" strokeWidth={1.5} />
        <h2 className="mt-4 text-xl font-semibold text-drs-ink">Nothing saved yet</h2>
        <p className="mt-1 max-w-sm text-sm text-drs-ink/75">
          Tap the heart on any product to keep it here for later.
        </p>
        <Link href="/products" className={buttonClass("primary", "mt-6 rounded-full px-6")}>
          Browse products
        </Link>
      </div>
    );
  const items = ids.map((id) => products.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <ul aria-label="Saved products" className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-3">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} className="h-full" />
        </li>
      ))}
    </ul>
  );
}
