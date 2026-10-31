import { describe, expect, it } from "vitest";
import { isAdminOnlyApi } from "@/lib/auth/bff";
import { publicOtpResponse } from "@/lib/auth/handlers";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

describe("BFF admin-only paths", () => {
  it("needs an admin token for every admin route and catalogue write", () => {
    for (const [m, p] of [
      ["GET", "api/v1/admin/orders"],
      ["POST", "api/v1/admin/returns/4/refund"],
      ["POST", "api/v1/billing/admin/topup"],
      ["POST", "api/v1/admin/invoices/generate"],
      ["POST", "api/v1/products"],
      ["PATCH", "api/v1/products/3"],
      ["DELETE", "api/v1/products/variants/9"],
    ])
      expect(isAdminOnlyApi(m, p), `${m} ${p}`).toBe(true);
  });

  it("leaves customer and subscriber routes alone", () => {
    for (const [m, p] of [
      ["GET", "api/v1/products"],
      ["POST", "api/v1/products/3/ratings"],
      ["DELETE", "api/v1/products/3/ratings"],
      ["POST", "api/v1/products/3/ratings/7/helpful"],
      ["POST", "api/v1/cart/items"],
      ["POST", "api/v1/subscriptions/801/pause"],
      ["GET", "api/v1/billing/credit-statement"],
      ["GET", "api/v1/delivery/orders?date=2026-11-01"],
      ["GET", "api/v1/content/administrators"], // a segment merely starting with "admin"
    ])
      expect(isAdminOnlyApi(m, p), `${m} ${p}`).toBe(false);
  });
});

describe("security headers", () => {
  it("builds a CSP allowing only self, the API origin, Razorpay and Google Fonts", () => {
    const csp = contentSecurityPolicy({ apiBase: "https://api.drs.example/v1/" });
    const d = Object.fromEntries(csp.split("; ").map((x) => [x.split(" ")[0], x.split(" ").slice(1)]));
    expect(d["default-src"]).toEqual(["'self'"]);
    expect(d["script-src"]).toEqual(["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"]);
    expect(d["img-src"]).toContain("https://api.drs.example");
    expect(d["frame-src"]).toContain("https://api.drs.example"); // signed invoice PDFs
    expect(d["style-src"]).toContain("https://fonts.googleapis.com");
    expect(d["font-src"]).toContain("https://fonts.gstatic.com");
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("allows eval and HMR sockets only in dev; HSTS only in production", () => {
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
    const prod = securityHeaders({ apiBase: "http://localhost:8000", production: true });
    const keys = prod.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining(["Content-Security-Policy", "Strict-Transport-Security", "Permissions-Policy"]),
    );
    expect(securityHeaders({ production: false }).map((h) => h.key)).not.toContain(
      "Strict-Transport-Security",
    );
    expect(prod.find((h) => h.key === "Permissions-Policy")!.value).toContain("camera=()");
  });

  it("adds extra CMS image hosts and ignores a malformed API base", () => {
    const csp = contentSecurityPolicy({ apiBase: "not a url", extraImgHosts: ["https://images.example"] });
    expect(csp).toContain("img-src 'self' data: blob: https://cdn.razorpay.com https://images.example");
  });
});

describe("dev OTP", () => {
  it("is never forwarded by a production build", () => {
    expect(publicOtpResponse({ detail: "OTP sent", dev_otp: "123456" }, true)).toEqual({
      detail: "OTP sent",
    });
    expect(publicOtpResponse({ detail: "OTP sent", dev_otp: "123456" }, false)).toHaveProperty("dev_otp");
  });
});
