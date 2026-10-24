"use client";

import { ResourceForm } from "@/components/resource/resource-form";
import { PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { supplierFields } from "@/modules/inventory/fields";

export default function SupplierCreatePage() {
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/suppliers">Suppliers</BackLink>} title="New supplier" />
      <ResourceForm
        resource="suppliers"
        fields={supplierFields}
        cancelHref="/suppliers"
        successHref={() => "/suppliers"}
        submitLabel="Create supplier"
        transform={(p) => (typeof p.gstin === "string" ? { ...p, gstin: p.gstin.toUpperCase() } : p)}
      />
    </>
  );
}
