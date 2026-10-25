import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { filterNumber, filterValue, num, pagedList, unwrap, type Handlers } from "@/lib/api/resource";

type S = components["schemas"];

type RmaStatus = "requested" | "approved" | "rejected" | "refunded" | "cancelled";
type SubStatus = "active" | "paused" | "cancelled";

export const operationsHandlers: Handlers = {
  returns: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/returns", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status") as RmaStatus | undefined,
              account_id: filterNumber(filters, "account_id"),
              order_id: filterNumber(filters, "order_id"),
            },
          },
        }),
      ),
    one: (id) => unwrap(api.GET("/api/v1/admin/returns/{rr_id}", { params: { path: { rr_id: num(id) } } })),
  },
  subscriptions: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/subscriptions", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status") as SubStatus | undefined,
              account_id: filterNumber(filters, "account_id"),
              shop_id: filterNumber(filters, "shop_id"),
            },
          },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/subscriptions/{sub_id}", { params: { path: { sub_id: num(id) } } })),
  },
  shops: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/shops", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status") as "active" | "inactive" | undefined,
              account_id: filterNumber(filters, "account_id"),
              price_tier_id: filterNumber(filters, "price_tier_id"),
              q: filterValue(filters, "q"),
            },
          },
        }),
      ),
    one: (id) => unwrap(api.GET("/api/v1/admin/shops/{shop_id}", { params: { path: { shop_id: num(id) } } })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/shops/{shop_id}", {
          params: { path: { shop_id: num(id) } },
          body: v as S["ShopPatch"],
        }),
      ),
  },
  users: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/users", {
          params: {
            query: {
              ...page,
              role: filterValue(filters, "role") as
                "admin" | "customer" | "subscriber" | "delivery" | undefined,
              status_filter: filterValue(filters, "status") as "active" | "suspended" | "erased" | undefined,
              q: filterValue(filters, "q"),
            },
          },
        }),
      ),
  },
  "cutoff-runs": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/cutoff/runs", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status") as
                "generating" | "frozen" | "partial" | "failed" | undefined,
              date_from: filterValue(filters, "date_from"),
              date_to: filterValue(filters, "date_to"),
            },
          },
        }),
      ),
  },
  // Singleton read: id is ignored.
  "cutoff-status": {
    list: async () => ({ data: [], total: 0 }),
    one: async () => ({ id: "status", ...(await unwrap(api.GET("/api/v1/admin/cutoff/status"))) }),
  },
};

type V = Record<string, unknown>;

export const operationsActions = {
  approveReturn: (id: number) =>
    unwrap(api.POST("/api/v1/admin/returns/{rr_id}/approve", { params: { path: { rr_id: id } } })),
  rejectReturn: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/returns/{rr_id}/reject", {
        params: { path: { rr_id: id } },
        body: v as S["RejectIn"],
      }),
    ),
  refundReturn: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/returns/{rr_id}/refund", {
        params: { path: { rr_id: id } },
        body: v as S["app__api__v1__rma__RefundIn"],
      }),
    ),
  setSubscriptionItems: (id: number, items: S["ItemIn"][]) =>
    unwrap(
      api.PUT("/api/v1/subscriptions/{sub_id}/items", { params: { path: { sub_id: id } }, body: items }),
    ),
  pauseSubscription: (id: number) =>
    unwrap(api.POST("/api/v1/subscriptions/{sub_id}/pause", { params: { path: { sub_id: id } } })),
  resumeSubscription: (id: number) =>
    unwrap(api.POST("/api/v1/subscriptions/{sub_id}/resume", { params: { path: { sub_id: id } } })),
  cancelSubscription: (id: number) =>
    unwrap(api.POST("/api/v1/subscriptions/{sub_id}/cancel", { params: { path: { sub_id: id } } })),
  setShopTier: (shopId: number, priceTierId: number) =>
    unwrap(
      api.POST("/api/v1/admin/shops/{shop_id}/tier", {
        params: { path: { shop_id: shopId } },
        body: { price_tier_id: priceTierId },
      }),
    ),
  setShopStatus: (shopId: number, status: "active" | "inactive") =>
    unwrap(
      api.PATCH("/api/v1/admin/shops/{shop_id}", { params: { path: { shop_id: shopId } }, body: { status } }),
    ),
  assignDriver: (shopId: number, deliveryId: number) =>
    unwrap(
      api.POST("/api/v1/admin/delivery-assignments", { body: { shop_id: shopId, delivery_id: deliveryId } }),
    ),
  unassignDriver: (assignmentId: number) =>
    unwrap(
      api.DELETE("/api/v1/admin/delivery-assignments/{assignment_id}", {
        params: { path: { assignment_id: assignmentId } },
      }),
    ),
  runCutoff: (date: string | undefined, force: boolean) =>
    unwrap(api.POST("/api/v1/admin/cutoff/run", { params: { query: { date: date || undefined, force } } })),
};
