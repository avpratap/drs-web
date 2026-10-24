import { Suspense } from "react";
import { ProductPriceForm } from "@/components/catalog/product-price-form";
import { PageHeader } from "@/components/ui/card";

export default function ProductPriceCreatePage() {
  return (
    <>
      <PageHeader title="New product price" />
      <Suspense>
        <ProductPriceForm />
      </Suspense>
    </>
  );
}
