"use client";

import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  type UseFormReturn,
} from "react-hook-form";
import { CheckboxField, Field } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

export type Option = { value: string | number; label: string; disabled?: boolean };

export type FieldDef = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "money"
    | "select"
    | "date"
    | "checkbox"
    | "email"
    | "url"
    | "tel"
    | "json";
  required?: boolean;
  options?: Option[] | readonly Option[];
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  /** Strict lower bound (value must be > this). */
  gt?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: { value: RegExp; message: string };
  step?: number | "any";
  rows?: number;
  /** Shown read-only when editing (field can't be patched). */
  createOnly?: boolean;
  /** Only shown when editing. */
  editOnly?: boolean;
  wide?: boolean;
  validate?: (value: unknown, all: Record<string, unknown>) => true | string;
  uppercase?: boolean;
  /** When blank on edit, send null to clear it (only for fields the API lets you clear). */
  nullable?: boolean;
};

/**
 * Build an API body from form values for the given mode: only the fields that apply,
 * strings trimmed, blank optional values omitted (or nulled when `nullable` on edit),
 * NaN numbers dropped and JSON fields parsed.
 */
export function buildPayload(
  values: Record<string, unknown>,
  fields: FieldDef[],
  mode: "create" | "edit",
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (mode === "create" && f.editOnly) continue;
    if (mode === "edit" && f.createOnly) continue;
    let v = values[f.name];
    if (typeof v === "string") v = v.trim();
    if (typeof v === "number" && Number.isNaN(v)) v = undefined;
    if (v === "" || v === undefined || v === null) {
      if (mode === "edit" && f.nullable) out[f.name] = null;
      continue;
    }
    if (f.type === "json" && typeof v === "string") v = JSON.parse(v);
    out[f.name] = v;
  }
  return out;
}

const isNumeric = (t: FieldDef["type"]) => t === "number" || t === "money";

export function rulesFor(f: FieldDef): RegisterOptions {
  const rules: RegisterOptions = {};
  if (f.required && f.type !== "checkbox") rules.required = `${f.label} is required`;
  if (isNumeric(f.type)) {
    rules.valueAsNumber = true;
  }
  if (f.type === "select" && f.options?.length && typeof f.options[0]?.value === "number") {
    rules.setValueAs = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
  }
  if (f.maxLength) rules.maxLength = { value: f.maxLength, message: `Max ${f.maxLength} characters` };
  if (f.minLength) rules.minLength = { value: f.minLength, message: `At least ${f.minLength} characters` };
  if (f.pattern) rules.pattern = f.pattern;
  rules.validate = (value: unknown, all: Record<string, unknown>) => {
    if (isNumeric(f.type)) {
      const n = value as number;
      if (n === undefined || Number.isNaN(n)) return f.required ? `${f.label} is required` : true;
      if (f.gt !== undefined && !(n > f.gt)) return `Must be greater than ${f.gt}`;
      if (f.min !== undefined && n < f.min) return `Must be at least ${f.min}`;
      if (f.max !== undefined && n > f.max) return `Must be at most ${f.max.toLocaleString("en-IN")}`;
    }
    if (f.type === "json" && typeof value === "string" && value.trim()) {
      try {
        JSON.parse(value);
      } catch {
        return "Must be valid JSON";
      }
    }
    return f.validate ? f.validate(value, all) : true;
  };
  return rules;
}

/** Empty choice of a select: `undefined` for numeric options (like `setValueAs`), else "". */
export const emptySelectValue = (options: FieldDef["options"]) =>
  typeof options?.[0]?.value === "number" ? undefined : "";

/** Controller rules for a custom Select (no `setValueAs`: the Select emits typed values). */
export function selectRulesFor(f: FieldDef): RegisterOptions {
  const rules = { ...rulesFor(f) } as RegisterOptions & { valueAsNumber?: boolean };
  delete rules.setValueAs;
  delete rules.valueAsNumber;
  return rules;
}

