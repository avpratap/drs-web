"use client";

import { useId, useRef } from "react";
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useApiAction } from "@/lib/use-api-action";
import { FieldGrid, buildPayload, type FieldDef } from "./fields";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * A button that opens a modal (native <dialog>: focus-trapped, Esc closes) to confirm an
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
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const form = useForm<FieldValues>({ defaultValues });
  const { run, pending } = useApiAction();

  const close = () => {
    ref.current?.close();
    form.reset(defaultValues);
  };
  const onValid = async (values: FieldValues) => {
    try {
      await run(() => onConfirm(toBody ? toBody(values) : buildPayload(values, fields, "create")), {
        success,
        invalidate,
      });
      close();
    } catch {
      /* toast already shown; keep the dialog open so the user can fix and retry */
    }
  };
  const submit = (e: React.FormEvent) => form.handleSubmit(onValid)(e);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={triggerClassName}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => ref.current?.showModal()}
      >
        {label}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => form.reset(defaultValues)}
        className={cn(
          "m-auto rounded-xl bg-drs-white p-0 text-drs-ink shadow-xl backdrop:bg-drs-ink/50",
          wide ? "w-[min(56rem,calc(100vw-2rem))]" : "w-[min(34rem,calc(100vw-2rem))]",
        )}
      >
        <form onSubmit={submit} noValidate className="p-6">
          <h2
            id={titleId}
            className={`text-lg font-semibold ${confirmVariant === "danger" ? "text-drs-maroon" : "text-drs-green"}`}
          >
            {title ?? label}
          </h2>
          {description && <div className="mt-2 text-sm text-drs-ink/80">{description}</div>}
          {fields.length > 0 && (
            <div className="mt-5">
              <FieldGrid fields={fields} form={form} />
            </div>
          )}
          {children?.(form)}
          <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant={confirmVariant ?? "primary"} loading={pending}>
              {confirmLabel ?? label}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
