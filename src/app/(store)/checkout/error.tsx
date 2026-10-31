"use client";

import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

export default function CheckoutError(props: BoundaryProps) {
  return (
    <ErrorState
      {...props}
      title="Checkout hit a problem"
      body="No order was placed and you haven't been charged. Please try again, or check your orders if you'd already confirmed."
      back={{ href: "/cart", label: "Back to cart" }}
    />
  );
}
