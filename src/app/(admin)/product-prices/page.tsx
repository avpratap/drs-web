"use client";

import { useTable } from "@refinedev/core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCatalogLookups } from "@/components/catalog/lookups";
import { PriceWindowBadge } from "@/components/catalog/price-window-badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable, Pager, type Column } from "@/components/ui/table";
import { RowLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { formatDate, inr } from "@/lib/forms";

type Price = components["schemas"]["ProductPriceOut"];

export default function ProductPriceListPage() {
  const lookups = useCatalogLookups();
  const deepLinkProduct = useSearchParams().get("product_id");
  const { result, tableQuery, currentPage, setCurrentPage, pageCount, filters, setFilters } = useTable<Price>(
    {
      resource: "product-prices",
      pagination: { pageSize: 20 },
      filters: deepLinkProduct
        ? { initial: [{ field: "product_id", operator: "eq", value: deepLinkProduct }] }
        : undefined,
      syncWithLocation: true,
    },
  );
  const productFilter = filters.find((f) => "field" in f && f.field === "product_id")?.value as
    string | undefined;

  const columns: Column<Price>[] = [
    {
      key: "product",
      header: "Product",
      cell: (r) => (
        <Link href={`/product-prices/${r.id}`} className="font-medium text-drs-green hover:underline">
          {lookups.productName(r.product_id)}
        </Link>
      ),
    },
    { key: "tier", header: "Tier", cell: (r) => lookups.tierName(r.price_tier_id), hideOnMobile: true },
    { key: "price", header: "Unit price", cell: (r) => inr.format(r.unit_price) },
    { key: "min", header: "Min qty", cell: (r) => r.min_qty, hideOnMobile: true },
    {
      key: "window",
      header: "Valid",
      cell: (r) => `${formatDate(r.valid_from)} → ${r.valid_to ? formatDate(r.valid_to) : "open"}`,
      hideOnMobile: true,
    },
    { key: "state", header: "Status", cell: (r) => <PriceWindowBadge from={r.valid_from} to={r.valid_to} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (r) => (
        <RowLink href={`/product-prices/${r.id}/edit`} srLabel={`price ${r.id}`}>
          Edit
        </RowLink>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Product prices"
        description="Unit prices per tier, with validity windows."
        actions={
          <ButtonLink href={`/product-prices/create${productFilter ? `?product_id=${productFilter}` : ""}`}>
            New price
          </ButtonLink>
        }
      />
      <div className="mb-4 max-w-md">
        <label htmlFor="price-product" className="mb-1.5 block text-sm font-medium">
          Filter by product
        </label>
        <select
          id="price-product"
          value={productFilter ?? ""}
          onChange={(e) =>
            setFilters(
              [{ field: "product_id", operator: "eq", value: e.target.value || undefined }],
              "replace",
            )
          }
          className="min-h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm"
        >
          <option value="">All products</option>
          {lookups.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        caption="Product prices"
        columns={columns}
        rows={result.data}
        rowKey={(r) => r.id}
        loading={tableQuery.isLoading}
        error={tableQuery.error?.message}
        empty="No prices set."
      />
      <Pager
        page={currentPage}
        pageCount={pageCount}
        total={result.total}
        hasNext={currentPage < pageCount}
        onPage={setCurrentPage}
      />
    </>
  );
}
