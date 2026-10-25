import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, expectAccessible, test, visit } from "./fixtures";

/** Wait for the open/close animation to finish before measuring. */
const settle = (el: Locator) =>
  el.evaluate((n) => Promise.all(n.getAnimations({ subtree: true }).map((a) => a.finished)));

/** The open listbox must sit entirely inside the viewport. */
async function expectFullyOnScreen(page: Page, list: Locator) {
  await settle(list);
  const box = (await list.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
}

test("select: mouse open + pick, keyboard pick, and axe while open", async ({ admin: page }) => {
  await visit(page, "/delivery-assignments", "Driver assignments");
  // While a Select is open Radix hides the rest of the page from assistive tech, so role
  // queries can't see the trigger then: hold it by id.
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toBeVisible();
  const status = page.locator("#f-active");
  await expect(status).toHaveText("Assigned");

  // Mouse: opens a listbox at the trigger's width, picks an option, closes, focus returns.
  await status.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(status).toHaveAttribute("aria-expanded", "true");
  await settle(list);
  const [t, l] = [(await status.boundingBox())!, (await list.boundingBox())!];
  expect(Math.abs(l.width - t.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(l.x - t.x)).toBeLessThanOrEqual(1);
  await expect(list.getByRole("option", { name: "Assigned" })).toHaveAttribute("aria-selected", "true");
  // WCAG 2.1 AA on the open listbox (Radix aria-hides the page behind it while focus is
  // trapped in the list; the full page is checked again once it closes).
  const open = await new AxeBuilder({ page })
    .include('[role="listbox"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(open.violations.map((v) => v.id)).toEqual([]);
  await list.getByRole("option", { name: "Removed" }).click();
  await expect(list).toBeHidden();
  await expect(status).toHaveText("Removed");
  await expect(status).toBeFocused();
  await expect(page).toHaveURL(/active/);
  await expectAccessible(page);

  // Keyboard: ArrowDown opens on the current value, arrows move, Enter picks.
  await status.press("ArrowDown");
  await expect(list.getByRole("option", { name: "Removed" })).toBeFocused(); // opens on the value
  await page.keyboard.press("Home");
  await expect(list.getByRole("option", { name: "All" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: "Assigned" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status).toHaveText("Assigned");
  await expect(page.getByRole("table")).toContainText("Sharma Sweets");

  // Escape closes without changing the value.
  await status.press("Enter");
  await expect(list.getByRole("option", { name: "Assigned" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: "Removed" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(status).toHaveText("Assigned");
});

test("select: a list opened at the bottom edge stays fully on-screen (flips up)", async ({ admin: page }) => {
  await page.goto("/products/create");
  const gst = page.getByRole("combobox", { name: /GST rate/ });
  // Shrink the viewport so the trigger sits against its bottom edge.
  const width = page.viewportSize()!.width;
  await gst.scrollIntoViewIfNeeded();
  const bottom = await gst.evaluate((el) => el.getBoundingClientRect().bottom);
  await page.setViewportSize({ width, height: Math.ceil(bottom) + 4 });
  const box = (await gst.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(page.viewportSize()!.height - 10);
  await gst.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(list).toHaveAttribute("data-side", "top"); // flipped above the trigger
  await expectFullyOnScreen(page, list);
  await list.getByRole("option", { name: "18%" }).click();
  await expect(gst).toHaveText("18%");
});

test("select: inside a modal dialog it renders above it, on-screen, and Esc closes only the list", async ({
  admin: page,
}) => {
  await page.goto("/delivery-assignments");
  await page.getByRole("button", { name: "Assign driver" }).click();
  const dialog = page.getByRole("dialog", { name: "Assign driver" });
  const shop = dialog.getByRole("combobox", { name: /shop/i });
  await shop.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expectFullyOnScreen(page, list);
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(shop).toBeFocused();
});

test("select: a filter sized to its widest option, opened at the right edge, stays on-screen", async ({
  admin: page,
}) => {
  await page.goto("/delivery-assignments");
  const shop = page.getByRole("combobox", { name: "Shop", exact: true });
  // Pin the trigger to the right edge of the viewport, wider than the room to its left.
  await shop.evaluate((el) => {
    const host = el.parentElement as HTMLElement;
    Object.assign(host.style, { position: "fixed", right: "2px", top: "120px", width: "70vw", zIndex: "40" });
  });
  await shop.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expectFullyOnScreen(page, list);
});
