import { expect, isMobile, test, visit } from "./fixtures";

const reset = (page: import("@playwright/test").Page) => page.request.post("http://127.0.0.1:8787/__reset");

test("home: hero, categories and featured products from the public API (indexable)", async ({ page }) => {
  await reset(page);
  await visit(page, "/", /Pure milk at your door/);
  await expect(page.getByRole("link", { name: "Shop fresh" })).toHaveAttribute("href", "/products");
  const categories = page.getByRole("region", { name: "Shop by category" });
  for (const c of ["Milk", "Buttermilk", "Ghee"])
    await expect(categories.getByRole("link", { name: new RegExp(c) })).toBeVisible();
  await expect(categories.getByRole("link", { name: /^Milk/ })).toHaveAttribute(
    "href",
    "/products?category=milk",
  );
  const featured = page.getByRole("list", { name: "Featured products" });
  await expect(featured.getByRole("link", { name: "Full Cream Milk" })).toHaveAttribute(
    "href",
    "/products/1",
  );
  await expect(featured).toContainText("500 ml");
  // Storefront is indexable; no admin chrome or noindex here.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  // Header: account + cart, and search goes to the catalogue.
  await expect(page.getByRole("link", { name: "Your account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Shop" })).toBeVisible();
    await menu.getByLabel("Search products").fill("ghee");
    await menu.getByLabel("Search products").press("Enter");
  } else {
    await page.getByLabel("Search products").fill("ghee");
    await page.getByLabel("Search products").press("Enter");
  }
  await expect(page).toHaveURL(/\/products\?q=ghee$/);
});

test("zones: customer pages and the admin redirect to their own sign-in", async ({ page }) => {
  await reset(page);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Fcheckout$/);
  await page.goto("/wallet/topup");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Fwallet%2Ftopup$/);
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page).toHaveTitle(/· DRS Admin$/);
  // Public pages need no session.
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
});

test("customer signs in on the storefront; the admin console still refuses them", async ({ page }) => {
  await reset(page);
  await visit(page, "/account/login?next=%2Fcheckout", /Sign in|Welcome back/);
  await page.getByLabel(/mobile number/i).fill("9000000000");
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/one-time code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "drs_at")?.httpOnly).toBe(true);
  expect(cookies.find((c) => c.name === "drs_rt")?.path).toBe("/api/store-auth");
  // Signed in as a customer: the store login bounces home; the admin console refuses.
  await page.goto("/account/login");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?error=forbidden/);
  await expect(page.getByText(/for drs admins only/i)).toBeVisible();
});

test("staff can't sign in through the storefront (and get no session)", async ({ page }) => {
  await reset(page);
  await page.goto("/account/login");
  await page.getByLabel(/mobile number/i).fill("9876500001");
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/one-time code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/this sign-in is for drs customers/i)).toBeVisible();
  expect((await page.context().cookies()).find((c) => c.name === "drs_at")).toBeUndefined();
});

test("unknown storefront pages show the on-brand 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This page has gone sour." })).toBeVisible();
});
