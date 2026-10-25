import { afterEach, describe, expect, it, vi } from "vitest";
import { createRefreshingFetch, refreshSession } from "@/lib/api/browser";

const pathOf = (input: RequestInfo | URL) =>
  new URL(input instanceof Request ? input.url : String(input), "http://x").pathname;

describe("createRefreshingFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("collapses concurrent 401s into ONE refresh and retries each request", async () => {
    window.history.replaceState({}, "", "/admin/products"); // admin zone refreshes via /api/auth
    let refreshed = false;
    const calls: string[] = [];
    const fake = vi.fn(async (input: RequestInfo | URL) => {
      const path = pathOf(input);
      calls.push(path);
      if (path === "/api/auth/refresh") {
        await new Promise((r) => setTimeout(r, 10));
        refreshed = true;
        return new Response("{}", { status: 200 });
      }
      return new Response("{}", { status: refreshed ? 200 : 401 });
    }) as unknown as typeof fetch;

    const f = createRefreshingFetch(fake);
    const [a, b] = await Promise.all([f("http://x/api/backend/a"), f("http://x/api/backend/b")]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(calls.filter((c) => c === "/api/auth/refresh")).toHaveLength(1);
  });

  it("refreshes a storefront session via /api/store-auth", async () => {
    window.history.replaceState({}, "", "/account");
    const calls: string[] = [];
    const fake = (async (input: RequestInfo | URL) => {
      calls.push(pathOf(input));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    expect(await refreshSession(fake)).toBe(true);
    expect(calls).toEqual(["/api/store-auth/refresh"]);
  });

  it("returns the 401 when refresh fails", async () => {
    const fake = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    const res = await createRefreshingFetch(fake)("http://x/api/backend/a");
    expect(res.status).toBe(401);
  });

  it("serialises refreshes across tabs with the Web Locks API when available", async () => {
    const request = vi.fn(async (_name: string, cb: () => Promise<boolean>) => cb());
    vi.stubGlobal("navigator", { ...navigator, locks: { request } });
    const fake = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    expect(await refreshSession(fake)).toBe(true);
    expect(request).toHaveBeenCalledWith("drs-session-refresh", expect.any(Function));
  });
});
