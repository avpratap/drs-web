"use client";

import { useOne } from "@refinedev/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCatalogLookups } from "@/components/catalog/lookups";
import { PriceWindowBadge } from "@/components/catalog/price-window-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, DescriptionList, PageHeader } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import type { components } from "@/lib/api/client";
import { formatDate, inr } from "@/lib/forms";

type Price = components["schemas"]["ProductPriceOut"];

export default function ProductPriceShowPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lookups = useCatalogLookups();
  const { result: price, query } = useOne<Price>({ resource: "product-prices", id });
  if (query.isLoading) return <Card>Loading…</Card>;
  if (query.error || !price) return <Card>{query.error?.message ?? "Price not found."}</Card>;
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/product-prices" className="hover:underline">
            ← Product prices
          </Link>
        }
        title={`${lookups.productName(price.product_id)} · ${lookups.tierName(price.price_tier_id)}`}
        actions={
          <>
            <ButtonLink href={`/admin/product-prices/${price.id}/edit`}>Edit</ButtonLink>
            <DeleteButton
              resource="product-prices"
              id={price.id}
              label="Delete price"
              confirmText="This price row will be removed. Orders already placed keep their price."
              onDone={() => router.push("/admin/product-prices")}
            />
          </>
        }
      />
      <Card>
        <DescriptionList
          items={[
            {
              label: "Product",
              value: (
                <Link className="text-drs-green hover:underline" href={`/admin/products/${price.product_id}`}>
                  {lookups.productName(price.product_id)}
                </Link>
              ),
            },
            {
              label: "Tier",
              value: (
                <Link
                  className="text-drs-green hover:underline"
                  href={`/admin/price-tiers/${price.price_tier_id}`}
                >
                  {lookups.tierName(price.price_tier_id)}
                </Link>
              ),
            },
            { label: "Unit price", value: inr.format(price.unit_price) },
            { label: "Minimum quantity", value: price.min_qty },
            { label: "Valid from", value: formatDate(price.valid_from) },
            { label: "Valid to", value: price.valid_to ? formatDate(price.valid_to) : "Open-ended" },
            { label: "Status", value: <PriceWindowBadge from={price.valid_from} to={price.valid_to} /> },
          ]}
        />
      </Card>
    </>
  );
}
