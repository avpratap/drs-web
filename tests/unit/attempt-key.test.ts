import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAttemptKey } from "@/components/store/use-attempt-key";

const ok = (status: number) => Promise.resolve({ response: new Response(null, { status }) });

describe("useAttemptKey", () => {
  it("re-sends the same key when an attempt is retried after a network error or 5xx", async () => {
    const { result } = renderHook(() => useAttemptKey());
    const seen: string[] = [];
    const send = (scope: unknown, status: number | "offline") =>
      result.current
        .send(scope, (h) => {
          seen.push(h["Idempotency-Key"]);
          return status === "offline" ? Promise.reject(new TypeError("offline")) : ok(status);
        })
        .catch(() => undefined);
    await send({ code: "A" }, "offline");
    await send({ code: "A" }, 503);
    await send({ code: "A" }, 200);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    // After a definitive answer the next attempt is a new action.
    await send({ code: "A" }, 200);
    expect(seen[3]).not.toBe(seen[0]);
  });

  it("mints a new key when the request changes (a reused key with a new body is a 422)", async () => {
    const { result } = renderHook(() => useAttemptKey());
    const seen: string[] = [];
    const send = (scope: unknown) =>
      result.current
        .send(scope, (h) => {
          seen.push(h["Idempotency-Key"]);
          return Promise.reject(new TypeError("offline"));
        })
        .catch(() => undefined);
    await send({ code: "A" });
    await send({ code: "B" });
    expect(seen[1]).not.toBe(seen[0]);
    expect(seen[0]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
