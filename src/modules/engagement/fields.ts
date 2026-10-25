import type { FieldDef } from "@/components/resource/fields";

/** Event types the backend knows (its notification templates); webhooks subscribe by name. */
export const EVENT_TYPES = [
  "order.generated",
  "delivery.completed",
  "payment.success",
  "payment.failed",
  "payment.refunded",
  "wallet.low",
  "subscription.created",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
  "shipment.delivered",
  "review.request",
  "marketing.winback",
  "marketing.promo",
].map((e) => ({ value: e, label: e }));

/** Create/edit fields. The secret is write-only: blank on edit keeps the current one. */
export const webhookFields = (edit = false): FieldDef[] => [
  { name: "event_type", label: "Event", type: "select", required: true, options: EVENT_TYPES },
  {
    name: "url",
    label: "Endpoint URL",
    type: "url",
    required: true,
    maxLength: 512,
    wide: true,
    placeholder: "https://example.com/hooks/drs",
    pattern: { value: /^https?:\/\/\S+$/, message: "Must be an http(s) URL" },
  },
  {
    name: "secret",
    label: "Signing secret",
    maxLength: 128,
    wide: true,
    hint: edit
      ? "Leave blank to keep the current secret."
      : "Optional. Deliveries are signed with HMAC-SHA256 in X-DRS-Signature.",
  },
  { name: "active", label: "Active", type: "checkbox" },
];
