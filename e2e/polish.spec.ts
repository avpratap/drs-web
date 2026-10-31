import { expect, expectAccessible, expectNoHorizontalScroll, isMobile, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

test("cookie notice: shown until the visitor chooses, remembered after", async ({ browser, baseURL }) => {
  // A fresh context without the fixture's pre-answered consent cookie.
  const context = await browser.newContext({
    baseURL,
    viewport: test.info().project.use.viewport ?? undefined,
  });
  const page = await context.newPage();
  await page.request.post(`${API}/__reset`);
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Your data, your choice" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);

  await notice.getByRole("button", { name: "Essential only" }).click();
  await expect(notice).toBeHidden();
  const cookie = (await context.cookies()).find((c) => c.name === "drs_consent");
  expect(cookie?.value).toBe("essential");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your data, your choice" })).toHaveCount(0);
  await context.close();
});

test("shop facets: price, pack size and rating chips filter the grid and clear", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/products", "Shop all");
  const filters = page.getByRole("region", { name: "Filters" });
  if (isMobile(page)) await filters.getByText("Filters", { exact: true }).click();
  const grid = page.getByRole("list", { name: "Shop all products" });
  await expect(grid).toContainText("A2 Desi Ghee");

  await filters
    .getByRole("group", { name: "Price" })
    .getByRole("link", { name: /Under ₹50/ })
    .click();
  await expect(page).toHaveURL(/price=under-50/);
  await expect(grid).not.toContainText("A2 Desi Ghee");
  await expect(grid).toContainText("Full Cream Milk");
  const chosen = page.getByRole("region", { name: "Filters" }).getByRole("link", { name: /Under ₹50/ });
  await expect(chosen.first()).toHaveAttribute("aria-current", "true");
  await expectAccessible(page);
  await expectNoHorizontalScroll(page);

  await page
    .getByRole("region", { name: "Filters" })
    .getByRole("link", { name: "Clear filters" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(grid).toContainText("A2 Desi Ghee");

  await page.goto("/products?rating=4");
  await expect(page.getByRole("status").filter({ hasText: /products?/ })).toBeVisible();
  await page.goto("/products?pack=1-l");
  await expect(page.getByRole("list", { name: "Shop all products" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("list", { name: "Shop all products" })).toContainText("A2 Desi Ghee");
});

test("the PDP describes the product, its offers and rating as JSON-LD", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const product = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "Product");
  expect(product).toMatchObject({
    name: "Full Cream Milk",
    sku: "MILK-FC-500",
    image: [`${API}/files/media/products/milk.svg`],
    brand: { "@type": "Brand", name: "DRS Dairy" },
    aggregateRating: { ratingValue: "4.6", reviewCount: 120 },
  });
  expect(["Offer", "AggregateOffer"]).toContain(product.offers["@type"]);
  expect(product.offers.priceCurrency).toBe("INR");
});
