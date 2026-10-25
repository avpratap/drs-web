import type { Metadata } from "next";
import { CheckoutView } from "@/components/store/checkout-view";
import { paymentsEnabled } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <h1 className="mb-6 text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:mb-8 md:text-4xl">
        Checkout
      </h1>
      <CheckoutView paymentsEnabled={paymentsEnabled()} />
    </div>
  );
}
