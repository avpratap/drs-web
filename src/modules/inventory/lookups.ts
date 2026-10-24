"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { Option } from "@/components/resource/fields";
import type { components } from "@/lib/api/client";

type S = components["schemas"];

/** Products / locations / suppliers for pickers and for naming ids in tables. */
export function useInventoryLookups({ suppliers = false }: { suppliers?: boolean } = {}) {
  const products = useList<S["ProductOut"]>({
    resource: "products",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "eq", value: "active" }],
  });
  const locations = useList<S["LocationOut"]>({ resource: "locations", pagination: { mode: "off" } });
  const sup = useList<S["SupplierOut"]>({
    resource: "suppliers",
    pagination: { mode: "off" },
    queryOptions: { enabled: suppliers },
  });
  return useMemo(() => {
    const p = products.result.data;
    const l = locations.result.data;
    const s = sup.result.data;
    return {
      productOptions: p.map((x): Option => ({ value: x.id, label: `${x.name} (${x.sku})` })),
      locationOptions: l
        .filter((x) => x.status === "active")
        .map((x): Option => ({ value: x.id, label: `${x.name}${x.is_default ? " (default)" : ""}` })),
      supplierOptions: s
        .filter((x) => x.status === "active")
        .map((x): Option => ({ value: x.id, label: x.name })),
      productName: (id: number) => p.find((x) => x.id === id)?.name ?? `Product #${id}`,
      productUom: (id: number) => p.find((x) => x.id === id)?.uom ?? "",
      locationName: (id: number | null | undefined) =>
        id == null ? "Default" : (l.find((x) => x.id === id)?.name ?? `Location #${id}`),
      supplierName: (id: number) => s.find((x) => x.id === id)?.name ?? `Supplier #${id}`,
      loading: products.query.isLoading || locations.query.isLoading,
    };
  }, [
    products.result.data,
    locations.result.data,
    sup.result.data,
    products.query.isLoading,
    locations.query.isLoading,
  ]);
}
