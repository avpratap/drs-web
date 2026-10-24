"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number; detail?: string };

/**
 * Ranked horizontal bars (magnitude, one hue). Bars ≤24px thick with a 4px rounded end;
 * the value sits at the bar tip in ink, never in the bar colour. Each row is focusable
 * and shows its detail on hover/focus.
 */
export function BarList({
  data,
  format,
  label,
}: {
  data: BarDatum[];
  format: (n: number) => string;
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...data.map((d) => d.value)) || 1;
  if (!data.length)
    return <p className="mt-3 py-10 text-center text-sm text-drs-ink/70">No data for this period.</p>;
  return (
    <ol className="mt-4 flex flex-col gap-2" aria-label={label}>
      {data.map((d, i) => (
        <li
          key={`${d.label}-${i}`}
          tabIndex={0}
          onPointerEnter={() => setActive(i)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          className="flex flex-col gap-1 rounded-md py-1 md:grid md:grid-cols-[minmax(0,14rem)_1fr] md:items-center md:gap-3"
        >
          <span className="truncate text-sm text-drs-ink" title={d.label}>
            {d.label}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="h-5 shrink-0 rounded-r bg-drs-green transition-opacity"
              style={{
                width: `calc(${(d.value / max) * 100}% - 5rem)`,
                minWidth: 2,
                opacity: active === null || active === i ? 1 : 0.55,
              }}
            />
            <span className="shrink-0 text-sm font-medium text-drs-ink tabular-nums">{format(d.value)}</span>
            {active === i && d.detail && <span className="text-xs text-drs-ink/70">{d.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
