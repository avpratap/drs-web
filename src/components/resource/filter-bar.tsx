"use client";

import type { CrudFilter } from "@refinedev/core";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
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

const control = inputClass;

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
    <div className="mb-4 grid grid-cols-2 gap-3 md:flex md:flex-row md:flex-wrap md:items-end">
      {search && (
        <form
          role="search"
          className="col-span-2 flex w-full gap-2 md:w-auto md:min-w-80 md:flex-1 lg:max-w-md"
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
          <button type="submit" className={buttonClass("secondary")}>
            Search
          </button>
        </form>
      )}
      {others.map((d) => {
        const id = `f-${d.field}`;
        const value = currentFilter(filters, d.field);
        return (
          <div
            key={d.field}
            className={cn(
              "flex w-full min-w-0 flex-col gap-1.5",
              d.type === "select" ? "md:w-auto md:min-w-40 md:max-w-xs" : "md:w-44",
            )}
          >
            <label htmlFor={id} className="text-xs font-medium text-drs-ink/75">
              {d.label}
            </label>
            {d.type === "select" ? (
              <Select
                id={id}
                fit
                clearable
                emptyLabel={d.allLabel ?? "All"}
                placeholder={d.allLabel ?? "All"}
                value={value}
                options={d.options ?? []}
                onChange={(v) => onChange(d.field, v === "" ? undefined : String(v))}
              />
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
