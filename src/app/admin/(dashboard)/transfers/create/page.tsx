"use client";

import { LineItems } from "@/components/resource/line-items";
import { ResourceForm } from "@/components/resource/resource-form";
import { Card, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { useInventoryLookups } from "@/modules/inventory/lookups";

export default function TransferCreatePage() {
  const lk = useInventoryLookups();
  if (lk.loading) return <Card>Loading…</Card>;
  return (
    <>
      <PageHeader eyebrow={<BackLink href="/admin/transfers">Transfers</BackLink>} title="New transfer" />
      <ResourceForm
        resource="transfers"
        cancelHref="/admin/transfers"
        submitLabel="Create transfer"
        successHref={(d) => `/admin/transfers/${d?.id ?? ""}`}
        defaultValues={{ items: [{}] }}
        fields={[
          {
            name: "from_location_id",
            label: "From",
            type: "select",
            options: lk.locationOptions,
            placeholder: "Default location",
          },
          {
            name: "to_location_id",
            label: "To",
            type: "select",
            options: lk.locationOptions,
            required: true,
            validate: (v, all) => !v || v !== all.from_location_id || "Pick a different destination",
          },
          { name: "note", label: "Note", type: "textarea", maxLength: 255 },
        ]}
        transform={(payload, _mode, values) => ({ ...payload, items: values.items })}
      >
        {(form) => (
          <LineItems
            form={form}
            name="items"
            legend="Items"
            addLabel="Add item"
            columns={[
              {
                name: "product_id",
                label: "Product",
                type: "select",
                options: lk.productOptions,
                required: true,
              },
              { name: "qty", label: "Quantity", type: "number", required: true, gt: 0, max: 1_000_000 },
            ]}
          />
        )}
      </ResourceForm>
    </>
  );
}
