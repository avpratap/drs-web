import { choose, expect, isMobile, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

test("shop: priced grid, category chips, search and sort", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/products", "Shop all");
  const grid = page.getByRole("list", { name: "Shop all products" });
  // "From" price is the cheapest priced pack, GST-inclusive; unpriced products say so.
  const milk = grid.getByRole("listitem").filter({ hasText: "Full Cream Milk" });
  await expect(milk).toContainText("From ₹33");
  await expect(grid.getByRole("listitem").filter({ hasText: "Farm Fresh Curd" })).toContainText(
    "Price on request",
  );
  await expect(milk.getByRole("link", { name: "Full Cream Milk" })).toHaveAttribute(
    "href",
    "/products/1-full-cream-milk",
  );

  // Category chip filters the grid (and keeps the URL shareable).
  const cats = page.getByRole("navigation", { name: "Categories" });
  await cats.getByRole("link", { name: "Ghee" }).click();
  await expect(page).toHaveURL(/\/products\?category=ghee$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ghee" })).toBeVisible();
  await expect(cats.getByRole("link", { name: "Ghee" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "Ghee products" }).getByRole("listitem")).toHaveCount(1);

  // Search within the category; nothing found offers a way back.
  await page.getByLabel("Search the shop").fill("paneer");
  await page.getByLabel("Search the shop").press("Enter");
  await expect(page).toHaveURL(/category=ghee/);
  await expect(page).toHaveURL(/q=paneer/);
  await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/products$/);

  // Sort by name.
  await choose(page.getByRole("combobox", { name: "Sort by" }), { label: "Name, A–Z" });
  await expect(page).toHaveURL(/sort=name/);
  await expect(
    page.getByRole("list", { name: "Shop all products" }).getByRole("heading", { level: 3 }).first(),
  ).toHaveText("A2 Desi Ghee");
});

test("categories page links into the filtered shop", async ({ page }) => {
  await visit(page, "/categories", "Shop by category");
  await page
    .getByRole("main")
    .getByRole("link", { name: /^Buttermilk/ })
    .click();
  await expect(page).toHaveURL(/\/products\?category=buttermilk$/);
  await expect(page.getByRole("heading", { level: 1, name: "Buttermilk" })).toBeVisible();
});

test("PDP: pack prices with MRP strike, unpriced packs disabled, reviews; signed-out add asks to sign in", async ({
  page,
}) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/products/2-masala-buttermilk", "Masala Buttermilk");
  await expect(page.getByTestId("pack-price")).toHaveText("₹15");
  await expect(page.getByText("25% off")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Pack of 6/ })).toBeDisabled();
  await expect(page.getByRole("radio", { name: /Pack of 6/ }).locator("..")).toContainText(
    "Price unavailable",
  );
  const reviews = page.getByRole("region", { name: "Ratings & reviews" });
  await expect(reviews).toContainText("40 reviews");
  await expect(reviews.getByRole("list", { name: "Customer reviews" })).toContainText("Perfectly spiced");

  // An old or id-only URL lands on the canonical slug.
  await page.goto("/products/2");
  await expect(page).toHaveURL(/\/products\/2-masala-buttermilk$/);

  await page.getByRole("button", { name: /Add to cart/ }).click();
  await expect(page).toHaveURL(/\/account\/login\?next=%2Fproducts%2F2-masala-buttermilk$/);
});

test("PDP: a signed-in customer adds packs; the cart gets qty = pack size x packs and the header count bumps", async ({
  page,
  baseURL,
}) => {
  await page.request.post(`${API}/__reset`);
  const login = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL! },
  });
  expect(login.ok()).toBeTruthy();
  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();

  await page.getByRole("radio", { name: /1 L/ }).check({ force: true });
  await expect(page.getByTestId("pack-price")).toHaveText("₹66");
  await expect(page.getByText("₹68", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "More packs" }).click();
  await page.getByRole("button", { name: "Add to cart · ₹132" }).click();
  await expect(page.getByText("Added 2 × 1 L to your cart.")).toBeVisible();
  // The badge counts packs in the cart's smallest pack (2 L = 4 × 500 ml), not lines.
  await expect(page.getByRole("link", { name: "Cart, 4 items" })).toBeVisible();

  // The cart got qty = 1000 ml x 2 packs and charges exactly what was shown: 2 × ₹66.
  const cart = await (await page.request.get("/api/backend/api/v1/cart")).json();
  expect(cart.items).toEqual([expect.objectContaining({ product_id: 1, qty: 2000, line_total: 132 })]);
  if (isMobile(page)) await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("unknown products show the on-brand 404", async ({ page }) => {
  await page.goto("/products/999-nope");
  await expect(page.getByRole("heading", { level: 1, name: "This page has gone sour." })).toBeVisible();
});
