import { ProductForm } from "@/components/catalog/product-form";
import { PageHeader } from "@/components/ui/card";

export default function ProductCreatePage() {
  return (
    <>
      <PageHeader title="New product" description="Add a SKU to the catalogue." />
      <ProductForm />
    </>
  );
}
