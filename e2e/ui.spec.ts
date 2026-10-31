import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const API = "http://127.0.0.1:8787";
const hasHamburger = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

test("mobile menu covers the whole viewport and sits above the page (A)", async ({ page }) => {
  test.skip(!hasHamburger(page), "the menu button shows below lg");
  await page.request.post(`${API}/__reset`);
  await page.goto("/products");
  await page.evaluate(() => window.scrollTo(0, 600)); // the sticky header is mid-page
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  const vp = page.viewportSize()!;
  const box = (await menu.boundingBox())!;
  expect(box.y).toBe(0);
  expect(box.height).toBeGreaterThanOrEqual(vp.height - 1); // not collapsed to the header bar
  // Nothing from the page paints over it: the topmost element at the bottom-left is the menu.
  const onTop = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x, y)?.closest("#store-menu"),
    [20, vp.height - 20],
  );
  expect(onTop).toBe(true);
  await menu.getByRole("link", { name: "Categories" }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});

test("cookie notice never covers the footer or the open menu (C)", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: test.info().project.use.viewport ?? undefined,
  });
  const page = await context.newPage();
  await page.request.post(`${API}/__reset`);
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Your data, your choice" });
  await expect(notice).toBeVisible();
  // At the very bottom of the page, the footer ends above the notice.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const copyright = page.getByRole("contentinfo").getByText(/All rights reserved/);
  await expect(copyright).toBeVisible();
  await expect
    .poll(async () => (await copyright.boundingBox())!.y + (await copyright.boundingBox())!.height)
    .toBeLessThanOrEqual((await notice.boundingBox())!.y + 1);

  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const nb = (await notice.boundingBox())!;
    const menuOnTop = await page.evaluate(
      ([x, y]) => !!document.elementFromPoint(x, y)?.closest("#store-menu"),
      [nb.x + 10, nb.y + nb.height / 2],
    );
    expect(menuOnTop).toBe(true);
  }
  // Once answered, the reserved space goes away.
  await page.keyboard.press("Escape");
  await notice.getByRole("button", { name: "Essential only" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--banner-h")),
    )
    .toBe("");
  await context.close();
});
