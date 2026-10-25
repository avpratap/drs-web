/**
 * Online payments (Razorpay) are switched on with NEXT_PUBLIC_PAYMENTS_ENABLED=true once the
 * gateway keys are configured on the backend. Off (the default), orders are still placed and
 * shoppers see "pay on delivery — online payment coming soon"; nothing calls the gateway.
 * With it on but the backend in its dev stub (empty key_id), checkout runs a clearly
 * labelled test payment instead of opening Razorpay.
 */
export function paymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}
