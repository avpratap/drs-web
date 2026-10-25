import { choose, expect, test, toast, visit } from "./fixtures";

test("daily deliveries: summary, stops, POD and cash", async ({ admin: page }) => {
  await visit(page, "/delivery", "Daily deliveries");
  await expect(page.getByText("₹330.00").first()).toBeVisible(); // cash collected today
  const table = page.getByRole("table", { name: /Delivery stops on/ });
  await table.getByRole("link", { name: /^Sharma Sweets/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sharma Sweets" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proof of delivery" })).toBeVisible();
  await expect(page.getByText("Handed to counter")).toBeVisible();
  await expect(page.getByRole("table", { name: "Cash collected" })).toContainText("UPI-88213");
});

test("mark a pending stop as failed", async ({ admin: page }) => {
  await page.goto("/delivery/32");
  await page.getByRole("button", { name: "Mark failed" }).click();
  const dialog = page.getByRole("dialog", { name: /mark this stop as failed/i });
  await choose(dialog.getByLabel(/reason/i), "customer_unavailable");
  await dialog.getByRole("button", { name: "Mark failed" }).click();
  await expect(toast(page, "Stop marked failed")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Customer unavailable" })).toBeVisible();
});

test("orders list renders", async ({ admin: page }) => {
  await visit(page, "/orders", "Orders");
  await expect(page.getByRole("table", { name: "Orders" })).toContainText("ORD-0007");
});
