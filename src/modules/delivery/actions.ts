import { api } from "@/lib/api/browser";
import type { components } from "@/lib/api/client";
import { unwrap } from "@/lib/api/resource";

type S = components["schemas"];

export const deliveryActions = {
  markFailed: (orderId: number, v: Record<string, unknown>) =>
    unwrap(
      api.POST("/api/v1/delivery/orders/{order_id}/fail", {
        params: { path: { order_id: orderId } },
        body: v as S["FailIn"],
      }),
    ),
  generateInvoice: (deliveryOrderId: number) =>
    unwrap(
      api.POST("/api/v1/admin/invoices/generate", {
        params: { query: { delivery_order_id: deliveryOrderId } },
      }),
    ),
  cancelOrder: (orderId: number) =>
    unwrap(api.POST("/api/v1/admin/orders/{order_id}/cancel", { params: { path: { order_id: orderId } } })),
};
