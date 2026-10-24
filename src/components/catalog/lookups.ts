"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { components } from "@/lib/api/client";

type Product = components["schemas"]["ProductOut"];
type Tier = components["schemas"]["PriceTierOut"];

/** Products + price tiers for pickers and for labelling id columns. */
export function useCatalogLookups() {
  const products = useList<Product>({ resource: "products", pagination: { currentPage: 1, pageSize: 199 } });
  const tiers = useList<Tier>({ resource: "price-tiers", pagination: { mode: "off" } });
  return useMemo(
    () => ({
      products: products.result.data,
      tiers: tiers.result.data,
      productName: (id: number) => products.result.data.find((p) => p.id === id)?.name ?? `#${id}`,
      tierName: (id: number) => tiers.result.data.find((t) => t.id === id)?.name ?? `#${id}`,
      loading: products.query.isLoading || tiers.query.isLoading,
    }),
    [products.result.data, tiers.result.data, products.query.isLoading, tiers.query.isLoading],
  );
}
