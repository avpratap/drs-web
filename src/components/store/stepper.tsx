"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** − value + with 44px targets; the value is announced politely as it changes. */
export function Stepper({
  value,
  min = 1,
  max,
  onChange,
  disabled,
  decreaseLabel,
  increaseLabel,
  className,
  ...aria
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const btn =
    "grid size-11 place-items-center rounded-full text-drs-green transition-colors hover:bg-drs-green/10 disabled:text-drs-ink/30 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      {...aria}
      className={cn("inline-flex items-center rounded-full border border-drs-ink/20 bg-drs-white", className)}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btn}
      >
        <MinusIcon aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-10 text-center text-base font-semibold text-drs-ink">
        {value}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btn}
      >
        <PlusIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
