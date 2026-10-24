"use client";

import { ActionDialog } from "@/components/resource/action-dialog";
import type { Option } from "@/components/resource/fields";
import { inventoryActions } from "@/modules/inventory/actions";
import { OPTIONS } from "@/modules/options";

const REFRESH = ["stock", "stock-low", "reorder-suggestions", "stock-movements", "batches"];

/** Header actions for stock: adjust, wastage, reorder point (optionally fixed to one product). */
export function StockActions({
  productOptions,
  locationOptions,
  productId,
}: {
  productOptions: Option[];
  locationOptions: Option[];
  productId?: number;
}) {
  const product = {
    name: "product_id",
    label: "Product",
    type: "select" as const,
    options: productOptions,
    required: true,
  };
  const location = {
    name: "location_id",
    label: "Location",
    type: "select" as const,
    options: locationOptions,
    placeholder: "Default location",
  };
  const defaults = productId ? { product_id: productId } : undefined;
  return (
    <>
      <ActionDialog
        label="Adjust stock"
        variant="primary"
        defaultValues={defaults}
        description="Positive to add, negative to remove. Use a batch receipt for perishable lots."
        fields={[
          product,
          location,
          {
            name: "change",
            label: "Change (qty, signed)",
            type: "number",
            required: true,
            min: -1_000_000,
            max: 1_000_000,
            validate: (v) => v !== 0 || "Can't be zero",
          },
          { name: "reason", label: "Reason", type: "select", options: OPTIONS.stockReason, required: true },
          { name: "note", label: "Note", type: "textarea", maxLength: 255 },
        ]}
        onConfirm={(v) => inventoryActions.adjustStock(v)}
        success="Stock adjusted"
        invalidate={REFRESH}
      />
      <ActionDialog
        label="Record wastage"
        defaultValues={defaults}
        description="Writes off spoiled or damaged stock (consumed first-expiry-first-out)."
        fields={[
          product,
          location,
          { name: "qty", label: "Quantity", type: "number", required: true, gt: 0, max: 1_000_000 },
          { name: "note", label: "Note", type: "textarea", maxLength: 255 },
        ]}
        onConfirm={(v) => inventoryActions.recordWastage(v)}
        success="Wastage recorded"
        invalidate={REFRESH}
      />
      <ActionDialog
        label="Reorder point"
        title="Set reorder point"
        defaultValues={defaults}
        fields={[
          product,
          location,
          {
            name: "reorder_point",
            label: "Reorder point",
            type: "number",
            required: true,
            min: 0,
            max: 1_000_000,
          },
        ]}
        onConfirm={(v) => inventoryActions.setReorderPoint(v)}
        success="Reorder point saved"
        invalidate={REFRESH}
      />
    </>
  );
}
