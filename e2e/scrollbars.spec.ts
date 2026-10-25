import { expect, test } from "./fixtures";

test("scrollbars are thin with a transparent track; sidebar only scrolls when it overflows", async ({
  admin: page,
}) => {
  await page.goto("/"); // no section open: the nav fits at every breakpoint
  const wide = page.viewportSize()!.width >= 1024;
  const nav = wide
    ? page.getByRole("navigation", { name: "Main" })
    : (await page.getByRole("button", { name: "Open navigation" }).click(),
      page.getByRole("dialog", { name: "Navigation" }).getByRole("navigation", { name: "Main" }));
  const css = await nav.evaluate((n) => {
    const s = getComputedStyle(n);
    return { width: s.scrollbarWidth, color: s.scrollbarColor, overflowY: s.overflowY };
  });
  expect(css.width).toBe("thin");
  expect(css.overflowY).toBe("auto"); // a scrollbar appears only on overflow
  // Light, translucent thumb on the green sidebar; transparent track.
  expect(css.color).toMatch(/^rgba\(244, 234, 222, 0\.\d+\) transparent$/);

  const main = await page.locator("main").evaluate((n) => getComputedStyle(n).scrollbarColor);
  expect(main).toMatch(/^rgba\(30, 26, 30, 0\.\d+\) transparent$/);

  // With everything collapsed the nav fits: no scrolling.
  const fits = await nav.evaluate((n) => n.scrollHeight <= n.clientHeight + 1);
  expect(fits).toBe(true);
});

test("on a short (zoomed) viewport the sidebar scrolls inside itself, not the page", async ({
  admin: page,
}) => {
  test.skip(page.viewportSize()!.width < 1024, "the sidebar is a drawer below 1024px");
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 420 });
  await page.goto("/purchase-orders");
  const nav = page.getByRole("navigation", { name: "Main" });
  // Open every section so the nav is taller than the viewport.
  const closed = nav.getByRole("button", { expanded: false });
  while ((await closed.count()) > 0) await closed.first().click();
  const m = await nav.evaluate((n) => ({ sh: n.scrollHeight, ch: n.clientHeight }));
  expect(m.sh).toBeGreaterThan(m.ch);
  await nav.evaluate((n) => n.scrollTo(0, n.scrollHeight));
  expect(await nav.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  const aside = page.locator("aside").first();
  expect((await aside.boundingBox())!.height).toBeLessThanOrEqual(420);
  await page.screenshot({ path: test.info().outputPath("short-sidebar.png") });
});
