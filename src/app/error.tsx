"use client";

import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

/** Last-resort boundary for any route under the root layout (storefront and admin). */
export default function RootError(props: BoundaryProps) {
  return (
    <main id="main" className="min-h-[60vh] bg-drs-cream">
      <ErrorState {...props} />
    </main>
  );
}
