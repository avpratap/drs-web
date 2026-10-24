import { PriceTierForm } from "@/components/catalog/price-tier-form";
import { PageHeader } from "@/components/ui/card";

export default function PriceTierCreatePage() {
  return (
    <>
      <PageHeader title="New price tier" />
      <PriceTierForm />
    </>
  );
}
