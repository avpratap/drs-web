import { expect, test, visit } from "./fixtures";

test("stock: low-stock flag, reorder suggestion and an adjustment", async ({ admin: page }) => {
  await visit(page, "/stock", "Stock");
  const table = page.getByRole("table", { name: "Stock levels" });
  await expect(table.getByRole("row", { name: /A2 Desi Ghee/ })).toContainText("Low");
  await page.getByRole("tab", { name: "Reorder suggestions" }).click();
  await expect(page.getByRole("table", { name: "Reorder suggestions" })).toContainText("34");

  await page.getByRole("button", { name: "Adjust stock" }).click();
  const dialog = page.getByRole("dialog", { name: "Adjust stock" });
  await dialog.getByLabel(/^Product/).selectOption({ label: "Full Cream Milk (MILK-FC-500)" });
  await dialog.getByLabel(/^Change/).fill("-20");
  await dialog.getByLabel(/^Reason/).selectOption("adjustment");
  await dialog.getByRole("button", { name: "Adjust stock" }).click();
  await expect(page.getByText("Stock adjusted")).toBeVisible();
  await page.getByRole("tab", { name: "All stock" }).click();
  await expect(
    page.getByRole("table", { name: "Stock levels" }).getByRole("row", { name: /Full Cream Milk/ }),
  ).toContainText("400");
});

test("batches are FEFO and a new batch can be received", async ({ admin: page }) => {
  await visit(page, "/batches", "Batches (FEFO)");
  const rows = page.getByRole("table", { name: "Batches (FEFO)" }).getByRole("row");
  await expect(rows.nth(1)).toContainText("MLK-2410A"); // expires first
  await expect(rows.nth(1)).toContainText("Today");
  await page.getByRole("button", { name: "Receive batch" }).click();
  const dialog = page.getByRole("dialog", { name: "Receive batch" });
  await dialog.getByLabel(/^Product/).selectOption({ label: "A2 Desi Ghee (GHEE-1L)" });
  await dialog.getByLabel(/^Batch no/).fill("GHE-2410");
  await dialog.getByLabel(/^Quantity/).fill("24");
  await dialog.getByLabel(/^Manufactured/).fill("2026-10-20");
  await dialog.getByLabel(/^Expiry/).fill("2026-10-01");
  await dialog.getByRole("button", { name: "Receive batch" }).click();
  await expect(dialog.getByText("Expiry is before manufacture")).toBeVisible();
  await dialog.getByLabel(/^Expiry/).fill("2027-04-20");
  await dialog.getByRole("button", { name: "Receive batch" }).click();
  await expect(page.getByText("Batch received")).toBeVisible();
  await expect(page.getByRole("table", { name: "Batches (FEFO)" })).toContainText("GHE-2410");
});

test("purchase order: create → place → receive (GRN)", async ({ admin: page }) => {
  await visit(page, "/purchase-orders", "Purchase orders");
  await page.getByRole("link", { name: "New purchase order" }).click();
  await page.getByLabel(/^Supplier/).selectOption({ label: "Gwala Dairy Co-op" });
  await page.getByLabel("Product (line 1)").selectOption({ label: "Full Cream Milk (MILK-FC-500)" });
  await page.getByLabel("Quantity (line 1)").fill("200");
  await page.getByLabel("Unit cost (₹) (line 1)").fill("28");
  await page.getByRole("button", { name: "Create draft PO" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^PO-/ })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "₹5,600.00" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Place order" }).click();
  await page
    .getByRole("dialog", { name: "Place order" })
    .getByRole("button", { name: "Place order" })
    .click();
  await expect(page.getByText("Purchase order placed")).toBeVisible();

  await page.getByRole("button", { name: "Receive goods" }).click();
  const grn = page.getByRole("dialog", { name: /goods receipt/i });
  await expect(grn.getByLabel("Qty received (line 1)")).toHaveValue("200");
  await grn.getByLabel("Batch no. (line 1)").fill("mlk-po-1");
  await grn.getByRole("button", { name: "Receive goods" }).click();
  await expect(page.getByText("Goods received")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: /^Received$/ })).toBeVisible();
});

test("transfer: dispatch a draft", async ({ admin: page }) => {
  await visit(page, "/transfers", "Transfers");
  await page.getByRole("link", { name: /^TR-0001/ }).click();
  await page.getByRole("button", { name: "Dispatch" }).click();
  await page.getByRole("dialog", { name: "Dispatch" }).getByRole("button", { name: "Dispatch" }).click();
  await expect(page.getByText("Transfer dispatched")).toBeVisible();
  await expect(page.getByRole("button", { name: "Receive" })).toBeVisible();
});

test("production and BOM pages render", async ({ admin: page }) => {
  await visit(page, "/boms", "Bills of materials");
  await page.getByRole("link", { name: /^Masala chaas/ }).click();
  await expect(page.getByRole("table", { name: "Components" })).toContainText("Full Cream Milk");
  await visit(page, "/production-orders", "Production");
  await visit(page, "/locations", "Locations");
  await visit(page, "/suppliers", "Suppliers");
});
