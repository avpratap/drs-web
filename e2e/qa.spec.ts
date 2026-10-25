import { expect, isMobile, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

test("product photos come from the media store; a broken one falls back to the illustration", async ({
  page,
}) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/products", "Shop all");
  const grid = page.getByRole("list", { name: "Shop all products" });
  const milk = grid.getByRole("listitem").filter({ hasText: "Full Cream Milk" });
  const photo = milk.locator("img");
  await expect(photo).toHaveAttribute("src", `${API}/files/media/products/milk.svg`);
  await expect
    .poll(() => photo.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth))
    .toBeGreaterThan(0);
  // Ghee's file is missing: no broken image, the category art instead.
  const ghee = grid.getByRole("listitem").filter({ hasText: "A2 Desi Ghee" });
  await expect(ghee.locator("img")).toHaveCount(0);
  await expect(ghee.locator("svg").first()).toBeVisible();

  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  await expect(page.getByRole("img", { name: "Full Cream Milk" })).toHaveAttribute(
    "src",
    `${API}/files/media/products/milk.svg`,
  );
  // Link previews need an absolute image URL.
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${API}/files/media/products/milk.svg`,
  );
});

test("a failed catalogue read is retried on the next request, not served from cache", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  // A query no other test renders, so this page's cache entry starts empty.
  const q = "full cream"
    .split("")
    .map((c) => (Math.random() < 0.5 ? c.toUpperCase() : c))
    .join("");
  const url = `/products?q=${encodeURIComponent(q)}`;

  await page.request.post(`${API}/__fail`, { data: { path: "/api/v1/products" } });
  await page.goto(url);
  await expect(page.getByText("We couldn't load products just now.").first()).toBeVisible();

  await page.request.post(`${API}/__fail`, { data: { path: null } });
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole("link", { name: "Full Cream Milk" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000, intervals: [1000] });
});

test("logo: named for screen readers, fits the header, and reads on the green footer", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/", /Pure milk at your door/);
  const header = page.getByRole("banner");
  const logo = header.getByRole("link", { name: /^DRS\s*DAIRY\s*Pure heritage\s*,\s*home$/ });
  await expect(logo).toBeVisible();
  const box = (await logo.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);

  const footerLogo = page.getByRole("contentinfo").getByRole("link", { name: /DRS DAIRY Pure heritage/ });
  await footerLogo.scrollIntoViewIfNeeded();
  await expect(footerLogo).toBeVisible();
  // On the green footer the wordmark is cream, not green.
  const color = await footerLogo
    .locator("span span")
    .nth(1)
    .evaluate((e) => getComputedStyle(e).color);
  expect(color).not.toBe("rgb(13, 76, 60)");
  if (isMobile(page)) await expect(header.getByRole("button", { name: "Open menu" })).toBeVisible();
});
