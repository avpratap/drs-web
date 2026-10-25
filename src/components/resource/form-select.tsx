"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, type SelectOption } from "@/components/ui/select";

/**
 * A custom Select bound to react-hook-form (via Controller) inside a `<Field>`: pass the
 * Field's render props as `field` so the label, hint and error stay wired up.
 */
export function FormSelect<T extends FieldValues>({
  control,
  name,
  rules,
  field: p,
  options,
  placeholder,
  disabled,
  clearable,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  rules?: Omit<RegisterOptions<T, FieldPath<T>>, "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled">;
  field: { id: string; "aria-invalid": boolean; "aria-describedby"?: string };
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  const numeric = typeof options[0]?.value === "number";
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <Select
          id={p.id}
          name={field.name}
          invalid={p["aria-invalid"]}
          aria-describedby={p["aria-describedby"]}
          options={options}
          value={field.value}
          placeholder={placeholder}
          clearable={clearable}
          disabled={disabled}
          onChange={(v) => field.onChange(v === "" ? (numeric ? undefined : "") : v)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

/** A DatePicker bound to react-hook-form inside a `<Field>` (value: ISO "YYYY-MM-DD" or ""). */
export function FormDate<T extends FieldValues>({
  control,
  name,
  rules,
  field: p,
  placeholder,
  disabled,
  clearable,
  min,
  max,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  rules?: Omit<RegisterOptions<T, FieldPath<T>>, "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled">;
  field: { id: string; "aria-invalid": boolean; "aria-describedby"?: string };
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <DatePicker
          id={p.id}
          name={field.name}
          invalid={p["aria-invalid"]}
          aria-describedby={p["aria-describedby"]}
          value={field.value}
          placeholder={placeholder}
          clearable={clearable}
          disabled={disabled}
          min={min}
          max={max}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
