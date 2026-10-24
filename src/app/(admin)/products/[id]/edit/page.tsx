"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/catalog/product-form";
import { PageHeader } from "@/components/ui/card";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader title="Edit product" />
      <ProductForm id={id} />
    </>
  );
}
