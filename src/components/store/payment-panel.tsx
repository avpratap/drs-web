"use client";

import { CreditCardIcon, FlaskConicalIcon, LockIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/browser";
import { detailOf } from "./cart";
import { rupees } from "./product-card";
import { payWithRazorpay } from "./razorpay";
import { useAttemptKey } from "./use-attempt-key";

type State =
  | { kind: "idle" }
  | { kind: "busy"; text: string }
  | { kind: "test"; gatewayOrderId: string }
  | { kind: "message"; text: string; tone: "info" | "error" };

const primary =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-drs-green px-6 text-base font-semibold text-drs-cream shadow-sm transition-colors hover:bg-drs-green/90 disabled:cursor-not-allowed disabled:bg-drs-ink/15 disabled:text-drs-ink/70 sm:w-auto";

/**
 * Pay for a placed order. Gateway handoff is GUARDED:
 * - payments off (no keys yet): "pay on delivery — online payment coming soon"; no gateway calls;
 * - on, backend in dev-stub mode (key_id ""): a labelled test payment (verify with signature "dev");
 * - on with keys: POST /payments/create (Idempotency-Key per attempt) → Razorpay Checkout →
 *   POST /payments/verify.
 */
export function PaymentPanel({
  orderId,
  orderNo,
  total,
  enabled,
  onPaid,
}: {
  orderId: number;
  orderNo: string;
  total: number;
  enabled: boolean;
  onPaid: () => void;
}) {
  const attempt = useAttemptKey();
  const [state, setState] = useState<State>({ kind: "idle" });

  if (!enabled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-drs-ink/10 bg-drs-white p-5 shadow-sm">
        <WalletIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
        <div className="text-sm">
          <h2 className="text-base font-semibold text-drs-ink">Pay on delivery</h2>
          <p className="mt-0.5 text-drs-ink/75">
            Online payment is coming soon. Please pay {rupees(total)} when your order arrives.
          </p>
        </div>
      </div>
    );
  }

  async function verify(gatewayOrderId: string, gatewayPaymentId: string, signature: string) {
    setState({ kind: "busy", text: "Confirming your payment…" });
    try {
      const { data, error } = await api.POST("/api/v1/payments/verify", {
        body: { gateway_order_id: gatewayOrderId, gateway_payment_id: gatewayPaymentId, signature },
      });
      if (data) return onPaid();
      setState({
        kind: "message",
        tone: "error",
        text: detailOf(error) ?? "We couldn't confirm the payment.",
      });
    } catch {
      setState({
        kind: "message",
        tone: "error",
        text: "You seem to be offline. Your payment is safe — try again.",
      });
    }
  }

  async function pay() {
    setState({ kind: "busy", text: "Opening secure payment…" });
    let status: number | null = null;
    try {
      const { data, error, response } = await api.POST("/api/v1/payments/create", {
        params: { header: attempt.header() },
        body: { purpose: "order_payment", order_id: orderId },
      });
      status = response.status;
      attempt.settle(status);
      if (!data) {
        setState({
          kind: "message",
          tone: "error",
          text: detailOf(error) ?? "We couldn't start the payment.",
        });
        return;
      }
      if (data.gateway_order_id.startsWith("free_")) return onPaid(); // fully discounted
      if (!data.key_id) return setState({ kind: "test", gatewayOrderId: data.gateway_order_id });
      const result = await payWithRazorpay({
        key: data.key_id,
        gatewayOrderId: data.gateway_order_id,
        amount: data.amount,
        description: `Order ${orderNo}`,
      });
      if (!result) {
        setState({
          kind: "message",
          tone: "info",
          text: "Payment not completed. You can try again any time.",
        });
        return;
      }
      await verify(result.razorpay_order_id, result.razorpay_payment_id, result.razorpay_signature);
    } catch {
      if (status === null) attempt.settle(null);
      setState({
        kind: "message",
        tone: "error",
        text: "We couldn't reach the payment service. Please try again.",
      });
    }
  }

  return (
    <section
      aria-labelledby="pay-heading"
      className="rounded-2xl border border-drs-green/20 bg-drs-white p-5 shadow-sm md:p-6"
    >
      <div className="flex items-start gap-3">
        <CreditCardIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-drs-green" />
        <div className="min-w-0 flex-1">
          <h2 id="pay-heading" className="text-base font-semibold text-drs-ink">
            Complete your payment
          </h2>
          <p className="mt-0.5 text-sm text-drs-ink/75">UPI, cards and netbanking via Razorpay.</p>
        </div>
      </div>

      {state.kind === "test" ? (
        <div className="mt-4 rounded-xl border border-dashed border-drs-gold bg-drs-cream/60 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-drs-ink">
            <FlaskConicalIcon aria-hidden className="size-4 text-drs-green" /> Test mode — no real money moves
          </p>
          <p className="mt-1 text-drs-ink/75">
            The payment gateway isn&apos;t connected yet, so this simulates a successful payment.
          </p>
          <button
            type="button"
            className={`${primary} mt-3`}
            onClick={() => verify(state.gatewayOrderId, `pay_test_${Date.now()}`, "dev")}
          >
            Complete test payment · {rupees(total)}
          </button>
        </div>
      ) : (
        <button type="button" onClick={pay} disabled={state.kind === "busy"} className={`${primary} mt-4`}>
          <LockIcon aria-hidden className="size-4" />
          {state.kind === "busy" ? state.text : `Pay ${rupees(total)} securely`}
        </button>
      )}
      <p
        role={state.kind === "message" && state.tone === "error" ? "alert" : "status"}
        className={`mt-3 min-h-5 text-sm ${state.kind === "message" && state.tone === "error" ? "text-drs-maroon" : "text-drs-ink/80"}`}
      >
        {state.kind === "message" ? state.text : ""}
      </p>
    </section>
  );
}
