"use client";

import { LineItems } from "@/components/resource/line-items";
import { ResourceForm } from "@/components/resource/resource-form";
import { Card, PageHeader } from "@/components/ui/card";
import { BackLink } from "@/components/ui/links";
import { todayIST } from "@/lib/forms";
import { useInventoryLookups } from "@/modules/inventory/lookups";

export default function PurchaseOrderCreatePage() {
  const lk = useInventoryLookups({ suppliers: true });
  if (lk.loading) return <Card>Loading…</Card>;
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/admin/purchase-orders">Purchase orders</BackLink>}
        title="New purchase order"
      />
      <ResourceForm
        resource="purchase-orders"
        cancelHref="/admin/purchase-orders"
        submitLabel="Create draft PO"
        successHref={(d) => `/admin/purchase-orders/${d?.id ?? ""}`}
        defaultValues={{ items: [{}] }}
        fields={[
          {
            name: "supplier_id",
            label: "Supplier",
            type: "select",
            options: lk.supplierOptions,
            required: true,
          },
          {
            name: "location_id",
            label: "Deliver to",
            type: "select",
            options: lk.locationOptions,
            placeholder: "Default location",
          },
          {
            name: "expected_date",
            label: "Expected on",
            type: "date",
            validate: (v) => !v || (v as string) >= todayIST() || "Can't be in the past",
          },
        ]}
        transform={(payload, _mode, values) => ({ ...payload, items: values.items })}
      >
        {(form) => (
          <LineItems
            form={form}
            name="items"
            legend="Lines"
            columns={[
              {
                name: "product_id",
                label: "Product",
                type: "select",
                options: lk.productOptions,
                required: true,
              },
              { name: "qty", label: "Quantity", type: "number", required: true, gt: 0, max: 1_000_000 },
              {
                name: "unit_cost",
                label: "Unit cost (₹)",
                type: "money",
                required: true,
                min: 0,
                max: 1_000_000,
              },
            ]}
          />
        )}
      </ResourceForm>
    </>
  );
}
