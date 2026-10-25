"use client";

import { useCallback, useEffect, useState } from "react";
import { detailOf } from "./cart";

type Call<T> = () => Promise<{ data?: T; error?: unknown; response: Response }>;

/**
 * Load one API resource for a client page: `data` (null while loading), a readable `error`,
 * and `reload()` after a write. The latest call wins.
 */
export function useLoad<T>(call: Call<T>, fallback: string) {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  const run = useCallback(async () => {
    try {
      const { data, error } = await call();
      return data !== undefined ? { data, error: null } : { data: null, error: detailOf(error) ?? fallback };
    } catch {
      return { data: null, error: "You seem to be offline." };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the call is fixed for the page
  }, []);
  useEffect(() => {
    let live = true;
    void run().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, [run]);
  const reload = useCallback(async () => setState(await run()), [run]);
  return { ...state, reload, setData: (data: T) => setState({ data, error: null }) };
}

export function LoadError({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-dashed border-drs-maroon/30 bg-drs-white px-6 py-10 text-center text-sm text-drs-maroon"
    >
      {text}
    </p>
  );
}

export function PanelSkeleton({ rows = 2, label }: { rows?: number; label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl bg-drs-ink/[0.06] motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
