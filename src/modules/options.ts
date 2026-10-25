import type { Option } from "@/components/resource/fields";

const opts = (...values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: (v.charAt(0).toUpperCase() + v.slice(1)).replace(/_/g, " ") }));

export const OPTIONS = {
  withdrawalStatus: opts("requested", "paid", "rejected"),
  paymentStatus: opts("initiated", "success", "failed"),
  paymentRefType: opts("order", "wallet_topup", "invoice"),
  refundStatus: opts("initiated", "pending", "processed", "failed"),
  refundOutcome: opts("processed", "failed"),
  accountType: opts("retail", "b2b"),
  billingMode: opts("prepaid_wallet", "postpaid_credit"),
  orderStatus: opts("created", "confirmed", "delivered", "cancelled"),
  orderPaymentStatus: opts("pending", "paid", "partially_refunded", "refunded"),
  deliveryStatus: opts("generated", "frozen", "delivered", "partially_delivered", "not_delivered", "failed"),
  failReason: opts("customer_unavailable", "address_wrong", "refused", "other"),
  stockReason: opts("receipt", "adjustment", "return"),
  locationKind: opts("plant", "hub", "cold_storage", "vehicle", "store", "warehouse"),
  activeInactive: opts("active", "inactive"),
  transferStatus: opts("draft", "in_transit", "received", "cancelled"),
  poStatus: opts("draft", "placed", "partially_received", "received", "cancelled"),
  productionStatus: opts("draft", "in_progress", "completed", "cancelled"),
  contentStatus: opts("draft", "published"),
  newsletterStatus: opts("pending", "subscribed", "unsubscribed"),
  ticketStatus: opts("open", "pending", "resolved", "closed"),
  ticketCategory: opts("order", "delivery", "payment", "product", "other"),
  ratingStatus: opts("pending", "approved", "rejected", "hidden"),
  discountType: opts("percent", "flat"),
  productStatus: opts("active", "retired"),
  rmaStatus: opts("requested", "approved", "rejected", "refunded", "cancelled"),
  subscriptionStatus: opts("active", "paused", "cancelled"),
  frequency: [
    { value: "daily", label: "Daily" },
    { value: "alternate", label: "Every N days" },
    { value: "weekly", label: "Weekly (pick days)" },
  ],
  userRole: opts("admin", "customer", "subscriber", "delivery"),
  userStatus: opts("active", "suspended", "erased"),
  assignmentState: [
    { value: "true", label: "Assigned" },
    { value: "false", label: "Removed" },
  ],
  giftCardStatus: opts("active", "redeemed", "expired", "disabled"),
  notificationStatus: opts("queued", "sent", "failed", "skipped"),
  churnRisk: opts("low", "medium", "high"),
  pointsReason: opts("adjust", "goodwill", "correction", "promo"),
  cutoffStatus: opts("generating", "frozen", "partial", "failed"),
} as const;
