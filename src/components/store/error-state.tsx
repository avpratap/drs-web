"use client";

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui/button";

/** Next's error-boundary props: `retry` refetches the segment's server data, then re-renders. */
export type BoundaryProps = { error: Error & { digest?: string }; reset: () => void; retry?: () => void };

/**
 * On-brand error panel for route error boundaries: a calm message, Try again (refetch +
 * re-render) and a way out. The heading takes focus so screen readers announce it; the
 * error's digest is shown as a reference for support (never the message — it can leak
 * server details).
 */
export function ErrorState({
  error,
  reset,
  retry,
  title = "Something went wrong",
  body = "We couldn't load this page just now. Please try again in a moment.",
  back = { href: "/", label: "Back to the shop" },
}: BoundaryProps & { title?: string; body?: string; back?: { href: string; label: string } }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center md:py-24">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-full bg-drs-maroon/10 text-drs-maroon"
      >
        <TriangleAlertIcon className="size-7" strokeWidth={1.75} />
      </span>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-5 text-2xl font-semibold tracking-tight text-drs-green outline-none md:text-3xl"
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-drs-ink/75 md:text-base">{body}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => (retry ?? reset)()}
          className={buttonClass("primary", "px-6", "pill")}
        >
          <RefreshCwIcon aria-hidden className="size-4" /> Try again
        </button>
        <Link href={back.href} className={buttonClass("secondary", "rounded-full px-6")}>
          {back.label}
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-drs-ink/70">Reference: {error.digest}</p>}
    </div>
  );
}
