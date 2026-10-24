"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { VariantForm } from "@/components/catalog/variant-form";
import { PageHeader } from "@/components/ui/card";

export default function VariantCreatePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/products/${id}`} className="hover:underline">
            ← Product
          </Link>
        }
        title="Add variant"
      />
      <VariantForm productId={id} />
    </>
  );
}
