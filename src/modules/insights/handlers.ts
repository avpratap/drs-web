import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { filterValue, num, pagedList, unwrap, type Handlers } from "@/lib/api/resource";

type S = components["schemas"];

export const insightsHandlers: Handlers = {
  // Churn rows are keyed by account; expose it as `id` for Refine.
  churn: {
    list: async ({ pagination, filters }) => {
      const r = await pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/ml/churn", {
          params: { query: { ...page, risk: filterValue(filters, "risk") } },
        }),
      );
      return { ...r, data: r.data.map((c) => ({ ...c, id: c.account_id })) };
    },
  },
  // Singleton read (id ignored): the production plan for meta.date / meta.historyDays.
  forecast: {
    list: async () => ({ data: [], total: 0 }),
    one: async (_id, meta) => {
      const m = (meta ?? {}) as { date?: string; historyDays?: number };
      const f = await unwrap(
        api.GET("/api/v1/admin/forecast", {
          params: { query: { date: m.date || undefined, history_days: m.historyDays } },
        }),
      );
      return { id: "plan", ...f, plan: f.plan as ForecastLine[] };
    },
  },
  invoices: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) => api.GET("/api/v1/invoices", { params: { query: page } })),
    one: (id) =>
      unwrap(api.GET("/api/v1/invoices/{invoice_id}", { params: { path: { invoice_id: num(id) } } })),
  },
};

export type ForecastLine = {
  product_id: number;
  product_name?: string | null;
  committed_qty: number;
  forecast_variable_qty: number;
  safety_qty: number;
  recommended_production: number;
  method: string;
};

export const insightsActions = {
  runChurnScoring: () => unwrap(api.POST("/api/v1/admin/ml/churn/score")),
  askCopilot: (message: string) => unwrap(api.POST("/api/v1/admin/ai/ask", { body: { message } })),
  invoicePdf: (id: number) =>
    unwrap(api.GET("/api/v1/invoices/{invoice_id}/pdf", { params: { path: { invoice_id: id } } })),
  /** Issue (or fetch the existing) invoice for a paid one-time order. */
  orderInvoice: (orderId: number) =>
    unwrap(api.POST("/api/v1/orders/{order_id}/invoice", { params: { path: { order_id: orderId } } })),
};

export type Invoice = S["InvoiceOut"];
