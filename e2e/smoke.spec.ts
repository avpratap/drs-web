import { expect, test } from "@playwright/test";

test("admin logs in with phone OTP and sees the product list", async ({ page }) => {
  await page.goto("/products");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel(/mobile number/i).fill("9876543210");
  await page.getByRole("button", { name: /send code/i }).click();
  await expect(page.getByText(/dev mode code: 123456/i)).toBeVisible();
  await page.getByLabel(/one-time code/i).fill("123456");
  await page.getByRole("button", { name: /verify/i }).click();

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
  const table = page.getByRole("table", { name: "Products" });
  await expect(table.getByRole("link", { name: /^Full Cream Milk/ })).toBeVisible();
  await expect(table.getByRole("link", { name: /^A2 Desi Ghee/ })).toBeVisible();

  // The JWT lives in httpOnly cookies, never in JS-readable storage.
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "drs_at")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("drs_at");
});

test("wrong OTP shows an error and stays on login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/mobile number/i).fill("9876543210");
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/one-time code/i).fill("000000");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page.getByText(/invalid or expired otp/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
