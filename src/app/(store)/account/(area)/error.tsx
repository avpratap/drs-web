"use client";

import { ErrorState, type BoundaryProps } from "@/components/store/error-state";

/** Account pages: the account nav stays, only the section is replaced. */
export default function AccountError(props: BoundaryProps) {
  return (
    <ErrorState
      {...props}
      title="We couldn't load this section"
      body="Your account is fine — this page just didn't load. Please try again."
      back={{ href: "/account", label: "Account overview" }}
    />
  );
}
