"use client";

import { useParams } from "next/navigation";
import { PriceTierForm } from "@/components/catalog/price-tier-form";
import { PageHeader } from "@/components/ui/card";

export default function PriceTierEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader title="Edit price tier" />
      <PriceTierForm id={id} />
    </>
  );
}
