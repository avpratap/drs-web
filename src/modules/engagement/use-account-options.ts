"use client";

import { useList } from "@refinedev/core";
import type { components } from "@/lib/api/client";

type Account = components["schemas"]["AccountRow"];

/** Customer accounts as Select options ("Name · phone"), plus a name lookup by id. */
export function useAccountOptions() {
  const { result, query } = useList<Account>({ resource: "accounts", pagination: { pageSize: 200 } });
  const label = (a: Account) => [a.full_name || `Account #${a.id}`, a.phone].filter(Boolean).join(" · ");
  const byId = new Map(result.data.map((a) => [a.id, a]));
  return {
    loading: query.isLoading,
    options: result.data.map((a) => ({ value: a.id, label: label(a) })),
    name: (id: number | null | undefined) => {
      if (id == null) return undefined;
      const a = byId.get(id);
      return a ? label(a) : `Account #${id}`;
    },
  };
}
