"use client";

import { useList, useOne } from "@refinedev/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { DataTable, type Column } from "@/components/ui/table";
import { RowLink } from "@/components/ui/links";
import type { components } from "@/lib/api/client";
import { inr } from "@/lib/forms";

type Product = components["schemas"]["ProductOut"];
type Variant = components["schemas"]["VariantOut"];

export default function ProductShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { result: product, query } = useOne<Product>({ resource: "products", id });
  const { result: variants, query: vq } = useList<Variant>({
    resource: "variants",
    meta: { productId: id },
    pagination: { mode: "off" },
  });

  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !product) return <Card>{query.error?.message ?? "Product not found."}</Card>;

  const columns: Column<Variant>[] = [
    {
      key: "label",
      header: "Variant",
      cell: (v) => (
        <span className="font-medium">
          {v.label}
          <span className="block text-xs font-normal text-drs-ink/65">{v.sku}</span>
        </span>
      ),
    },
    { key: "pack", header: "Pack", cell: (v) => `${v.pack_size} ${product.uom ?? ""}`, hideOnMobile: true },
    { key: "price", header: "Price", cell: (v) => inr.format(v.price) },
    { key: "mrp", header: "MRP", cell: (v) => (v.mrp != null ? inr.format(v.mrp) : "—"), hideOnMobile: true },
    { key: "status", header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (v) => (
        <RowLink href={`/admin/products/${id}/variants/${v.id}/edit`} srLabel={v.label}>
          Edit
        </RowLink>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/products" className="hover:underline">
            ← Products
          </Link>
        }
        title={product.name}
        actions={
          <>
            <ButtonLink variant="secondary" href={`/admin/product-prices?product_id=${product.id}`}>
              Prices
            </ButtonLink>
            <ButtonLink href={`/admin/products/${product.id}/edit`}>Edit</ButtonLink>
            {product.status !== "retired" && (
              <DeleteButton
                resource="products"
                id={product.id}
                label="Retire product"
                confirmText="Retired products disappear from the storefront but stay on historical orders and invoices."
                onDone={() => router.push("/admin/products")}
              />
            )}
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            { label: "SKU", value: product.sku },
            { label: "Status", value: <StatusBadge status={product.status} /> },
            { label: "Category", value: <CategoryBadge category={product.category} /> },
            { label: "Unit", value: `${product.pack_size ?? 1} ${product.uom ?? "piece"}` },
            { label: "GST rate", value: <Badge>{product.gst_rate ?? 0}%</Badge> },
            { label: "HSN code", value: product.hsn_code ?? "—" },
            { label: "Subscribable", value: product.is_subscribable ? "Yes" : "No" },
            { label: "Perishable", value: product.perishable ? "Yes" : "No" },
            {
              label: "Rating",
              value: `${(product.avg_rating ?? 0).toFixed(1)} (${product.rating_count ?? 0})`,
            },
          ]}
        />
        {product.description && (
          <p className="mt-6 max-w-prose text-sm text-drs-ink/80">{product.description}</p>
        )}
      </Card>

      <div className="mt-10 mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-drs-green">Variants</h2>
        <ButtonLink variant="secondary" href={`/admin/products/${id}/variants/create`}>
          Add variant
        </ButtonLink>
      </div>
      <DataTable
        caption={`Variants of ${product.name}`}
        columns={columns}
        rows={variants.data}
        rowKey={(v) => v.id}
        loading={vq.isLoading}
        error={vq.error?.message}
        empty="No variants yet — the product sells as a single pack."
      />
    </>
  );
}
