"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, shopHref, type ShopParams } from "@/modules/store/shop";

export function SortSelect({ params }: { params: ShopParams }) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <span id={id} className="text-sm whitespace-nowrap text-drs-ink/75">
        Sort by
      </span>
      <Select
        aria-labelledby={id}
        fit
        value={params.sort ?? "featured"}
        options={SORT_OPTIONS}
        onChange={(v) => router.push(shopHref({ ...params, sort: String(v) }), { scroll: false })}
        className="min-w-0"
      />
    </div>
  );
}

/** Name search scoped to the current category/sort; a plain GET form, so it works before hydration. */
export function ShopSearch({ params, className }: { params: ShopParams; className?: string }) {
  const id = useId();
  return (
    <form role="search" aria-label="Shop" action="/products" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search the shop
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-drs-ink/70"
      />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={params.q ?? ""}
        placeholder="Search by name"
        className="h-11 w-full rounded-lg border border-drs-ink/20 bg-drs-white pr-3 pl-10 text-sm text-drs-ink transition-colors placeholder:text-drs-ink/70 hover:border-drs-green/50 focus-visible:border-drs-green"
      />
      {params.category && <input type="hidden" name="category" value={params.category} />}
      {params.sort && params.sort !== "featured" && <input type="hidden" name="sort" value={params.sort} />}
    </form>
  );
}
