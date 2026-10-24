"use client";

import type { HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field } from "@/components/ui/field";
import type { components } from "@/lib/api/client";
import { toPayload } from "@/lib/forms";

type Product = components["schemas"]["ProductOut"];
type Create = components["schemas"]["ProductCreate"];
type Values = Omit<Create, "gst_rate" | "pack_size"> & { gst_rate: number; pack_size: number };

const CREATE_KEYS = [
  "sku",
  "name",
  "description",
  "uom",
  "pack_size",
  "is_subscribable",
  "perishable",
  "hsn_code",
  "gst_rate",
  "category",
  "image_url",
] as const;
const NULLABLE = ["description", "hsn_code", "category", "image_url"] as const;
export const UOMS = ["piece", "litre", "ml", "kg", "g", "pack", "dozen"] as const;
export const GST_RATES = [0, 5, 12, 18, 28] as const;

export function ProductForm({ id }: { id?: string }) {
  const isEdit = id !== undefined;
  const {
    register,
    handleSubmit,
    formState: { errors },
    refineCore: { onFinish, formLoading, query },
  } = useForm<Product, HttpError, Values>({
    refineCoreProps: { resource: "products", action: isEdit ? "edit" : "create", id, redirect: "show" },
    defaultValues: { uom: "piece", pack_size: 1, gst_rate: 0, is_subscribable: true, perishable: true },
  });

  const submit = handleSubmit((v) =>
    onFinish(
      toPayload<Create>(v, isEdit ? CREATE_KEYS.filter((k) => k !== "sku") : CREATE_KEYS, NULLABLE) as Values,
    ),
  );
  const err = (k: keyof Values) => errors[k]?.message as string | undefined;

  if (isEdit && query?.isLoading) return <Card>Loading…</Card>;

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="SKU"
            required
            error={err("sku")}
            hint={isEdit ? "SKU can't be changed." : "Unique, e.g. MILK-FC-500"}
          >
            {(p) => (
              <input
                {...p}
                readOnly={isEdit}
                className={`${p.className} ${isEdit ? "bg-drs-cream/50" : ""} uppercase`}
                {...register("sku", {
                  required: "SKU is required",
                  maxLength: { value: 64, message: "Max 64 characters" },
                  pattern: { value: /^[A-Za-z0-9._-]+$/, message: "Letters, digits, . _ - only" },
                })}
              />
            )}
          </Field>
          <Field label="Name" required error={err("name")}>
            {(p) => (
              <input
                {...p}
                {...register("name", {
                  required: "Name is required",
                  maxLength: { value: 255, message: "Max 255 characters" },
                })}
              />
            )}
          </Field>
          <Field label="Unit of measure" required error={err("uom")}>
            {(p) => (
              <select {...p} {...register("uom", { required: "UOM is required" })}>
                {UOMS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Pack size" required error={err("pack_size")} hint="Quantity of the UOM per pack">
            {(p) => (
              <input
                {...p}
                type="number"
                step="any"
                inputMode="decimal"
                {...register("pack_size", {
                  valueAsNumber: true,
                  required: "Pack size is required",
                  validate: (v) => (v > 0 && v <= 100000) || "Must be between 0 and 100000",
                })}
              />
            )}
          </Field>
          <Field label="GST rate (%)" required error={err("gst_rate")}>
            {(p) => (
              <select {...p} {...register("gst_rate", { valueAsNumber: true })}>
                {GST_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="HSN code" error={err("hsn_code")} hint="4, 6 or 8 digits (dairy is chapter 04)">
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                {...register("hsn_code", {
                  pattern: { value: /^(\d{4}|\d{6}|\d{8})$/, message: "HSN must be 4, 6 or 8 digits" },
                })}
              />
            )}
          </Field>
          <Field label="Category" error={err("category")} hint="e.g. milk, buttermilk, paneer, ghee">
            {(p) => (
              <input
                {...p}
                {...register("category", { maxLength: { value: 64, message: "Max 64 characters" } })}
              />
            )}
          </Field>
          <Field label="Image URL" error={err("image_url")}>
            {(p) => (
              <input
                {...p}
                type="url"
                {...register("image_url", {
                  maxLength: { value: 512, message: "Max 512 characters" },
                  pattern: { value: /^https?:\/\/\S+$/, message: "Must be an http(s) URL" },
                })}
              />
            )}
          </Field>
          <Field label="Description" error={err("description")} className="md:col-span-2">
            {(p) => (
              <textarea
                {...p}
                rows={3}
                {...register("description", { maxLength: { value: 4096, message: "Max 4096 characters" } })}
              />
            )}
          </Field>
          <div className="flex flex-col gap-1 md:col-span-2 md:flex-row md:gap-8">
            <Checkbox label="Available for subscription" {...register("is_subscribable")} />
            <Checkbox label="Perishable" {...register("perishable")} />
          </div>
        </div>
      </Card>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <ButtonLink variant="secondary" href={isEdit ? `/products/${id}` : "/products"}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={formLoading}>
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
