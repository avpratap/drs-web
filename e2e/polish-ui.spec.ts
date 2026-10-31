import type { Page } from "@playwright/test";
import { expect, isMobile, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signInCustomer(page: Page, baseURL: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

test("Farm to door: the connectors join the steps into one line (M)", async ({ page }) => {
  await visit(page, "/about", /DRS|story|Dhanna/i);
  const steps = page.getByRole("region", { name: /From the farm to your door/ }).getByRole("listitem");
  const connectors = page.getByTestId("journey-connector");
  await expect(connectors).toHaveCount((await steps.count()) - 1);
  const icon = (i: number) => steps.nth(i).locator("span").first().boundingBox();
  for (let i = 0; i < (await connectors.count()); i++) {
    const line = (await connectors.nth(i).boundingBox())!;
    const [a, b] = [(await icon(i))!, (await icon(i + 1))!];
    if (isMobile(page)) {
      // Vertical: from just under this icon to just above the next one.
      expect(line.y - (a.y + a.height)).toBeGreaterThanOrEqual(4);
      expect(b.y - (line.y + line.height)).toBeGreaterThanOrEqual(4);
      expect(b.y - (line.y + line.height)).toBeLessThanOrEqual(12);
    } else {
      // Horizontal: from just after this icon to just before the next one (no gap-sized break).
      expect(line.x - (a.x + a.width)).toBeLessThanOrEqual(12);
      expect(b.x - (line.x + line.width)).toBeGreaterThanOrEqual(4);
      expect(b.x - (line.x + line.width)).toBeLessThanOrEqual(12);
      expect(Math.abs(line.y - (a.y + a.height / 2))).toBeLessThanOrEqual(2);
    }
  }
});

test("account nav keeps the page still while revealing the current section (N)", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/privacy", "Privacy");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const current = page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Privacy" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
});

test("one header height drives sticky offsets and anchors (O); filled buttons get an ink focus ring (I)", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await page.request.post("/api/backend/api/v1/cart/items", {
    headers: { origin: baseURL! },
    data: { product_id: 3, qty: 1 },
  });
  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1, name: "Your cart" })).toBeVisible();
  const header = await page.getByRole("banner").boundingBox();
  const varPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")),
  );
  expect(Math.abs(varPx - header!.height)).toBeLessThanOrEqual(1);

  // Keyboard focus on a filled (green) button: an ink outline, not green-on-green.
  const checkout = page.getByRole("link", { name: /checkout/i }).first();
  await checkout.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await checkout.evaluate((el) => getComputedStyle(el).outlineColor);
  expect(outline).not.toBe("rgb(13, 76, 60)");
});
