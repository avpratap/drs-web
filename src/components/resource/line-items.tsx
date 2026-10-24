"use client";

import { useFieldArray, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Option } from "./fields";

export type LineColumn = {
  name: string;
  label: string;
  type?: "select" | "number" | "money" | "text" | "date";
  options?: Option[];
  required?: boolean;
  gt?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  readOnly?: boolean;
};

const control =
  "block w-full min-h-11 rounded-lg border bg-drs-white px-3 py-2 text-sm text-drs-ink aria-[invalid=true]:border-drs-maroon border-drs-ink/20";

/**
 * Repeating rows of inputs (PO lines, transfer items, BOM components…). On mobile each row
 * stacks as a card; from md up it lays out as a grid with a header row.
 */
export function LineItems({
  form,
  name,
  columns,
  addLabel = "Add line",
  newRow,
  min = 1,
  fixed,
  legend,
}: {
  form: UseFormReturn<FieldValues>;
  name: string;
  columns: LineColumn[];
  addLabel?: string;
  newRow?: Record<string, unknown>;
  min?: number;
  /** Rows can't be added/removed (e.g. receiving against a PO). */
  fixed?: boolean;
  legend: string;
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  const errors =
    (form.formState.errors[name] as unknown as
      Record<string, Record<string, { message?: string }>>[] | undefined) ?? [];
  const rootError = (form.formState.errors[name] as { root?: { message?: string } } | undefined)?.root
    ?.message;
  const grid = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))${fixed ? "" : " 2.75rem"}` };

  return (
    <fieldset className="mt-6">
      <legend className="mb-3 text-sm font-semibold text-drs-green">{legend}</legend>
      <div
        className="hidden gap-3 px-1 pb-2 text-xs font-medium text-drs-ink/70 md:grid"
        style={grid}
        aria-hidden
      >
        {columns.map((c) => (
          <span key={c.name}>
            {c.label}
            {c.required && " *"}
          </span>
        ))}
      </div>
      <ol className="flex flex-col gap-3">
        {fields.map((row, i) => (
          <li
            key={row.id}
            className="rounded-lg border border-drs-ink/10 p-3 md:grid md:gap-3 md:border-0 md:p-0"
            style={grid}
          >
            {columns.map((c) => {
              const path = `${name}.${i}.${c.name}`;
              const err = (errors[i] as Record<string, { message?: string }> | undefined)?.[c.name]?.message;
              const id = `${name}-${i}-${c.name}`;
              const numeric = c.type === "number" || c.type === "money";
              const reg = form.register(path, {
                required: c.required ? `${c.label} is required` : false,
                valueAsNumber: numeric,
                setValueAs:
                  c.type === "select"
                    ? (v: unknown) => (v === "" || v == null ? undefined : Number(v))
                    : undefined,
                maxLength: c.maxLength
                  ? { value: c.maxLength, message: `Max ${c.maxLength} characters` }
                  : undefined,
                validate: (v: unknown) => {
                  if (!numeric) return true;
                  const n = v as number;
                  if (Number.isNaN(n) || n === undefined) return c.required ? `${c.label} is required` : true;
                  if (c.gt !== undefined && !(n > c.gt)) return `Must be > ${c.gt}`;
                  if (c.min !== undefined && n < c.min) return `Must be ≥ ${c.min}`;
                  if (c.max !== undefined && n > c.max) return `Must be ≤ ${c.max}`;
                  return true;
                },
              });
              return (
                <div key={c.name} className="mb-3 last:mb-0 md:mb-0">
                  <label htmlFor={id} className="mb-1 block text-xs font-medium text-drs-ink/75 md:sr-only">
                    {c.label} (line {i + 1})
                  </label>
                  {c.type === "select" ? (
                    <select id={id} aria-invalid={!!err} disabled={c.readOnly} className={control} {...reg}>
                      <option value="">Select…</option>
                      {c.options?.map((o) => (
                        <option key={String(o.value)} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      aria-invalid={!!err}
                      readOnly={c.readOnly}
                      className={cn(control, c.readOnly && "bg-drs-cream/50")}
                      type={numeric ? "number" : c.type === "date" ? "date" : "text"}
                      step={numeric ? (c.type === "money" ? "0.01" : "any") : undefined}
                      inputMode={numeric ? "decimal" : undefined}
                      aria-label={`${c.label} (line ${i + 1})`}
                      {...reg}
                    />
                  )}
                  {err && (
                    <p role="alert" className="mt-1 text-xs font-medium text-drs-maroon">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
            {!fixed && (
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length <= min}
                className="grid min-h-11 w-full place-items-center rounded-lg text-drs-maroon hover:bg-drs-maroon/10 disabled:opacity-30 md:w-11"
                aria-label={`Remove line ${i + 1}`}
              >
                <span aria-hidden>×</span>
                <span className="md:sr-only">Remove</span>
              </button>
            )}
          </li>
        ))}
      </ol>
      {rootError && (
        <p role="alert" className="mt-2 text-xs font-medium text-drs-maroon">
          {rootError}
        </p>
      )}
      {!fixed && (
        <Button type="button" variant="ghost" className="mt-3" onClick={() => append(newRow ?? {})}>
          + {addLabel}
        </Button>
      )}
    </fieldset>
  );
}
