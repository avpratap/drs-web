"use client";

import { useTable } from "@refinedev/core";
import Link from "next/link";
import { useState } from "react";
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { DataTable, Pager, type Column } from "@/components/ui/table";
import { RowLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { OPTIONS } from "@/modules/options";

type Product = components["schemas"]["ProductOut"];

const columns: Column<Product>[] = [
  {
    key: "name",
    header: "Product",
    cell: (p) => (
      <Link href={`/admin/products/${p.id}`} className="font-medium text-drs-green hover:underline">
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
      <RowLink href={`/admin/products/${p.id}/edit`} srLabel={p.name}>
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
        actions={<ButtonLink href="/admin/products/create">New product</ButtonLink>}
      />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <form
          role="search"
          className="flex w-full gap-2 md:w-auto md:min-w-80 md:flex-1 lg:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", q.trim() || undefined);
          }}
        >
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <SearchInput
            id="product-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU"
          />
          <button type="submit" className={buttonClass("secondary")}>
            Search
          </button>
        </form>
        <div className="flex flex-col gap-1.5 md:w-auto md:min-w-40">
          <label htmlFor="product-status" className="text-xs font-medium text-drs-ink/75">
            Status
          </label>
          <Select
            id="product-status"
            fit
            clearable
            placeholder="All"
            value={value("status") ?? ""}
            onChange={(v) => setFilter("status", v === "" ? undefined : String(v))}
            options={OPTIONS.productStatus}
          />
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
