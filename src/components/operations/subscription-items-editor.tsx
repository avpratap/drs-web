"use client";

import { useForm, type FieldValues } from "react-hook-form";
import type { Option } from "@/components/resource/fields";
import { LineItems } from "@/components/resource/line-items";
import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/client";
import { useApiAction } from "@/lib/use-api-action";
import { operationsActions } from "@/modules/operations/handlers";
import { OPTIONS } from "@/modules/options";

type Item = components["schemas"]["ItemOut"];
type ItemIn = components["schemas"]["ItemIn"];

type Row = {
  product_id?: number;
  default_qty?: number;
  frequency?: string;
  interval_days?: number;
  days_of_week?: string;
};

/** Normalise "1, 3,5" → "1,3,5" (ISO weekdays, Mon=1). */
export function normaliseDays(v: unknown): string {
  return String(v ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .join(",");
}

export function toItemsIn(rows: Row[]): ItemIn[] {
  return rows.map((r) => ({
    product_id: r.product_id as number,
    default_qty: r.default_qty as number,
    frequency: r.frequency ?? "daily",
    interval_days: r.frequency === "alternate" ? (r.interval_days ?? null) : null,
    days_of_week: r.frequency === "weekly" ? normaliseDays(r.days_of_week) : null,
  }));
}

/** Replace a subscription's standing lines (PUT semantics: missing products are dropped). */
export function SubscriptionItemsEditor({
  subscriptionId,
  items,
  productOptions,
  onSaved,
}: {
  subscriptionId: number;
  items: Item[];
  productOptions: Option[];
  onSaved?: () => void;
}) {
  const form = useForm<FieldValues>({
    defaultValues: {
      items: items
        .filter((i) => i.active)
        .map((i) => ({
          product_id: i.product_id,
          default_qty: i.default_qty,
          frequency: i.frequency,
          interval_days: i.interval_days ?? undefined,
          days_of_week: i.days_of_week ?? "",
        })),
    },
  });
  const { run, pending } = useApiAction();

  const save = (e: React.FormEvent) =>
    form.handleSubmit(async (values) => {
      const rows = (values.items ?? []) as Row[];
      const ids = rows.map((r) => r.product_id);
      if (new Set(ids).size !== ids.length) {
        form.setError("items.root" as never, { message: "Each product may appear only once." });
        return;
      }
      try {
        await run(() => operationsActions.setSubscriptionItems(subscriptionId, toItemsIn(rows)), {
          success: "Standing order saved",
          invalidate: ["subscriptions"],
        });
        onSaved?.();
      } catch {
        /* toast shown; keep edits */
      }
    })(e);

  return (
    <form onSubmit={save} noValidate>
      <LineItems
        form={form}
        name="items"
        legend="Standing-order lines"
        addLabel="Add product"
        min={0}
        newRow={{ frequency: "daily", default_qty: 1 }}
        columns={[
          { name: "product_id", label: "Product", type: "select", options: productOptions, required: true },
          {
            name: "default_qty",
            label: "Qty per drop",
            type: "number",
            required: true,
            min: 0,
            max: 100_000,
          },
          {
            name: "frequency",
            label: "Frequency",
            type: "select",
            options: [...OPTIONS.frequency],
            required: true,
          },
          {
            name: "interval_days",
            label: "Every N days",
            type: "number",
            min: 1,
            max: 365,
            validate: (v, row) =>
              row.frequency !== "alternate" ||
              (typeof v === "number" && v >= 1) ||
              "Required for every-N-days",
          },
          {
            name: "days_of_week",
            label: "Days (Mon=1)",
            placeholder: "1,3,5",
            maxLength: 32,
            validate: (v, row) => {
              if (row.frequency !== "weekly") return true;
              const days = normaliseDays(v);
              return /^[1-7](,[1-7])*$/.test(days) || "Weekdays 1–7, comma separated";
            },
          },
        ]}
      />
      <p className="mt-3 text-xs text-drs-ink/70">
        Changes apply from the next delivery that has not been frozen by the nightly cutoff. Qty 0 keeps a
        line but skips it.
      </p>
      <div className="mt-4 flex justify-end">
        <Button type="submit" loading={pending}>
          Save standing order
        </Button>
      </div>
    </form>
  );
}
