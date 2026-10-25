"use client";

import { useRef } from "react";
import { idem } from "@/lib/api/resource";
import { keepKeyForRetry } from "@/modules/store/checkout";

/**
 * Idempotency-Key per attempt: the first try mints a fresh UUID; a retry after a network
 * error/5xx/409 re-sends the same one (the server replays, no duplicate order or payment);
 * after a definitive answer the next attempt starts fresh.
 */
export function useAttemptKey() {
  const ref = useRef<{ "Idempotency-Key": string } | null>(null);
  return {
    header: () => (ref.current ??= idem()),
    settle: (status: number | null) => {
      if (!keepKeyForRetry(status)) ref.current = null;
    },
  };
}
