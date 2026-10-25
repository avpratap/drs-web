"use client";

import { DRS } from "@/lib/brand";

/** Minimal typing for Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/). */
export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description?: string;
  prefill?: { contact?: string; name?: string };
  theme?: { color?: string };
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayCtor = new (o: RazorpayOptions) => {
  open: () => void;
  on: (e: string, cb: (r: unknown) => void) => void;
};

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<RazorpayCtor> | null = null;

function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("Razorpay unavailable")));
    s.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load the payment window"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Open Razorpay Checkout; resolves with the signed result, or null if the shopper closed it. */
export async function payWithRazorpay(o: {
  key: string;
  gatewayOrderId: string;
  amount: number;
  description: string;
}): Promise<RazorpaySuccess | null> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve) => {
    const rz = new Razorpay({
      key: o.key,
      order_id: o.gatewayOrderId,
      amount: Math.round(o.amount * 100),
      currency: "INR",
      name: "DRS Dairy",
      description: o.description,
      theme: { color: DRS.green },
      handler: (r) => resolve(r),
      modal: { ondismiss: () => resolve(null) },
    });
    rz.open();
  });
}
