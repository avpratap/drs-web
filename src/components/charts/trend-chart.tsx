"use client";

import { useState } from "react";
import { DRS } from "@/lib/brand";
import { compactINR, niceTicks } from "./scale";
import { useWidth } from "./use-width";

export type Point = { x: string; y: number };

const H = 220;
const M = { top: 12, right: 16, bottom: 28, left: 48 };
const MARK = DRS.green;
const SURFACE = DRS.white;
const GRID = "rgba(30, 26, 30, 0.1)"; // ink @ 10% — recessive hairline
const AXIS_TEXT = "rgba(30, 26, 30, 0.7)"; // ink @ 70% — ≥4.5:1 on white

/**
 * Single-series trend. `kind="area"` draws a 2px line over a 10% wash with a crosshair
 * that snaps to the nearest day; `kind="column"` draws ≤24px columns with a 4px rounded
 * cap and per-column hover. Keyboard: focus the plot and use ←/→ to move the readout.
 */
export function TrendChart({
  data,
  kind = "area",
  label,
  format,
  tickFormat = compactINR,
  xLabel = (x: string) => x.slice(5),
}: {
  data: Point[];
  kind?: "area" | "column";
  label: string;
  format: (n: number) => string;
  tickFormat?: (n: number) => string;
  xLabel?: (x: string) => string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const n = data.length;
  const iw = width - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.y)));
  const top = ticks[ticks.length - 1] || 1;
  const band = n ? iw / n : iw;
  const xAt = (i: number) =>
    kind === "column" ? M.left + band * i + band / 2 : M.left + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  const yAt = (v: number) => M.top + ih - (ih * v) / top;
  const barW = Math.min(24, Math.max(2, band - 2));
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));

  const line = data.map((d, i) => `${i ? "L" : "M"}${xAt(i)},${yAt(d.y)}`).join("");
  const area = n ? `${line}L${xAt(n - 1)},${yAt(0)}L${xAt(0)},${yAt(0)}Z` : "";

  const nearest = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * width;
    if (kind === "column") return Math.min(n - 1, Math.max(0, Math.floor((x - M.left) / band)));
    return Math.min(n - 1, Math.max(0, Math.round(((x - M.left) / iw) * (n - 1))));
  };

  const a = active !== null ? data[active] : null;

  return (
    <div ref={ref} className="relative mt-3 w-full min-w-0 overflow-hidden">
      {n === 0 ? (
        <p className="grid h-[220px] place-items-center text-sm text-drs-ink/70">No data for this period.</p>
      ) : (
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`${label}: ${n} days, latest ${format(data[n - 1].y)}. Use the data table for every value.`}
          tabIndex={0}
          className="block touch-pan-y outline-offset-4"
          onPointerMove={(e) => setActive(nearest(e.clientX, e.currentTarget))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? n - 1) - 1));
            if (e.key === "ArrowRight") setActive((i) => Math.min(n - 1, (i ?? 0) + 1));
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={yAt(t)} y2={yAt(t)} stroke={GRID} strokeWidth={1} />
              <text
                x={M.left - 8}
                y={yAt(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill={AXIS_TEXT}
                className="tabular-nums"
              >
                {tickFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % every === 0 ? (
              <text key={d.x} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                {xLabel(d.x)}
              </text>
            ) : null,
          )}
          {kind === "area" ? (
            <>
              <path d={area} fill={MARK} fillOpacity={0.1} />
              <path
                d={line}
                fill="none"
                stroke={MARK}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {a && (
                <>
                  <line
                    x1={xAt(active!)}
                    x2={xAt(active!)}
                    y1={M.top}
                    y2={M.top + ih}
                    stroke={AXIS_TEXT}
                    strokeWidth={1}
                  />
                  <circle
                    cx={xAt(active!)}
                    cy={yAt(a.y)}
                    r={5}
                    fill={MARK}
                    stroke={SURFACE}
                    strokeWidth={2}
                  />
                </>
              )}
              {/* End marker + direct label on the latest value. */}
              <circle
                cx={xAt(n - 1)}
                cy={yAt(data[n - 1].y)}
                r={4}
                fill={MARK}
                stroke={SURFACE}
                strokeWidth={2}
              />
            </>
          ) : (
            data.map((d, i) => {
              const x = xAt(i) - barW / 2;
              const y = yAt(d.y);
              const h = Math.max(0, yAt(0) - y);
              const r = Math.min(4, barW / 2, h);
              // Rounded data-end (top), square at the baseline.
              const path = `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + barW - r}Q${x + barW},${y} ${x + barW},${y + r}V${y + h}Z`;
              return (
                <path
                  key={d.x}
                  d={path}
                  fill={MARK}
                  fillOpacity={active === null || active === i ? 1 : 0.55}
                />
              );
            })
          )}
        </svg>
      )}
      {a && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-md border border-drs-ink/10 bg-drs-white px-3 py-2 text-xs shadow-md"
          style={{ left: Math.min(Math.max(0, xAt(active!) - 60), width - 140) }}
        >
          <span className="block text-sm font-semibold text-drs-ink tabular-nums">{format(a.y)}</span>
          <span className="flex items-center gap-1.5 text-drs-ink/70">
            <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ background: MARK }} />
            {label} · {a.x}
          </span>
        </div>
      )}
    </div>
  );
}
