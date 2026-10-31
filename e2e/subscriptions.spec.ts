import type { Page, Request } from "@playwright/test";
import { expect, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signIn(page: Page, baseURL: string, phone: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone, otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** The Idempotency-Key the browser sends with the next matching write. */
const keyOf = (page: Page, method: string, path: RegExp) =>
  page
    .waitForRequest((r: Request) => r.method() === method && path.test(new URL(r.url()).pathname))
    .then((r) => r.headers()["idempotency-key"]);

test("/subscriptions is a public landing page, linked from the nav, hero and home band", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/", /Pure milk at your door/);
  // Hero CTA
  await page.getByRole("link", { name: "Start a subscription" }).first().click();
  await expect(page).toHaveURL(/\/subscriptions$/);
  await expect(page.getByRole("heading", { level: 1, name: /Fresh milk every morning/ })).toBeVisible();

  // Home band CTA and the header nav go to the same page.
  await page.goto("/");
  const band = page.getByRole("region", { name: "Never run out of milk again." });
  await expect(band.getByRole("link", { name: "Start a subscription" })).toHaveAttribute(
    "href",
    "/subscriptions",
  );
  // The header nav is inline from lg; below that it lives in the menu.
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await page.getByRole("banner").getByRole("link", { name: "Subscribe" }).click();
    await expect(page).toHaveURL(/\/subscriptions$/);
  }

  await visit(page, "/subscriptions", /Fresh milk every morning/);
  const grid = page.getByRole("list", { name: "Products available on subscription" });
  await expect(grid).toContainText("Full Cream Milk");
  await expect(grid).not.toContainText("A2 Desi Ghee"); // not subscribable
  await page.getByRole("link", { name: "Choose your products" }).click();
  await expect(page).toHaveURL(/#subscribable$/);
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute(
    "href",
    "/account/login?next=%2Fsubscriptions",
  );
});

test("signed-in subscribers are sent to their standing orders", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, "9000000001");
  await visit(page, "/subscriptions", /Fresh milk every morning/);
  await page.getByRole("link", { name: "Manage your subscriptions" }).click();
  await expect(page).toHaveURL(/\/account\/subscriptions$/);
  await expect(page.getByRole("heading", { level: 1, name: "Subscriptions" })).toBeVisible();
});

test("money and points writes carry an Idempotency-Key", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, "9000000000");
  await visit(page, "/account/gift-cards", "Gift cards");
  await page.getByLabel("Gift card code").fill("welcome250");
  await page.getByRole("button", { name: "Check balance" }).click();
  await page.getByLabel("Amount to add").fill("100");
  const gift = keyOf(page, "POST", /gift-cards\/redeem$/);
  await page.getByRole("button", { name: "Add to wallet", exact: true }).click();
  expect(await gift).toMatch(UUID);

  await visit(page, "/account/rewards", "Rewards");
  await page.getByLabel("Referral code").fill("friend100");
  const referral = keyOf(page, "POST", /referral\/redeem$/);
  await page.getByRole("button", { name: "Apply" }).click();
  expect(await referral).toMatch(UUID);

  await signIn(page, baseURL!, "9000000001");
  await visit(page, "/account/subscriptions/801", "Standing order");
  const standing = page.getByRole("region", { name: "Standing order" });
  const items = keyOf(page, "PUT", /subscriptions\/801\/items$/);
  await standing.getByRole("button", { name: "Save standing order" }).click();
  expect(await items).toMatch(UUID);

  const days = page.getByRole("region", { name: "Day by day" });
  const override = keyOf(page, "POST", /subscriptions\/801\/overrides$/);
  await days.getByRole("button", { name: "Skip Full Cream Milk on Tomorrow" }).click();
  expect(await override).toMatch(UUID);

  const status = page.getByRole("region", { name: /Sharma Sweets, Karol Bagh/ });
  const pause = keyOf(page, "POST", /subscriptions\/801\/pause$/);
  await status.getByRole("button", { name: "Pause" }).click();
  const pauseKey = await pause;
  expect(pauseKey).toMatch(UUID);
  await expect(status.getByRole("status")).toContainText("Paused");
  const resume = keyOf(page, "POST", /subscriptions\/801\/resume$/);
  await status.getByRole("button", { name: "Resume" }).click();
  const resumeKey = await resume;
  expect(resumeKey).toMatch(UUID);
  expect(resumeKey).not.toBe(pauseKey);

  await visit(page, "/account/subscriptions", "Subscriptions");
  await page.getByRole("combobox", { name: /Showing shop/ }).click();
  await page.getByRole("option", { name: "Sharma Sweets, Lajpat Nagar" }).click();
  const create = keyOf(page, "POST", /\/api\/v1\/subscriptions$/);
  await page.getByRole("button", { name: "Start a standing order" }).click();
  expect(await create).toMatch(UUID);
});
