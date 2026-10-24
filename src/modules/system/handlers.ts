import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { filterNumber, filterValue, fullList, pagedList, unwrap, type Handlers } from "@/lib/api/resource";

type S = components["schemas"];

export const systemHandlers: Handlers = {
  "audit-log": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/audit-log", {
          params: {
            query: {
              ...page,
              action: filterValue(filters, "action"),
              admin_user_id: filterNumber(filters, "admin_user_id"),
            },
          },
        }),
      ),
  },
  // Flags are keyed by `key`; expose it as `id` for Refine.
  "feature-flags": {
    list: async () => {
      const { data } = await fullList(api.GET("/api/v1/admin/feature-flags"));
      return { data: data.map((f) => ({ ...f, id: f.key })), total: data.length };
    },
    one: async (id) => {
      const f = await unwrap(
        api.GET("/api/v1/admin/feature-flags/{key}", { params: { path: { key: String(id) } } }),
      );
      return { ...f, id: f.key };
    },
    create: async (v) => {
      const f = await unwrap(api.PUT("/api/v1/admin/feature-flags", { body: v as S["FeatureFlagIn"] }));
      return { ...f, id: f.key };
    },
  },
};

export const systemActions = {
  upsertFlag: (v: S["FeatureFlagIn"]) => unwrap(api.PUT("/api/v1/admin/feature-flags", { body: v })),
};
