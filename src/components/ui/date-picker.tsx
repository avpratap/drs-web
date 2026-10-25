"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";
import { PopoverContent } from "./popover";
import { triggerClass } from "./select";
import { swallowDialogCancel, useDialogContainer } from "./use-dialog-container";

/** "2026-10-25" <-> local Date (no timezone shifts: dates are calendar days, not instants). */
export function parseIsoDate(v: string | null | undefined): Date | undefined {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!m) return undefined;
  const [y, mo, day] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const d = new Date(y, mo, day);
  // Reject overflow like 2026-13-40 (Date would silently roll it over).
  return d.getFullYear() === y && d.getMonth() === mo && d.getDate() === day ? d : undefined;
}
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const display = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);

export type DatePickerProps = {
  /** ISO calendar date ("YYYY-MM-DD") or "" for none. */
  value: string | null | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  placeholder?: string;
  /** Show a "Clear" action that sets the value to "". */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Inclusive bounds, ISO dates. */
  min?: string;
  max?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

/**
 * On-brand date field: an input-styled trigger with a calendar icon that opens a Calendar in a
 * Radix Popover. Collision-aware like the Select (flips/shifts to stay on-screen), portals into
 * an enclosing native modal <dialog>, Esc closes only the calendar and focus returns to the
 * trigger. The value stays an ISO date string, exactly what <input type="date"> produced.
 */
export function DatePicker({
  value,
  onChange,
  onBlur,
  id,
  name,
  placeholder = "Pick a date",
  clearable,
  disabled,
  invalid,
  min,
  max,
  className,
  ...aria
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { container, resolve } = useDialogContainer(triggerRef);
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const lo = parseIsoDate(min);
  const hi = parseIsoDate(max);
  const today = new Date();

  const setOpenState = (next: boolean) => {
    if (next) resolve();
    setOpen(next);
    if (!next) onBlur?.();
  };
  const pick = (d: Date | undefined) => {
    if (d) onChange(toIsoDate(d));
    setOpenState(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpenState}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          ref={triggerRef}
          id={id}
          name={name}
          type="button"
          aria-haspopup="dialog"
          data-invalid={invalid || undefined}
          aria-label={aria["aria-label"]}
          aria-describedby={aria["aria-describedby"]}
          data-placeholder={selected ? undefined : ""}
          data-value={value || ""}
          className={cn(triggerClass, "[&[data-state=open]>svg]:rotate-0", className)}
        >
          <span>{selected ? display(selected) : placeholder}</span>
          <CalendarIcon aria-hidden className="size-4 shrink-0 text-drs-green" strokeWidth={2} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverContent
        ref={contentRef}
        container={container}
        aria-label="Choose date"
        className="w-auto p-0"
        onEscapeKeyDown={swallowDialogCancel}
        onOpenAutoFocus={(e) => {
          // Land on the selected day (else today) instead of the first nav button.
          e.preventDefault();
          requestAnimationFrame(() => {
            const root = contentRef.current;
            const target =
              root?.querySelector<HTMLButtonElement>("button[data-selected]") ??
              root?.querySelector<HTMLButtonElement>("button[data-today]:not([disabled])") ??
              root?.querySelector<HTMLButtonElement>("button[data-day]:not([disabled])");
            target?.focus();
          });
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={pick}
          defaultMonth={selected ?? today}
          startMonth={lo}
          endMonth={hi}
          disabled={[...(lo ? [{ before: lo }] : []), ...(hi ? [{ after: hi }] : [])]}
        />
        <div className="flex items-center justify-between gap-2 border-t border-drs-ink/10 px-3 py-2">
          <button
            type="button"
            className="min-h-9 rounded-md px-2 text-sm font-medium text-drs-green hover:bg-drs-green/10 disabled:opacity-40"
            disabled={(lo && today < lo) || (hi && today > hi) || undefined}
            onClick={() => pick(today)}
          >
            Today
          </button>
          {clearable && selected && (
            <button
              type="button"
              className="min-h-9 rounded-md px-2 text-sm font-medium text-drs-ink/70 hover:bg-drs-ink/5"
              onClick={() => {
                onChange("");
                setOpenState(false);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}
