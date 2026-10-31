import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const API = "http://127.0.0.1:8787";
// Phones only: from md the nav is inline in the header.
const hasHamburger = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

test("mobile menu covers the whole viewport and sits above the page (A)", async ({ page }) => {
  test.skip(!hasHamburger(page), "the menu button shows below md");
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

  if (hasHamburger(page)) {
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

test("tablets get the inline nav and a search toggle (D)", async ({ page }) => {
  const w = page.viewportSize()!.width;
  test.skip(w < 768 || w >= 1024, "tablet range only");
  await page.request.post(`${API}/__reset`);
  await page.goto("/");
  const header = page.getByRole("banner");
  const nav = header.getByRole("navigation", { name: "Store" });
  for (const name of ["Shop", "Categories", "Subscribe", "About"])
    await expect(nav.getByRole("link", { name })).toBeVisible();
  await expect(header.getByRole("button", { name: "Open menu" })).toBeHidden();
  // Nothing in the header overflows the viewport.
  const right = await header.evaluate((h) =>
    Math.max(...[...h.querySelectorAll("a,button")].map((e) => e.getBoundingClientRect().right)),
  );
  expect(right).toBeLessThanOrEqual(w);
  await header.getByRole("button", { name: "Search" }).click();
  const search = page.getByLabel("Search products").filter({ visible: true });
  await search.fill("paneer");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\?q=paneer$/);
});

test("category grid steps 2 → 3 → 4 → 6 columns (E)", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await page.goto("/categories");
  const grid = page
    .locator("ul")
    .filter({ has: page.getByRole("link", { name: /^Milk/ }) })
    .first();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  const w = page.viewportSize()!.width;
  expect(cols).toBe(w >= 1280 ? 6 : w >= 1024 ? 4 : w >= 768 ? 3 : 2);
});
