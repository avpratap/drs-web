import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Locator, type Page } from "@playwright/test";

const API = "http://127.0.0.1:8787";

export const test = base.extend<{ admin: Page }>({
  /** A page with a fresh mock database and an admin session (httpOnly cookies). */
  admin: async ({ page, baseURL }, provide) => {
    await page.request.post(`${API}/__reset`);
    const res = await page.request.post("/api/auth/otp/verify", {
      data: { phone: "9876500001", otp: "123456" },
      headers: { origin: baseURL! },
    });
    expect(res.ok()).toBeTruthy();
    await provide(page);
  },
});

export { expect };

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

/** WCAG 2.1 AA automated checks (axe-core) on the current page. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

/** Mobile-first layout: the page itself never scrolls sideways (wide tables scroll in their own box). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Load a page, wait for its heading, and run the layout + a11y checks. */
export async function visit(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
}

/** Open a custom (Radix) Select and pick an option by its value or `{ label }`. */
export async function choose(trigger: Locator, option: string | { label: string }) {
  await trigger.click();
  const list = trigger.page().getByRole("listbox");
  await expect(list).toBeVisible();
  const item =
    typeof option === "string"
      ? list.locator(`[role="option"][data-value="${option}"]`)
      : list.getByRole("option", { name: option.label, exact: true });
  await item.click();
  await expect(list).toBeHidden();
}
