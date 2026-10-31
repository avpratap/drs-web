import { describe, expect, it, vi } from "vitest";
import { findById } from "@/lib/api/resource";

const pageOf = (rows: { id: number }[]) =>
  Promise.resolve({ data: rows, error: undefined, response: new Response(null, { status: 200 }) });

describe("findById (resources with no GET-by-id)", () => {
  it("walks past the first page instead of stopping at it", async () => {
    const all = Array.from({ length: 450 }, (_, i) => ({ id: i + 1 }));
    const fetchPage = vi.fn(({ limit, offset }: { limit: number; offset: number }) =>
      pageOf(all.slice(offset, offset + limit)),
    );
    expect(await findById(fetchPage, 420, "Location")).toEqual({ id: 420 });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenLastCalledWith({ limit: 200, offset: 400 });
  });

  it("stops at a short page and reports not found", async () => {
    const fetchPage = vi.fn(() => pageOf([{ id: 1 }, { id: 2 }]));
    await expect(findById(fetchPage, 9, "Location")).rejects.toMatchObject({
      statusCode: 404,
      message: "Location not found",
    });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
