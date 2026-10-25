import type { Tone } from "@/components/ui/badge";

/** The four steps a shopper sees, from the backend's order status. */
export const ORDER_STEPS = ["Placed", "Confirmed", "Out for delivery", "Delivered"] as const;

const STAGE: Record<string, number> = {
  created: 0,
  pending: 0,
  confirmed: 1,
  processing: 1,
  packed: 1,
  dispatched: 2,
  shipped: 2,
  in_transit: 2,
  out_for_delivery: 2,
  delivered: 3,
  completed: 3,
};

/** Index into ORDER_STEPS, or "cancelled" for cancelled/returned/failed orders. */
export function orderStage(status: string): number | "cancelled" {
  if (["cancelled", "canceled", "returned", "failed", "refunded"].includes(status)) return "cancelled";
  return STAGE[status] ?? 0;
}

export function orderStatusLabel(status: string): { label: string; tone: Tone } {
  const s = orderStage(status);
  if (s === "cancelled") return { label: status === "returned" ? "Returned" : "Cancelled", tone: "maroon" };
  return { label: ORDER_STEPS[s], tone: s === 3 ? "green" : s === 0 ? "neutral" : "sky" };
}

export function paymentLabel(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "paid":
      return { label: "Paid", tone: "green" };
    case "refunded":
    case "partially_refunded":
      return { label: status === "refunded" ? "Refunded" : "Partly refunded", tone: "neutral" };
    case "failed":
      return { label: "Payment failed", tone: "maroon" };
    default:
      return { label: "Payment due", tone: "gold" };
  }
}
