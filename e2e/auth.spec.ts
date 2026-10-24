import { expect, expectAccessible, expectNoHorizontalScroll, test } from "./fixtures";

test("admin logs in with phone OTP and lands on the requested page", async ({ page }) => {
  await page.request.post("http://127.0.0.1:8787/__reset");
  await page.goto("/products");
  await expect(page).toHaveURL(/\/login\?next=%2Fproducts/);
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);

  await page.getByLabel(/mobile number/i).fill("9876500001");
  await page.getByRole("button", { name: /send code/i }).click();
  await expect(page.getByText(/dev mode code: 123456/i)).toBeVisible();
  await page.getByLabel(/one-time code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "drs_at")?.httpOnly).toBe(true);
  expect(cookies.find((c) => c.name === "drs_rt")?.path).toBe("/api/auth");
  expect(await page.evaluate(() => document.cookie)).not.toContain("drs_");
});

test("wrong OTP shows an error and stays on login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/mobile number/i).fill("9876500001");
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/one-time code/i).fill("000000");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/invalid or expired otp/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("non-admins are refused and never get a session", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/mobile number/i).fill("9000000000");
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/one-time code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/for drs admins only/i)).toBeVisible();
  expect((await page.context().cookies()).find((c) => c.name === "drs_at")).toBeUndefined();
});

test("sign out clears the session", async ({ admin: page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/reports");
  await expect(page).toHaveURL(/\/login/);
});

test("navigation works from the sidebar / mobile drawer", async ({ admin: page }) => {
  await page.goto("/");
  const narrow = (page.viewportSize()?.width ?? 1440) < 1024;
  if (narrow) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    await drawer.getByRole("link", { name: "Daily deliveries" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Daily deliveries" })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Daily deliveries" })).toBeVisible();
  await expect(page).toHaveURL(/\/delivery$/);
});
