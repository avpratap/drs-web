"use client";

import type { BaseRecord, HttpError, RedirectAction } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGrid, buildPayload, type FieldDef } from "./fields";

export function ResourceForm({
  resource,
  id,
  fields,
  defaultValues,
  cancelHref,
  submitLabel,
  redirect = "show",
  successHref,
  meta,
  toFormValues,
  transform,
  children,
}: {
  resource: string;
  id?: string;
  fields: FieldDef[];
  defaultValues?: Record<string, unknown>;
  cancelHref: string;
  submitLabel?: string;
  redirect?: RedirectAction;
  /** Navigate here after success instead of Refine's redirect. */
  successHref?: (data: BaseRecord | undefined) => string;
  meta?: Record<string, unknown>;
  /** Map a loaded record to form values (e.g. JSON → string). */
  toFormValues?: (record: BaseRecord) => Record<string, unknown>;
  /** Final tweak of the payload before sending (raw form values available). */
  transform?: (
    payload: Record<string, unknown>,
    mode: "create" | "edit",
    values: Record<string, unknown>,
  ) => Record<string, unknown>;
  /** Extra inputs rendered under the field grid (e.g. line items). */
  children?: (form: UseFormReturn<FieldValues>) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = id !== undefined;
  const form = useForm<BaseRecord, HttpError, FieldValues>({
    refineCoreProps: {
      resource,
      action: isEdit ? "edit" : "create",
      id,
      meta,
      redirect: successHref ? false : redirect,
      onMutationSuccess: successHref ? (data) => router.push(successHref(data?.data)) : undefined,
      queryOptions: toFormValues
        ? { select: (d) => ({ ...d, data: toFormValues(d.data) as BaseRecord }) }
        : undefined,
    },
    defaultValues,
  });
  const {
    handleSubmit,
    refineCore: { onFinish, formLoading, query },
  } = form;

  if (isEdit && query?.isLoading) return <Card>Loading…</Card>;
  if (isEdit && query?.error) return <Card>{query.error.message}</Card>;

  const mode = isEdit ? "edit" : "create";
  const submit = handleSubmit((values) => {
    const payload = buildPayload(values, fields, mode);
    return onFinish(transform ? transform(payload, mode, values) : payload);
  });

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <FieldGrid fields={fields} form={form} isEdit={isEdit} />
        {children?.(form as unknown as UseFormReturn<FieldValues>)}
      </Card>
      <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <ButtonLink variant="secondary" href={cancelHref}>
          Cancel
        </ButtonLink>
        <Button type="submit" loading={formLoading}>
          {submitLabel ?? (isEdit ? "Save changes" : "Create")}
        </Button>
      </div>
    </form>
  );
}
