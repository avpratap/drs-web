import { describe, expect, it } from "vitest";
import { toHttpError } from "@/lib/api/errors";

describe("toHttpError", () => {
  it("maps FastAPI 422 validation detail onto field errors", () => {
    const e = toHttpError(
      {
        detail: [
          { loc: ["body", "sku"], msg: "String should have at least 1 character" },
          { loc: ["body", "gst_rate"], msg: "Input should be less than or equal to 99.99" },
        ],
      },
      422,
    );
    expect(e.statusCode).toBe(422);
    expect(e.errors).toEqual({
      sku: "String should have at least 1 character",
      gst_rate: "Input should be less than or equal to 99.99",
    });
  });

  it("uses a string detail as the message", () => {
    expect(toHttpError({ detail: "Product SKU already exists" }, 409)).toEqual({
      message: "Product SKU already exists",
      statusCode: 409,
    });
  });

  it("falls back for network errors and empty bodies", () => {
    expect(toHttpError(null, 0).message).toMatch(/network/i);
    expect(toHttpError(undefined, 500).message).toBe("Request failed (500)");
  });
});
