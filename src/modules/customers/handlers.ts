import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import {
  filterBool,
  filterNumber,
  filterValue,
  num,
  pagedList,
  unwrap,
  type Handlers,
} from "@/lib/api/resource";

type S = components["schemas"];

export const customerHandlers: Handlers = {
  tickets: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/support/tickets", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              category: filterValue(filters, "category"),
            },
          },
        }),
      ),
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/support/tickets/{ticket_id}", { params: { path: { ticket_id: num(id) } } }),
      ),
  },
  ratings: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/ratings", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              product_id: filterNumber(filters, "product_id"),
            },
          },
        }),
      ),
  },
  coupons: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/coupons", {
          params: { query: { ...page, active: filterBool(filters, "active") } },
        }),
      ),
    one: (id) =>
      unwrap(api.GET("/api/v1/admin/coupons/{coupon_id}", { params: { path: { coupon_id: num(id) } } })),
    create: (v) => unwrap(api.POST("/api/v1/admin/coupons", { body: v as S["CouponIn"] })),
    update: (id, v) =>
      unwrap(
        api.PATCH("/api/v1/admin/coupons/{coupon_id}", {
          params: { path: { coupon_id: num(id) } },
          body: v as S["CouponPatch"],
        }),
      ),
  },
};

type V = Record<string, unknown>;
export const customerActions = {
  replyTicket: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/support/tickets/{ticket_id}/messages", {
        params: { path: { ticket_id: id } },
        body: v as S["MessageIn"],
      }),
    ),
  setTicketStatus: (id: number, status: string) =>
    unwrap(
      api.POST("/api/v1/admin/support/tickets/{ticket_id}/status", {
        params: { path: { ticket_id: id } },
        body: { status } as S["StatusIn"],
      }),
    ),
  moderateRating: (id: number, status: string) =>
    unwrap(
      api.POST("/api/v1/admin/ratings/{rating_id}/moderate", {
        params: { path: { rating_id: id } },
        body: { status } as S["ModerateIn"],
      }),
    ),
  replyRating: (id: number, v: V) =>
    unwrap(
      api.POST("/api/v1/admin/ratings/{rating_id}/reply", {
        params: { path: { rating_id: id } },
        body: v as S["ReplyIn"],
      }),
    ),
  deactivateCoupon: (id: number) =>
    unwrap(api.POST("/api/v1/admin/coupons/{coupon_id}/deactivate", { params: { path: { coupon_id: id } } })),
};
