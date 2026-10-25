import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, expectAccessible, isMobile, pickDate, test } from "./fixtures";

const settle = (el: Locator) =>
  el.evaluate((n) => Promise.all(n.getAnimations({ subtree: true }).map((a) => a.finished)));

async function expectFullyOnScreen(page: Page, el: Locator) {
  await settle(el);
  const box = (await el.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
}

const opaque = (el: Locator) =>
  el.evaluate((n) => {
    const c = getComputedStyle(n).backgroundColor;
    const m = c.match(/\/\s*([\d.]+)\s*\)$/) ?? c.match(/^rgba\([^)]*,\s*([\d.]+)\s*\)$/);
    return c !== "transparent" && (!m || parseFloat(m[1]) === 1);
  });

test("date picker: open, pick with the mouse, keyboard, Escape and axe", async ({ admin: page }) => {
  await page.goto("/admin/product-prices/create");
  const from = page.getByRole("button", { name: /Valid from/ });
  const to = page.getByRole("button", { name: /Valid to/ });
  await expect(to).toHaveText("Open-ended");

  // Mouse: opens on the current month, picks a day, closes, focus returns.
  await to.click();
  const cal = page.getByRole("dialog", { name: "Choose date" });
  await expect(cal).toBeVisible();
  expect(await opaque(cal)).toBe(true);
  await expect(cal.getByRole("grid")).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  const target = cal.locator("button[data-day]:not([disabled])").nth(20);
  const iso = (await target.getAttribute("data-day"))!;
  await target.click();
  await expect(cal).toBeHidden();
  await expect(to).toHaveAttribute("data-value", iso);
  await expect(to).toBeFocused();

  // Keyboard: Enter opens on the value, arrows move, Enter picks; Escape cancels.
  const start = (await from.getAttribute("data-value"))!;
  await from.focus();
  await page.keyboard.press("Enter");
  await expect(cal.locator(`button[data-day="${start}"]`)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  const next = new Date(`${start}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  await expect(from).toHaveAttribute("data-value", nextIso);
  await page.keyboard.press("Enter");
  await expect(cal).toBeVisible();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("Escape");
  await expect(cal).toBeHidden();
  await expect(from).toHaveAttribute("data-value", nextIso);
  await expect(from).toBeFocused();
  await expectAccessible(page);

  // Across months via the helper.
  await pickDate(to, "2027-02-14");
  await expect(to).toHaveText("14 Feb 2027");
});

test("date picker: at the bottom edge it flips up and stays fully on-screen", async ({ admin: page }) => {
  await page.goto("/admin/product-prices/create");
  const to = page.getByRole("button", { name: /Valid to/ });
  await to.scrollIntoViewIfNeeded();
  const bottom = await to.evaluate((el) => el.getBoundingClientRect().bottom);
  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: Math.max(560, Math.ceil(bottom) + 4),
  });
  await to.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollBy(0, r.bottom - window.innerHeight + 4);
  });
  await to.click();
  const cal = page.getByRole("dialog", { name: "Choose date" });
  await expect(cal).toBeVisible();
  await expect(cal).toHaveAttribute("data-side", "top");
  await expectFullyOnScreen(page, cal);
});

test("date picker: at the right edge (delivery date) it shifts to stay on-screen", async ({
  admin: page,
}) => {
  await page.goto("/admin/delivery");
  const date = page.getByRole("button", { name: /Delivery date/ });
  // Pin the trigger against the right edge, narrower than the calendar.
  await date.evaluate((el) =>
    Object.assign(el.style, { position: "fixed", right: "2px", top: "90px", width: "9rem" }),
  );
  await date.click();
  const cal = page.getByRole("dialog", { name: "Choose date" });
  await expect(cal).toBeVisible();
  await expectFullyOnScreen(page, cal);
  await cal.locator("button[data-day]:not([disabled])").nth(10).click();
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
});

test("checkbox: on-brand Radix checkbox toggles by click and Space", async ({ admin: page }) => {
  await page.goto("/admin/products/create");
  const perishable = page.getByRole("checkbox", { name: "Perishable" });
  await expect(perishable).toHaveAttribute("aria-checked", "true");
  const bg = await perishable.evaluate((n) => getComputedStyle(n).backgroundColor);
  expect(bg).toBe("rgb(13, 76, 60)"); // drs-green when checked
  await perishable.click();
  await expect(perishable).toHaveAttribute("aria-checked", "false");
  await page.getByText("Perishable", { exact: true }).click(); // the label toggles too
  await expect(perishable).toHaveAttribute("aria-checked", "true");
  await perishable.focus();
  await page.keyboard.press("Space");
  await expect(perishable).toHaveAttribute("aria-checked", "false");
  // Number fields have no browser spinners.
  const appearance = await page
    .getByLabel(/Pack size/)
    .evaluate((n) => getComputedStyle(n).getPropertyValue("appearance"));
  expect(appearance).toBe("textfield");
  await expectAccessible(page);
});

test("sidebar: sections collapse, the active one auto-opens, choices persist, keyboard works", async ({
  admin: page,
}) => {
  await page.goto("/admin/purchase-orders");
  const openNav = async () => {
    if (isMobile(page) || page.viewportSize()!.width < 1024) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      return page.getByRole("dialog", { name: "Navigation" });
    }
    return page.getByRole("navigation", { name: "Main" });
  };
  let navEl = await openNav();
  const inventory = navEl.getByRole("button", { name: /^Inventory/ });
  await expect(inventory).toHaveAttribute("aria-expanded", "true"); // holds the active route
  await expect(navEl.getByRole("link", { name: "Purchase orders" })).toHaveAttribute("aria-current", "page");
  await expect(navEl.getByRole("link", { name: "Purchase orders" })).toBeInViewport();
  const billing = navEl.getByRole("button", { name: /^Billing/ });
  await expect(billing).toHaveAttribute("aria-expanded", "false");
  await expect(navEl.getByRole("link", { name: "Withdrawals" })).toHaveCount(0);

  // Keyboard: Enter expands, Space collapses.
  await billing.focus();
  await page.keyboard.press("Enter");
  await expect(billing).toHaveAttribute("aria-expanded", "true");
  await expect(navEl.getByRole("link", { name: "Withdrawals" })).toBeVisible();
  const content = navEl.getByRole("button", { name: /^Content/ });
  await content.click();
  await expect(content).toHaveAttribute("aria-expanded", "true");
  await content.press("Space");
  await expect(content).toHaveAttribute("aria-expanded", "false");
  await content.press("Enter");
  await expect(content).toHaveAttribute("aria-expanded", "true");
  await expectAccessible(page);

  // Navigate: the new active section (Billing) is open and Content stays open (remembered).
  await navEl.getByRole("link", { name: "Withdrawals" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Withdrawals" })).toBeVisible();
  navEl = await openNav();
  await expect(navEl.getByRole("button", { name: /^Billing/ })).toHaveAttribute("aria-expanded", "true");
  await expect(navEl.getByRole("button", { name: /^Content/ })).toHaveAttribute("aria-expanded", "true");
  await expect(navEl.getByRole("button", { name: /^Customers/ })).toHaveAttribute("aria-expanded", "false");

  // And across a full reload.
  await page.reload();
  navEl = await openNav();
  await expect(navEl.getByRole("button", { name: /^Content/ })).toHaveAttribute("aria-expanded", "true");
});
