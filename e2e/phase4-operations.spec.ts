import { expect, test, visit } from "./fixtures";

test("returns: approve a request, then refund an approved one as store credit", async ({ admin: page }) => {
  await visit(page, "/returns", "Returns (RMA)");
  await page.getByRole("link", { name: /^RMA-0001/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "RMA-0001" })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await page
    .getByRole("dialog", { name: /approve rma-0001/i })
    .getByRole("button", { name: "Approve" })
    .click();
  await expect(page.getByText("Return approved")).toBeVisible();

  await page.goto("/returns/2");
  await page.getByRole("button", { name: "Refund" }).click();
  const dialog = page.getByRole("dialog", { name: /refund rma-0002/i });
  await expect(dialog.getByLabel(/refund amount/i)).toHaveValue("33");
  await dialog.getByLabel(/refund amount/i).fill("40");
  await dialog.getByRole("button", { name: "Refund" }).click();
  await expect(dialog.getByText(/at most 33/)).toBeVisible();
  await dialog.getByLabel(/refund amount/i).fill("33");
  await dialog.getByRole("button", { name: "Refund" }).click();
  await expect(page.getByText("Refund credited to the wallet")).toBeVisible();
  await expect(page.getByRole("table", { name: "Store credit paid" })).toContainText("+₹33.00");
});

test("returns: reject with a note", async ({ admin: page }) => {
  await page.goto("/returns/1");
  await page.getByRole("button", { name: "Reject" }).click();
  const dialog = page.getByRole("dialog", { name: /reject rma-0001/i });
  await dialog.getByLabel(/reason for rejecting/i).fill("Outside the return window");
  await dialog.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByText("Return rejected")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Outside the return window" })).toBeVisible();
});

test("subscriptions: edit standing-order lines, then pause", async ({ admin: page }) => {
  await visit(page, "/subscriptions", "Subscriptions");
  await page.getByRole("link", { name: /^Sharma Sweets/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sharma Sweets" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Standing order" })).toContainText("Daily");

  await page.getByRole("button", { name: "Edit lines" }).click();
  await page.getByRole("button", { name: /add product/i }).click();
  await page.getByLabel("Product (line 2)").selectOption({ label: "Masala Buttermilk (BTRMLK-200)" });
  await page.getByLabel("Qty per drop (line 2)").fill("6");
  await page.getByLabel("Frequency (line 2)").selectOption("weekly");
  await page.getByRole("button", { name: "Save standing order" }).click();
  await expect(page.getByText("Weekdays 1–7, comma separated")).toBeVisible();
  await page.getByLabel("Days (Mon=1) (line 2)").fill("6,7");
  await page.getByRole("button", { name: "Save standing order" }).click();
  await expect(page.getByText("Standing order saved")).toBeVisible();
  const table = page.getByRole("table", { name: "Standing order" });
  await expect(table).toContainText("Sat, Sun");

  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("dialog", { name: /pause deliveries/i })
    .getByRole("button", { name: "Pause" })
    .click();
  await expect(page.getByText("Subscription paused")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
});

test("shops: set price tier and assign a driver", async ({ admin: page }) => {
  await visit(page, "/shops", "Shops");
  await page.getByRole("link", { name: /^Verma residence/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Verma residence" })).toBeVisible();
  await page.getByRole("button", { name: "Set price tier" }).click();
  const tier = page.getByRole("dialog", { name: "Set price tier" });
  await tier.getByLabel(/price tier/i).selectOption({ label: "Retail (RETAIL)" });
  await tier.getByRole("button", { name: "Set price tier" }).click();
  await expect(page.getByText("Price tier set")).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: /^Retail$/ })).toBeVisible();

  await page.getByRole("button", { name: "Assign driver" }).click();
  const assign = page.getByRole("dialog", { name: "Assign driver" });
  await assign.getByLabel(/driver/i).selectOption({ label: "Suresh (driver) · 9999900004" });
  await assign.getByRole("button", { name: "Assign driver" }).click();
  await expect(page.getByText("Driver assigned", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Delivery drivers" })).toContainText("Suresh (driver)");
});

test("cutoff: status, manual run and history", async ({ admin: page }) => {
  await visit(page, "/cutoff", "Cutoff runs");
  await expect(page.getByText("Not run yet")).toBeVisible();
  await page.getByRole("button", { name: "Run cutoff now" }).click();
  await page
    .getByRole("dialog", { name: "Run the cutoff" })
    .getByRole("button", { name: "Run cutoff now" })
    .click();
  await expect(page.getByText("Cutoff run finished")).toBeVisible();
  await expect(page.getByText("Not run yet")).toHaveCount(0);
  await expect(page.getByRole("table", { name: "Cutoff run history" }).getByRole("row")).toHaveCount(3);
});

test("users: filter drivers and search", async ({ admin: page }) => {
  await visit(page, "/users", "Users & staff");
  await page.getByLabel("Role", { exact: true }).selectOption("delivery");
  const table = page.getByRole("table", { name: "Users & staff" });
  await expect(table.getByRole("row")).toHaveCount(3);
  await page.getByRole("searchbox", { name: /search by phone or name/i }).fill("Suresh");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table).toContainText("9999900004");
  await expect(table.getByRole("button", { name: "Edit Suresh (driver)" })).toBeVisible();
});

test("locations: a duplicate name is refused with a clear message", async ({ admin: page }) => {
  await page.goto("/locations/create");
  await page.getByLabel(/^Name/).fill("jaipur PLANT");
  await page.getByRole("button", { name: "Create location" }).click();
  await expect(page.getByText("A location with this name already exists")).toBeVisible();
  await expect(page).toHaveURL(/\/locations\/create$/);
});
