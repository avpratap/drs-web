"use client";

import { LineItems } from "@/components/resource/line-items";
import { ResourceForm } from "@/components/resource/resource-form";
import { Card, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { useInventoryLookups } from "@/modules/inventory/lookups";

export default function BomCreatePage() {
  const lk = useInventoryLookups();
  if (lk.loading) return <Card>Loading…</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/boms">Bills of materials</BackLink>}
        title="New bill of materials"
      />
      <ResourceForm
        resource="boms"
        cancelHref="/boms"
        submitLabel="Create BOM"
        successHref={(d) => `/boms/${d?.id ?? ""}`}
        defaultValues={{ output_qty: 1, components: [{}] }}
        fields={[
          {
            name: "product_id",
            label: "Output product",
            type: "select",
            options: lk.productOptions,
            required: true,
          },
          { name: "name", label: "Recipe name", required: true, maxLength: 120 },
          {
            name: "output_qty",
            label: "Output quantity",
            type: "number",
            required: true,
            gt: 0,
            max: 1_000_000,
          },
        ]}
        transform={(payload, _mode, values) => ({ ...payload, components: values.components })}
      >
        {(form) => (
          <LineItems
            form={form}
            name="components"
            legend="Components"
            addLabel="Add component"
            columns={[
              {
                name: "component_product_id",
                label: "Component",
                type: "select",
                options: lk.productOptions,
                required: true,
              },
              {
                name: "qty",
                label: "Quantity per batch",
                type: "number",
                required: true,
                gt: 0,
                max: 1_000_000,
              },
            ]}
          />
        )}
      </ResourceForm>
    </>
  );
}
