import { api } from "@/lib/api/browser";
import { filterNumber, filterValue, num, pagedList, unwrap, type Handlers } from "@/lib/api/resource";
import { todayIST } from "@/lib/forms";

export const deliveryHandlers: Handlers = {
  "delivery-orders": {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/delivery/orders", {
          params: { query: { ...page, date: filterValue(filters, "date") ?? todayIST() } },
        }),
      ),
    // Detail = the fulfilment record (order + POD + cash + returns).
    one: (id) =>
      unwrap(
        api.GET("/api/v1/admin/delivery-orders/{order_id}/fulfillment", {
          params: { path: { order_id: num(id) } },
        }),
      ),
  },
  // id = the delivery date (YYYY-MM-DD).
  "delivery-summary": {
    list: async () => ({ data: [], total: 0 }),
    one: async (id) => {
      const s = await unwrap(
        api.GET("/api/v1/delivery/summary", { params: { query: { date: String(id) } } }),
      );
      return { ...s, id: s.date };
    },
  },
  orders: {
    list: ({ pagination, filters }) =>
      pagedList(pagination, (page) =>
        api.GET("/api/v1/admin/orders", {
          params: {
            query: {
              ...page,
              status_filter: filterValue(filters, "status"),
              payment_status: filterValue(filters, "payment_status"),
              account_id: filterNumber(filters, "account_id"),
              shop_id: filterNumber(filters, "shop_id"),
              date_from: filterValue(filters, "date_from"),
              date_to: filterValue(filters, "date_to"),
            },
          },
        }),
      ),
    one: (id) => unwrap(api.GET("/api/v1/orders/{order_id}", { params: { path: { order_id: num(id) } } })),
  },
};
