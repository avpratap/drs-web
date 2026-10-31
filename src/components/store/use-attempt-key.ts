"use client";

import { useRef } from "react";
import { newIdempotencyKey } from "@/lib/api/resource";
import { keepKeyForRetry } from "@/modules/store/checkout";

type Key = { "Idempotency-Key": string };

/**
 * Idempotency-Key per attempt: the first try mints a fresh UUID; a retry after a network
 * error/5xx/409 re-sends the same one (the server replays, no duplicate order or payment);
 * after a definitive answer the next attempt starts fresh. Pass the request body (or anything
 * that identifies the action) as `scope`: a changed scope always gets a new key, since the
 * backend rejects a reused key with a different body (422).
 */
export function useAttemptKey() {
  const ref = useRef<{ key: Key; scope: string } | null>(null);
  const header = (scope?: unknown): Key => {
    const s = JSON.stringify(scope ?? null);
    if (!ref.current || ref.current.scope !== s) ref.current = { key: newIdempotencyKey(), scope: s };
    return ref.current.key;
  };
  const settle = (status: number | null) => {
    if (!keepKeyForRetry(status)) ref.current = null;
  };
  return {
    header,
    settle,
    /** One attempt of a write: sends the attempt's key and settles it from the outcome. */
    send: async <R extends { response: Response }>(scope: unknown, request: (headers: Key) => Promise<R>) => {
      const headers = header(scope);
      try {
        const r = await request(headers);
        settle(r.response.status);
        return r;
      } catch (e) {
        settle(null);
        throw e;
      }
    },
  };
}
