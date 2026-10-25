"use client";

import type { HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/resource/form-select";
import { Field } from "@/components/ui/field";
import type { components } from "@/lib/api/client";
import { toPayload, todayIST } from "@/lib/forms";
import { useCatalogLookups } from "./lookups";

type Price = components["schemas"]["ProductPriceOut"];
type PriceIn = components["schemas"]["ProductPriceIn"];
type PricePatch = components["schemas"]["ProductPricePatch"];
type Values = {
  product_id: number;
  price_tier_id: number;
  unit_price: number;
  min_qty: number;
  valid_from: string;
  valid_to: string;
};

export function ProductPriceForm({ id }: { id?: string }) {
  const isEdit = id !== undefined;
  const params = useSearchParams();
  const lookups = useCatalogLookups();
  const presetProduct = Number(params.get("product_id")) || undefined;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    refineCore: { onFinish, formLoading, query },
  } = useForm<Price, HttpError, Values>({
    refineCoreProps: { resource: "product-prices", action: isEdit ? "edit" : "create", id, redirect: "show" },
    defaultValues: {
      min_qty: 1,
      valid_from: todayIST(),
      ...(presetProduct ? { product_id: presetProduct } : {}),
    },
  });

  const submit = handleSubmit((v) =>
    onFinish(
      (isEdit
        ? toPayload<PricePatch>(v, ["unit_price", "min_qty", "valid_from", "valid_to"], ["valid_to"])
        : toPayload<PriceIn>(
            v,
            ["product_id", "price_tier_id", "unit_price", "min_qty", "valid_from", "valid_to"],
            ["valid_to"],
          )) as Values,
    ),
  );
  const err = (k: keyof Values) => errors[k]?.message as string | undefined;
  const positive = (max: number) => (v: number) =>
    (v > 0 && v <= max) || `Must be greater than 0 and ≤ ${max.toLocaleString("en-IN")}`;

  if ((isEdit && query?.isLoading) || lookups.loading) return <Card>Loading…</Card>;

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Product"
            required
            error={err("product_id")}
            hint={isEdit ? "Create a new price to change product." : undefined}
          >
            {(p) => (
              <FormSelect
                control={control}
                name="product_id"
                field={p}
                disabled={isEdit}
                placeholder="Select a product…"
                rules={{ validate: (v) => isEdit || Number(v) > 0 || "Choose a product" }}
                options={lookups.products.map((pr) => ({ value: pr.id, label: `${pr.name} (${pr.sku})` }))}
              />
            )}
          </Field>
          <Field
            label="Price tier"
            required
            error={err("price_tier_id")}
            hint={isEdit ? "Create a new price to change tier." : undefined}
          >
            {(p) => (
              <FormSelect
                control={control}
                name="price_tier_id"
                field={p}
                disabled={isEdit}
                placeholder="Select a tier…"
                rules={{ validate: (v) => isEdit || Number(v) > 0 || "Choose a tier" }}
                options={lookups.tiers.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))}
              />
            )}
          </Field>
          <Field label="Unit price (₹)" required error={err("unit_price")} hint="Before GST">
            {(p) => (
              <input
                {...p}
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("unit_price", { valueAsNumber: true, validate: positive(1_000_000) })}
              />
            )}
          </Field>
          <Field
            label="Minimum quantity"
            required
            error={err("min_qty")}
            hint="Price applies from this quantity"
          >
            {(p) => (
              <input
                {...p}
                type="number"
                step="any"
                inputMode="decimal"
                {...register("min_qty", { valueAsNumber: true, validate: positive(1_000_000) })}
              />
            )}
          </Field>
          <Field label="Valid from" required error={err("valid_from")}>
            {(p) => (
              <input {...p} type="date" {...register("valid_from", { required: "Start date is required" })} />
            )}
          </Field>
          <Field label="Valid to" error={err("valid_to")} hint="Leave empty for open-ended">
            {(p) => (
              <input
                {...p}
                type="date"
                {...register("valid_to", {
                  validate: (v) =>
                    !v || v >= getValues("valid_from") || "End date must be on or after the start date",
                })}
              />
            )}
          </Field>
        </div>
      </Card>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <ButtonLink variant="secondary" href={isEdit ? `/product-prices/${id}` : "/product-prices"}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={formLoading}>
          {isEdit ? "Save price" : "Create price"}
        </Button>
      </div>
    </form>
  );
}
