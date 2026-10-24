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

/**
 * POD media URLs are short-lived signed links. In dev the backend returns a path on the
 * API host ("/files/…"), so make those absolute against the API origin.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${(process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "")}${url}`;
  return /^https?:\/\//.test(url) ? url : null;
}
