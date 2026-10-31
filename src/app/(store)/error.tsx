"use client";

import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

/** Storefront pages: the header and footer stay, only the page content is replaced. */
export default function StoreError(props: BoundaryProps) {
  return <ErrorState {...props} />;
}
