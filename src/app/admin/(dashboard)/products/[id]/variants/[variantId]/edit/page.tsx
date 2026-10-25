"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { VariantForm } from "@/components/catalog/variant-form";
import { PageHeader } from "@/components/ui/card";

export default function VariantEditPage() {
  const { id, variantId } = useParams<{ id: string; variantId: string }>();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/admin/products/${id}`} className="hover:underline">
            ← Product
          </Link>
        }
        title="Edit variant"
      />
      <VariantForm productId={id} id={variantId} />
    </>
  );
}
