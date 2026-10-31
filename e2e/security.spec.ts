import { expect, test } from "./fixtures";

const API = "http://127.0.0.1:8787";

test("security headers on every page; no CSP violations across the storefront and admin", async ({
  page,
  admin,
  baseURL,
}) => {
  void page;
  const violations: string[] = [];
  await admin.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp ??= [];
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  const res = await admin.request.get(`${baseURL}/`);
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["strict-transport-security"]).toContain("max-age=63072000");
  expect(h["permissions-policy"]).toContain("camera=()");

  for (const path of [
    "/",
    "/products",
    "/products/1-full-cream-milk",
    "/journal",
    "/about",
    "/admin",
    "/admin/orders",
  ]) {
    await admin.goto(path);
    await admin.waitForLoadState("networkidle").catch(() => undefined);
    violations.push(
      ...(
        (await admin.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])) as string[]
      ).map((v) => `${path}: ${v}`),
    );
  }
  expect(violations).toEqual([]);
});

test("the BFF refuses admin-only API paths to a customer session", async ({ page, baseURL }) => {
  await page.request.post(`${API}/__reset`);
  await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL! },
  });
  const origin = { origin: baseURL! };
  const adminCall = await page.request.get("/api/backend/api/v1/admin/orders", { headers: origin });
  expect(adminCall.status()).toBe(403);
  const catalogueWrite = await page.request.post("/api/backend/api/v1/products", {
    headers: origin,
    data: { sku: "X", name: "X" },
  });
  expect(catalogueWrite.status()).toBe(403);
  // The customer's own routes still work.
  expect((await page.request.get("/api/backend/api/v1/cart", { headers: origin })).status()).toBe(200);
});

test("a production build never sends the dev OTP to the browser", async ({ page, baseURL }) => {
  const res = await page.request.post("/api/store-auth/otp/request", {
    data: { phone: "9000000000" },
    headers: { origin: baseURL! },
  });
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).not.toHaveProperty("dev_otp");
  await page.goto("/account/login");
  await page.getByLabel(/mobile number/i).fill("9000000000");
  await page.getByRole("button", { name: /send code/i }).click();
  await expect(page.getByLabel(/one-time code/i)).toBeVisible();
  await expect(page.getByText(/dev mode code/i)).toHaveCount(0);
});

test("login never follows an off-site next= (backslash and control-character tricks)", async ({ page }) => {
  for (const next of ["/\\evil.example", "/\t/evil.example"]) {
    await page.request.post(`${API}/__reset`);
    await page.context().clearCookies();
    await page.goto(`/account/login?next=${encodeURIComponent(next)}`);
    await page.getByLabel(/mobile number/i).fill("9000000000");
    await page.getByRole("button", { name: /send code/i }).click();
    await page.getByLabel(/one-time code/i).fill("123456");
    await page.getByRole("button", { name: /verify/i }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
  }
});
