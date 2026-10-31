"use client";

import { HeartIcon } from "lucide-react";
import { useEngagement } from "./engagement";
import { ProductCard } from "./product-card";
import { PanelSkeleton } from "./use-load";
import { useProducts } from "./use-products";
import { EmptyState } from "./empty-state";

/** Saved products as shop cards; the heart on each card removes it. */
export function WishlistView() {
  const { wishlist, wishlistReady } = useEngagement();
  const ids = [...wishlist];
  const { products, loading } = useProducts(ids);

  if (!wishlistReady || loading) return <PanelSkeleton rows={2} label="Loading your wishlist" />;
  if (ids.length === 0)
    return (
      <EmptyState
        as="h2"
        icon={HeartIcon}
        tone="maroon"
        title="Nothing saved yet"
        body="Tap the heart on any product to keep it here for later."
        action={{ href: "/products", label: "Browse products" }}
      />
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
