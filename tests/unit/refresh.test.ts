import { describe, expect, it, vi } from "vitest";
import { createRefreshingFetch } from "@/lib/api/browser";

describe("createRefreshingFetch", () => {
  it("collapses concurrent 401s into ONE refresh and retries each request", async () => {
    let refreshed = false;
    const calls: string[] = [];
    const fake = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? new URL(input.url).pathname : String(input);
      calls.push(url);
      if (url === "/api/auth/refresh") {
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

  it("returns the 401 when refresh fails", async () => {
    const fake = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    const res = await createRefreshingFetch(fake)("http://x/api/backend/a");
    expect(res.status).toBe(401);
  });
});
