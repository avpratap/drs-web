"use client";

import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

export default function CartError(props: BoundaryProps) {
  return (
    <ErrorState
      {...props}
      title="We couldn't load your cart"
      body="Your items are safe — they're saved to your account. Please try again."
      back={{ href: "/products", label: "Keep shopping" }}
    />
  );
}
