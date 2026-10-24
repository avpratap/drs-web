import { createApiClient } from "./client";

export const BFF_BASE = "/api/backend";

/** Absolute BFF URL (relative Request URLs only resolve in browsers, not in Node/undici). */
function bffBase(): string {
  return typeof window === "undefined" ? BFF_BASE : `${window.location.origin}${BFF_BASE}`;
}
const LOCK_NAME = "drs-session-refresh";

let refreshing: Promise<boolean> | null = null;

type LockManagerLike = { request<T>(name: string, cb: () => Promise<T>): Promise<T> };

function lockManager(): LockManagerLike | undefined {
  const nav = typeof navigator === "undefined" ? undefined : (navigator as { locks?: LockManagerLike });
  return nav?.locks;
}

/**
 * Rotate the refresh token once, no matter how many requests got a 401 at the same time.
 * The backend treats reuse of a rotated refresh token as theft and revokes the whole
 * session family, so concurrent refreshes must collapse into a single call:
 * - within a tab, callers share one in-flight promise;
 * - across tabs, a Web Lock serialises refreshes. A tab that waited on the lock re-sends
 *   with the (shared) cookie the first tab rotated, so it never replays the old token.
 */
export function refreshSession(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const run = () =>
    fetchImpl(`${typeof window === "undefined" ? "" : window.location.origin}/api/auth/refresh`, {
      method: "POST",
      credentials: "same-origin",
    })
      .then((r) => r.ok)
      .catch(() => false);
  const locks = lockManager();
  refreshing ??= (locks ? locks.request(LOCK_NAME, run) : run()).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** `fetch` that retries a request once after a successful token refresh. */
export function createRefreshingFetch(fetchImpl: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, { credentials: "same-origin", ...init });
    const retry = request.clone();
    const res = await fetchImpl(request);
    if (res.status !== 401) return res;
    const ok = await refreshSession(fetchImpl);
    return ok ? fetchImpl(retry) : res;
  };
}

/** Typed client for browser code. All data flows through here. */
export const api = createApiClient({
  baseUrl: bffBase(),
  fetch: (input, init) => createRefreshingFetch(globalThis.fetch.bind(globalThis))(input, init),
});
