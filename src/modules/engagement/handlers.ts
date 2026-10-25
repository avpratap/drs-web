import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { toHttpError } from "@/lib/api/errors";
import { filterNumber, filterValue, num, pagedList, unwrap, type Handlers } from "@/lib/api/resource";

type S = components["schemas"];

/** One idempotency key per submitted action, so a retried request can't double-issue. */
const idem = () => ({ "Idempotency-Key": crypto.randomUUID() });

export const engagementHandlers: Handlers = {
  "gift-cards": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/gift-cards", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              issued_to: filterNumber(filters, "issued_to"),
            },
          },
        }),
      ),
  },
  // Loyalty rows are keyed by account; expose it as `id` for Refine.
  loyalty: {
    list: async ({ pagination }) => {
      const r = await pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/loyalty", { params: { query: page } }),
      );
      return { ...r, data: r.data.map((a) => ({ ...a, id: a.account_id })) };
    },
  },
  notifications: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/notifications", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              user_id: filterNumber(filters, "user_id"),
            },
          },
        }),
      ),
  },
  webhooks: {
    list: ({ pagination }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/outbound-webhooks", { params: { query: page } }),
      ),
    // No single-read endpoint: find it in the (small) list.
    one: async (id) => {
      const rows = await unwrap(
        api.GET("/api/v1/admin/outbound-webhooks", { params: { query: { limit: 200 } } }),
      );
      const hook = rows.find((h) => h.id === num(id));
      if (!hook) throw toHttpError({ detail: "Webhook not found" }, 404);
      return hook;
    },
  },
  "webhook-deliveries": {
    list: ({ pagination, meta }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/outbound-webhooks/{hook_id}/deliveries", {
          params: { path: { hook_id: num((meta as { hookId: number }).hookId) }, query: page },
        }),
      ),
  },
};

type V = Record<string, unknown>;

export const engagementActions = {
  issueGiftCard: (v: V) =>
    unwrap(api.POST("/api/v1/admin/gift-cards", { params: { header: idem() }, body: v as S["IssueGiftIn"] })),
  voidGiftCard: (id: number) =>
    unwrap(api.POST("/api/v1/admin/gift-cards/{card_id}/void", { params: { path: { card_id: id } } })),
  adjustPoints: (accountId: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/loyalty/{account_id}/adjust", {
        params: { path: { account_id: accountId }, header: idem() },
        body: v as S["AdjustPointsIn"],
      }),
    ),
  resendNotification: (id: number) =>
    unwrap(api.POST("/api/v1/admin/notifications/{notif_id}/resend", { params: { path: { notif_id: id } } })),
  testNotification: (v: V) =>
    unwrap(api.POST("/api/v1/admin/notifications/test", { body: v as S["NotifyTestIn"] })),
  flushNotifications: () => unwrap(api.POST("/api/v1/admin/notifications/flush", { params: { query: {} } })),
  createWebhook: (v: V) => unwrap(api.POST("/api/v1/admin/outbound-webhooks", { body: v as S["WebhookIn"] })),
  updateWebhook: (id: number, v: V) =>
    unwrap(
      api.PATCH("/api/v1/admin/outbound-webhooks/{hook_id}", {
        params: { path: { hook_id: id } },
        body: v as S["WebhookPatch"],
      }),
    ),
  deleteWebhook: (id: number) =>
    unwrap(api.DELETE("/api/v1/admin/outbound-webhooks/{hook_id}", { params: { path: { hook_id: id } } })),
  testWebhook: (id: number) =>
    unwrap(api.POST("/api/v1/admin/outbound-webhooks/{hook_id}/test", { params: { path: { hook_id: id } } })),
};
