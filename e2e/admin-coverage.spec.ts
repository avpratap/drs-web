import { expect, test, toast, visit } from "./fixtures";

// Admin screens for backend features added after the first admin pass (live OpenAPI audit).

test("staff & shop access: a driver's shops are edited as one scope", async ({ admin: page }) => {
  await visit(page, "/admin/staff", "Staff & shop access");
  const table = page.getByRole("table", { name: "Staff & shop access" });
  await expect(table.getByRole("row").filter({ hasText: "Asha Admin" })).toContainText("All shops");
  const ramesh = table.getByRole("row").filter({ hasText: "Ramesh (driver)" });
  await expect(ramesh).toContainText("Sharma Sweets");
  await expect(table.getByRole("row").filter({ hasText: "Suresh (driver)" })).toContainText("No shops");

  await ramesh.getByRole("button", { name: "Shops for Ramesh (driver)" }).click();
  const dialog = page.getByRole("dialog", { name: /shops ramesh \(driver\) can serve/i });
  await expect(dialog.getByRole("checkbox", { name: /Sharma Sweets/ })).toBeChecked();
  await dialog.getByRole("checkbox", { name: /Verma residence/ }).check();
  await expect(dialog).toContainText("2 selected");
  await dialog.getByRole("button", { name: "Save shops" }).click();
  await expect(toast(page, "Shop access updated")).toBeVisible();
  await expect(ramesh).toContainText("Sharma Sweets, Verma residence");
});

test("route planner: the day's stops in driving order, per driver", async ({ admin: page }) => {
  await visit(page, "/admin/route", "Route planner");
  const stops = page.getByRole("table", { name: "Stops in order" });
  const rows = stops.getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("Delivery #32");
  await expect(rows.nth(2)).toContainText("Sharma Sweets");
  await expect(page.getByRole("region", { name: "Route summary" })).toContainText("4.8 km");

  await page.getByRole("combobox", { name: "Driver" }).click();
  await page.getByRole("option", { name: /Ramesh \(driver\)/ }).click();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Sharma Sweets");
});

test("unpriced packs: packs the storefront can't price today", async ({ admin: page }) => {
  await visit(page, "/admin/unpriced-packs", "Unpriced packs");
  const table = page.getByRole("table", { name: "Unpriced packs" });
  await expect(table).toContainText("Masala Buttermilk 200 ml");
  await expect(table).toContainText("Min qty above pack");
});

test("invoices: issue a credit note and land on it", async ({ admin: page }) => {
  await visit(page, "/admin/invoices/1", "DRS/2026-27/0001");
  await page.getByRole("button", { name: "Issue credit note" }).click();
  const dialog = page.getByRole("dialog", { name: /credit note against DRS\/2026-27\/0001/i });
  await dialog.getByLabel("Reason").fill("Damaged in transit");
  await dialog.getByRole("button", { name: "Issue credit note" }).click();
  await expect(toast(page, "Credit note issued")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /^DRS\/2026-27\/CN/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Issue credit note" })).toHaveCount(0);
});

test("users: erase a customer (DPDP); admins can't be erased", async ({ admin: page }) => {
  await visit(page, "/admin/users", "Users & staff");
  const table = page.getByRole("table", { name: "Users & staff" });
  await expect(table.getByRole("button", { name: "Erase Asha Admin" })).toHaveCount(0);
  await table.getByRole("button", { name: "Erase Asha Verma" }).click();
  await page
    .getByRole("dialog", { name: /erase asha verma/i })
    .getByRole("button", { name: "Erase permanently" })
    .click();
  await expect(toast(page, "User erased")).toBeVisible();
  await expect(table.getByRole("row").filter({ hasText: "erased-11" })).toContainText(/erased/i);
});
