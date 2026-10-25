"use client";

import { useState } from "react";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApiAction } from "@/lib/use-api-action";
import { FieldGrid, buildPayload, type FieldDef } from "./fields";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * A button that opens a modal (Radix Dialog: focus-trapped, Esc closes) to confirm an
 * action, optionally collecting a few validated fields first.
 */
export function ActionDialog({
  label,
  title,
  description,
  fields = [],
  defaultValues,
  confirmLabel,
  variant = "secondary",
  confirmVariant,
  onConfirm,
  success,
  invalidate,
  disabled,
  triggerClassName,
  children,
  toBody,
  wide,
  ariaLabel,
}: {
  label: string;
  title?: string;
  description?: React.ReactNode;
  fields?: FieldDef[];
  defaultValues?: Record<string, unknown>;
  confirmLabel?: string;
  variant?: Variant;
  confirmVariant?: "primary" | "danger";
  onConfirm: (values: Record<string, unknown>) => Promise<unknown>;
  success?: string;
  invalidate?: string[];
  disabled?: boolean;
  triggerClassName?: string;
  /** Extra inputs (e.g. line items) under the fields. */
  children?: (form: UseFormReturn<FieldValues>) => React.ReactNode;
  /** Build the request body from raw values (defaults to the fields' payload). */
  toBody?: (values: Record<string, unknown>) => Record<string, unknown>;
  wide?: boolean;
  /** Accessible name for the trigger when its visible label is ambiguous (e.g. "Edit" per row). */
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<FieldValues>({ defaultValues });
  const { run, pending } = useApiAction();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(defaultValues);
  };
  const onValid = async (values: FieldValues) => {
    try {
      await run(() => onConfirm(toBody ? toBody(values) : buildPayload(values, fields, "create")), {
        success,
        invalidate,
      });
      onOpenChange(false);
    } catch {
      /* toast already shown; keep the dialog open so the user can fix and retry */
    }
  };
  const submit = (e: React.FormEvent) => form.handleSubmit(onValid)(e);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          className={triggerClassName}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        showClose={false}
        className={cn("block p-0 text-left", wide ? "max-w-[56rem]" : "max-w-[34rem]")}
      >
        <form onSubmit={submit} noValidate className="p-5 md:p-6">
          <DialogTitle className={confirmVariant === "danger" ? "text-drs-maroon" : undefined}>
            {title ?? label}
          </DialogTitle>
          {description ? (
            <DialogDescription asChild>
              <div className="mt-2 text-sm text-drs-ink/80">{description}</div>
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title ?? label}</DialogDescription>
          )}
          {fields.length > 0 && (
            <div className="mt-5">
              <FieldGrid fields={fields} form={form} />
            </div>
          )}
          {children?.(form)}
          <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={confirmVariant ?? "primary"} loading={pending}>
              {confirmLabel ?? label}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
