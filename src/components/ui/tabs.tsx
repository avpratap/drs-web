"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** WAI-ARIA tabs: arrow keys move between tabs, only the active panel is mounted. */
export function Tabs({
  tabs,
  initial,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  initial?: string;
}) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(
    0,
    tabs.findIndex((t) => t.id === active),
  );

  const onKey = (e: React.KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (idx + delta + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-drs-ink/10"
        onKeyDown={onKey}
      >
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative min-h-11 shrink-0 px-4 text-sm font-medium whitespace-nowrap",
                selected ? "text-drs-green" : "text-drs-ink/70 hover:text-drs-ink",
              )}
            >
              {t.label}
              {selected && (
                <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-drs-green" />
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((t) =>
        t.id === active ? (
          <div
            key={t.id}
            role="tabpanel"
            id={`${base}-panel-${t.id}`}
            aria-labelledby={`${base}-tab-${t.id}`}
          >
            {t.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
