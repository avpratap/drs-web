"use client";

import type { HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/resource/form-select";
import { Field } from "@/components/ui/field";
import type { components } from "@/lib/api/client";
import { toPayload } from "@/lib/forms";

type Tier = components["schemas"]["PriceTierOut"];
type Values = { code: string; name: string; tier_type: "retail" | "b2b" };

export function PriceTierForm({ id }: { id?: string }) {
  const isEdit = id !== undefined;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    refineCore: { onFinish, formLoading, query },
  } = useForm<Tier, HttpError, Values>({
    refineCoreProps: { resource: "price-tiers", action: isEdit ? "edit" : "create", id, redirect: "show" },
    defaultValues: { tier_type: "retail" },
  });
  const submit = handleSubmit((v) =>
    onFinish(toPayload<Values>(v, isEdit ? ["name", "tier_type"] : ["code", "name", "tier_type"]) as Values),
  );
  const err = (k: keyof Values) => errors[k]?.message as string | undefined;

  if (isEdit && query?.isLoading) return <Card>Loading…</Card>;

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Code"
            required
            error={err("code")}
            hint={isEdit ? "Code can't be changed." : "2–32 chars, e.g. RETAIL, HORECA"}
          >
            {(p) => (
              <input
                {...p}
                readOnly={isEdit}
                className={`${p.className} ${isEdit ? "bg-drs-cream/50" : ""} uppercase`}
                {...register("code", {
                  required: "Code is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  maxLength: { value: 32, message: "Max 32 characters" },
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
                  maxLength: { value: 64, message: "Max 64 characters" },
                })}
              />
            )}
          </Field>
          <Field label="Tier type" required error={err("tier_type")}>
            {(p) => (
              <FormSelect
                control={control}
                name="tier_type"
                field={p}
                rules={{ required: "Tier type is required" }}
                options={[
                  { value: "retail", label: "Retail" },
                  { value: "b2b", label: "B2B" },
                ]}
              />
            )}
          </Field>
        </div>
      </Card>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <ButtonLink variant="secondary" href={isEdit ? `/admin/price-tiers/${id}` : "/admin/price-tiers"}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={formLoading}>
          {isEdit ? "Save tier" : "Create tier"}
        </Button>
      </div>
    </form>
  );
}
