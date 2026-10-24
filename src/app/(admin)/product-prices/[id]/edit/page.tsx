"use client";

import { useParams } from "next/navigation";
import { ProductPriceForm } from "@/components/catalog/product-price-form";
import { PageHeader } from "@/components/ui/card";

export default function ProductPriceEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader title="Edit product price" />
      <ProductPriceForm id={id} />
    </>
  );
}
