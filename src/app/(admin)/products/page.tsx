"use client";

import { useTable } from "@refinedev/core";
import Link from "next/link";
import { useState } from "react";
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable, Pager, type Column } from "@/components/ui/table";
import type { components } from "@/lib/api/client";

type Product = components["schemas"]["ProductOut"];

const columns: Column<Product>[] = [
  {
    key: "name",
    header: "Product",
    cell: (p) => (
      <Link href={`/products/${p.id}`} className="font-medium text-drs-green hover:underline">
        {p.name}
        <span className="block text-xs font-normal text-drs-ink/65">{p.sku}</span>
      </Link>
    ),
  },
  {
    key: "category",
    header: "Category",
    cell: (p) => <CategoryBadge category={p.category} />,
    hideOnMobile: true,
  },
  { key: "uom", header: "UOM", cell: (p) => `${p.pack_size ?? 1} ${p.uom ?? "piece"}`, hideOnMobile: true },
  { key: "gst", header: "GST", cell: (p) => <Badge>{p.gst_rate ?? 0}%</Badge>, hideOnMobile: true },
  { key: "hsn", header: "HSN", cell: (p) => p.hsn_code ?? "—", hideOnMobile: true },
  { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (p) => (
      <Link
        href={`/products/${p.id}/edit`}
        className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-drs-green hover:underline"
      >
        Edit<span className="sr-only"> {p.name}</span>
      </Link>
    ),
  },
];

export default function ProductListPage() {
  const { result, tableQuery, currentPage, setCurrentPage, pageSize, setFilters, filters } =
    useTable<Product>({
      resource: "products",
      pagination: { pageSize: 20 },
      syncWithLocation: true,
    });
  const initialQ = filters.find((f) => "field" in f && f.field === "q")?.value as string | undefined;
  const [q, setQ] = useState(initialQ ?? "");

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue items with unit, GST and HSN details. Retired products are hidden."
        actions={<ButtonLink href="/products/create">New product</ButtonLink>}
      />
      <form
        role="search"
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters([{ field: "q", operator: "contains", value: q || undefined }], "replace");
        }}
      >
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU"
          className="min-h-11 w-full max-w-md rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-drs-green/30 bg-drs-white px-4 text-sm font-medium text-drs-green hover:border-drs-green"
        >
          Search
        </button>
      </form>
      <DataTable
        caption="Products"
        columns={columns}
        rows={result.data}
        rowKey={(p) => p.id}
        loading={tableQuery.isLoading}
        error={tableQuery.error?.message}
        empty="No products match."
      />
      <Pager
        page={currentPage}
        hasNext={(result.total ?? 0) > currentPage * pageSize}
        onPage={setCurrentPage}
      />
    </>
  );
}
