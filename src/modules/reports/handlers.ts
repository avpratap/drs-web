import { api } from "@/lib/api/browser";
import { filterNumber, fullList, unwrap, type Handlers } from "@/lib/api/resource";

export const reportHandlers: Handlers = {
  // One-object reads keyed by id: "summary" | "overview".
  reports: {
    list: async () => ({ data: [], total: 0 }),
    async one(id) {
      if (id === "overview") return { id, ...(await unwrap(api.GET("/api/v1/admin/analytics/overview"))) };
      return { id: "summary", ...(await unwrap(api.GET("/api/v1/admin/reports/summary"))) };
    },
  },
  "analytics-revenue": {
    list: ({ filters }) =>
      fullList(
        api.GET("/api/v1/admin/analytics/revenue", {
          params: { query: { days: filterNumber(filters, "days") ?? 30 } },
        }),
      ),
  },
  "analytics-top-products": {
    list: ({ filters }) =>
      fullList(
        api.GET("/api/v1/admin/analytics/top-products", {
          params: {
            query: { days: filterNumber(filters, "days") ?? 30, limit: filterNumber(filters, "limit") ?? 10 },
          },
        }),
      ),
  },
};