export function FieldGrid<T extends FieldValues>({
  fields,
  form,
  isEdit = false,
}: {
  fields: FieldDef[];
  form: UseFormReturn<T>;
  isEdit?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields
        .filter((f) => !(f.editOnly && !isEdit))
        .map((f) => {
          const name = f.name as Path<T>;
          const error = errors[f.name]?.message as string | undefined;
          const readOnly = isEdit && f.createOnly;
          if (f.type === "select") {
            return (
              <Field
                key={f.name}
                label={f.label}
                required={f.required}
                error={error}
                hint={readOnly ? `${f.label} can't be changed.` : f.hint}
                className={cn(f.wide && "md:col-span-2")}
              >
                {(p) => (
                  <Controller
                    control={form.control}
                    name={name}
                    rules={selectRulesFor(f) as RegisterOptions<T, Path<T>>}
                    render={({ field }) => (
                      <Select
                        id={p.id}
                        name={field.name}
                        invalid={p["aria-invalid"]}
                        aria-describedby={p["aria-describedby"]}
                        options={f.options ?? []}
                        value={field.value}
                        placeholder={f.placeholder ?? "Select…"}
                        clearable={!f.required}
                        disabled={readOnly}
                        onChange={(v) => field.onChange(v === "" ? emptySelectValue(f.options) : v)}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                )}
              </Field>
            );
          }
          if (f.type === "date") {
            return (
              <Field
                key={f.name}
                label={f.label}
                required={f.required}
                error={error}
                hint={readOnly ? `${f.label} can't be changed.` : f.hint}
                className={cn(f.wide && "md:col-span-2")}
              >
                {(p) => (
                  <Controller
                    control={form.control}
                    name={name}
                    rules={selectRulesFor(f) as RegisterOptions<T, Path<T>>}
                    render={({ field }) => (
                      <DatePicker
                        id={p.id}
                        name={field.name}
                        invalid={p["aria-invalid"]}
                        aria-describedby={p["aria-describedby"]}
                        value={field.value as string | undefined}
                        placeholder={f.placeholder}
                        clearable={!f.required}
                        disabled={readOnly}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                )}
              </Field>
            );
          }
          if (f.type === "checkbox") {
            return (
              <div key={f.name} className={cn(f.wide && "md:col-span-2", "flex items-end")}>
                <Controller
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <CheckboxField
                      label={f.label}
                      name={field.name}
                      disabled={readOnly}
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
            );
          }
          const reg = register(name, rulesFor(f) as RegisterOptions<T, Path<T>>);
          return (
            <Field
              key={f.name}
              label={f.label}
              required={f.required}
              error={error}
              hint={readOnly ? `${f.label} can't be changed.` : f.hint}
              className={cn((f.wide || f.type === "textarea" || f.type === "json") && "md:col-span-2")}
            >
              {(p) => {
                const cls = cn(p.className, readOnly && "bg-drs-cream/50", f.uppercase && "uppercase");
                if (f.type === "textarea" || f.type === "json") {
                  return (
                    <textarea
                      {...p}
                      className={cn(cls, f.type === "json" && "font-mono text-xs")}
                      rows={f.rows ?? (f.type === "json" ? 6 : 4)}
                      readOnly={readOnly}
                      placeholder={f.placeholder}
                      {...reg}
                    />
                  );
                }
                const type = isNumeric(f.type) ? "number" : (f.type ?? "text");
                return (
                  <input
                    {...p}
                    className={cls}
                    type={type}
                    readOnly={readOnly}
                    placeholder={f.placeholder}
                    step={isNumeric(f.type) ? (f.step ?? (f.type === "money" ? "0.01" : "any")) : undefined}
                    inputMode={isNumeric(f.type) ? "decimal" : f.type === "tel" ? "numeric" : undefined}
                    {...reg}
                  />
                );
              }}
            </Field>
          );
        })}
    </div>
  );
}
