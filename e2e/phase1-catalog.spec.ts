import { choose, expect, test, visit } from "./fixtures";

test("product list: totals, retired filter and create", async ({ admin: page }) => {
  await visit(page, "/products", "Products");
  const table = page.getByRole("table", { name: "Products" });
  await expect(table.getByRole("link", { name: /^Full Cream Milk/ })).toBeVisible();
  // Retired products are visible to admins and filterable.
  await choose(page.getByLabel("Status"), "retired");
  await expect(table.getByRole("link", { name: /^Malai Paneer/ })).toBeVisible();
  await expect(table.getByRole("link", { name: /^Full Cream Milk/ })).toHaveCount(0);

  await page.getByRole("link", { name: "New product" }).click();
  await page.getByLabel(/^SKU/).fill("CURD-400");
  await page.getByLabel(/^Name/).fill("Set Curd 400 g");
  await page.getByLabel(/^HSN code/).fill("04");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page.getByText("HSN must be 4, 6 or 8 digits")).toBeVisible();
  await page.getByLabel(/^HSN code/).fill("0403");
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Set Curd 400 g" })).toBeVisible();
});

test("product detail shows variants; price list filters by product", async ({ admin: page }) => {
  await visit(page, "/products/1", "Full Cream Milk");
  await expect(page.getByRole("table", { name: /Variants of/ })).toContainText("1 L");
  await page.getByRole("link", { name: "Prices", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Product prices" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Product prices" })).toContainText("₹33.00");
});
