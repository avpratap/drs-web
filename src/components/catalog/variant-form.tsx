"use client";

import type { HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/ui/delete-button";
import { FormSelect } from "@/components/resource/form-select";
import { Field } from "@/components/ui/field";
import type { components } from "@/lib/api/client";
import { toPayload } from "@/lib/forms";

type Variant = components["schemas"]["VariantOut"];
type VariantIn = components["schemas"]["VariantIn"];
type VariantUpdate = components["schemas"]["VariantUpdate"];
type Values = {
  sku: string;
  label: string;
  pack_size: number;
  price: number;
  mrp: number;
  image_url: string;
  sort_order: number;
  status: string;
};

const CREATE_KEYS = ["sku", "label", "pack_size", "price", "mrp", "image_url", "sort_order"] as const;
const UPDATE_KEYS = ["label", "pack_size", "price", "mrp", "image_url", "status", "sort_order"] as const;

export function VariantForm({ productId, id }: { productId: string; id?: string }) {
  const router = useRouter();
  const isEdit = id !== undefined;
  const back = `/admin/products/${productId}`;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    refineCore: { onFinish, formLoading, query },
  } = useForm<Variant, HttpError, Values>({
    refineCoreProps: {
      resource: "variants",
      action: isEdit ? "edit" : "create",
      id,
      meta: { productId },
      redirect: false,
      onMutationSuccess: () => router.push(back),
    },
    defaultValues: { pack_size: 1, price: 0, sort_order: 0, status: "active" },
  });

  const submit = handleSubmit((v) =>
    onFinish(
      (isEdit
        ? toPayload<VariantUpdate>(v, UPDATE_KEYS, ["mrp", "image_url"])
        : toPayload<VariantIn>(v, CREATE_KEYS, ["mrp", "image_url"])) as Values,
    ),
  );
  const err = (k: keyof Values) => errors[k]?.message as string | undefined;
  const money = {
    min: { value: 0, message: "Can't be negative" },
    max: { value: 1_000_000, message: "Too large" },
  };

  if (isEdit && query?.isLoading) return <Card>Loading…</Card>;

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Variant SKU"
            required
            error={err("sku")}
            hint={isEdit ? "SKU can't be changed." : undefined}
          >
            {(p) => (
              <input
                {...p}
                readOnly={isEdit}
                className={`${p.className} ${isEdit ? "bg-drs-cream/50" : ""} uppercase`}
                {...register("sku", {
                  required: "SKU is required",
                  maxLength: { value: 64, message: "Max 64 characters" },
                })}
              />
            )}
          </Field>
          <Field label="Label" required error={err("label")} hint="Shown to customers, e.g. 500 ml">
            {(p) => (
              <input
                {...p}
                {...register("label", {
                  required: "Label is required",
                  maxLength: { value: 64, message: "Max 64 characters" },
                })}
              />
            )}
          </Field>
          <Field label="Pack size" required error={err("pack_size")}>
            {(p) => (
              <input
                {...p}
                type="number"
                step="any"
                inputMode="decimal"
                {...register("pack_size", {
                  valueAsNumber: true,
                  validate: (v) => (v > 0 && v <= 1_000_000) || "Must be greater than 0",
                })}
              />
            )}
          </Field>
          <Field label="Sort order" error={err("sort_order")}>
            {(p) => (
              <input {...p} type="number" step={1} {...register("sort_order", { valueAsNumber: true })} />
            )}
          </Field>
          <Field label="Price (₹)" required error={err("price")}>
            {(p) => (
              <input
                {...p}
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("price", { valueAsNumber: true, required: "Price is required", ...money })}
              />
            )}
          </Field>
          <Field label="MRP (₹)" error={err("mrp")}>
            {(p) => (
              <input
                {...p}
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("mrp", {
                  valueAsNumber: true,
                  ...money,
                  validate: (v) =>
                    Number.isNaN(v) || v >= getValues("price") || "MRP can't be below the price",
                })}
              />
            )}
          </Field>
          <Field label="Image URL" error={err("image_url")}>
            {(p) => (
              <input
                {...p}
                type="url"
                {...register("image_url", {
                  pattern: { value: /^https?:\/\/\S+$/, message: "Must be an http(s) URL" },
                })}
              />
            )}
          </Field>
          {isEdit && (
            <Field label="Status" error={err("status")}>
              {(p) => (
                <FormSelect
                  control={control}
                  name="status"
                  field={p}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              )}
            </Field>
          )}
        </div>
      </Card>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end">
        {isEdit && (
          <div className="md:mr-auto">
            <DeleteButton
              resource="variants"
              id={id}
              meta={{ productId }}
              label="Retire variant"
              confirmText="The variant will no longer be sold."
              onDone={() => router.push(back)}
            />
          </div>
        )}
        <ButtonLink variant="secondary" href={back}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={formLoading}>
          {isEdit ? "Save variant" : "Add variant"}
        </Button>
      </div>
    </form>
  );
}
