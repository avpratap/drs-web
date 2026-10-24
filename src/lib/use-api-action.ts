"use client";

import { useInvalidate, useNotification, type HttpError } from "@refinedev/core";
import { useCallback, useState } from "react";
import { toHttpError } from "@/lib/api/errors";

type Options = {
  /** Toast shown on success. */
  success?: string;
  /** Resources whose list/detail queries should refetch afterwards. */
  invalidate?: string[];
};

function asHttpError(e: unknown): HttpError {
  if (e && typeof e === "object" && "statusCode" in e && "message" in e) return e as HttpError;
  return toHttpError(null, 0);
}

/**
 * Run a one-off API action (approve, publish, dispatch…) with a pending flag, a toast
 * on success/failure, and query invalidation so tables refresh.
 */
export function useApiAction() {
  const [pending, setPending] = useState(false);
  const { open } = useNotification();
  const invalidate = useInvalidate();

  const run = useCallback(
    async <T>(fn: () => Promise<T>, opts: Options = {}): Promise<T | undefined> => {
      setPending(true);
      try {
        const out = await fn();
        if (opts.success) open?.({ type: "success", message: opts.success });
        await Promise.all(
          (opts.invalidate ?? []).map((resource) => invalidate({ resource, invalidates: ["resourceAll"] })),
        );
        return out;
      } catch (e) {
        const err = asHttpError(e);
        open?.({ type: "error", message: err.message, description: errorDetails(err) });
        throw err;
      } finally {
        setPending(false);
      }
    },
    [open, invalidate],
  );

  return { run, pending };
}

function errorDetails(err: HttpError): string | undefined {
  const entries = Object.entries(err.errors ?? {});
  if (!entries.length) return undefined;
  return entries.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join("; ");
}
