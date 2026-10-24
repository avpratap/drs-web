"use client";

import { useTable } from "@refinedev/core";
import Link from "next/link";
import { useState } from "react";
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable, Pager, type Column } from "@/components/ui/table";
import { RowLink } from "@/components/ui/links";
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
      <RowLink href={`/products/${p.id}/edit`} srLabel={p.name}>
        Edit
      </RowLink>
    ),
  },
];

export default function ProductListPage() {
  const { result, tableQuery, currentPage, setCurrentPage, pageCount, setFilters, filters } =
    useTable<Product>({
      resource: "products",
      pagination: { pageSize: 20 },
      syncWithLocation: true,
    });
  const value = (field: string) =>
    filters.find((f) => "field" in f && f.field === field)?.value as string | undefined;
  const [q, setQ] = useState(value("q") ?? "");
  const setFilter = (field: string, v: string | undefined) =>
    setFilters((prev) => [
      ...prev.filter((f) => !("field" in f && f.field === field)),
      { field, operator: "eq", value: v },
    ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue items with unit, GST and HSN details."
        actions={<ButtonLink href="/products/create">New product</ButtonLink>}
      />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        <form
          role="search"
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", q.trim() || undefined);
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
        <div className="flex flex-col gap-1.5 md:w-48">
          <label htmlFor="product-status" className="text-xs font-medium text-drs-ink/75">
            Status
          </label>
          <select
            id="product-status"
            value={value("status") ?? ""}
            onChange={(e) => setFilter("status", e.target.value || undefined)}
            className="min-h-11 rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>
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
        pageCount={pageCount}
        total={result.total}
        hasNext={currentPage < pageCount}
        onPage={setCurrentPage}
      />
    </>
  );
}
