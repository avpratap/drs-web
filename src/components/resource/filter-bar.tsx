"use client";

import type { CrudFilter } from "@refinedev/core";
import { useState } from "react";
import type { Option } from "./fields";

export type FilterDef = {
  field: string;
  label: string;
  type: "search" | "select" | "date" | "number";
  options?: Option[] | readonly Option[];
  placeholder?: string;
  /** Label for the empty select option. */
  allLabel?: string;
};

const control =
  "min-h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white px-3 text-sm text-drs-ink placeholder:text-drs-ink/70";

export function currentFilter(filters: CrudFilter[], field: string): string {
  const f = filters.find((x) => "field" in x && x.field === field);
  return f && f.value != null ? String(f.value) : "";
}

/** Inline filters for a list: selects/dates apply immediately, search applies on submit. */
export function FilterBar({
  defs,
  filters,
  onChange,
}: {
  defs: FilterDef[];
  filters: CrudFilter[];
  onChange: (field: string, value: string | undefined) => void;
}) {
  const search = defs.find((d) => d.type === "search");
  const [q, setQ] = useState(search ? currentFilter(filters, search.field) : "");
  const others = defs.filter((d) => d.type !== "search");

  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      {search && (
        <form
          role="search"
          className="flex w-full gap-2 md:w-auto md:min-w-80 md:flex-1 lg:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            onChange(search.field, q.trim() || undefined);
          }}
        >
          <label htmlFor={`f-${search.field}`} className="sr-only">
            {search.label}
          </label>
          <input
            id={`f-${search.field}`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={search.placeholder ?? search.label}
            className={control}
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg border border-drs-green/30 bg-drs-white px-4 text-sm font-medium text-drs-green hover:border-drs-green"
          >
            Search
          </button>
        </form>
      )}
      {others.map((d) => {
        const id = `f-${d.field}`;
        const value = currentFilter(filters, d.field);
        return (
          <div key={d.field} className="flex w-full flex-col gap-1.5 md:w-48">
            <label htmlFor={id} className="text-xs font-medium text-drs-ink/75">
              {d.label}
            </label>
            {d.type === "select" ? (
              <select
                id={id}
                value={value}
                onChange={(e) => onChange(d.field, e.target.value || undefined)}
                className={control}
              >
                <option value="">{d.allLabel ?? "All"}</option>
                {d.options?.map((o) => (
                  <option key={String(o.value)} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type={d.type}
                value={value}
                placeholder={d.placeholder}
                onChange={(e) => onChange(d.field, e.target.value || undefined)}
                className={control}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
