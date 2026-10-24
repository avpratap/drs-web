import { expect, test, visit } from "./fixtures";

test("reports: KPIs, charts with tables, range switch", async ({ admin: page }) => {
  await visit(page, "/reports", "Reports");
  await expect(page.getByText("₹12,84,500.00")).toBeVisible();
  await expect(page.getByRole("img", { name: /^Revenue: 30 days/ })).toBeVisible();
  await page.getByRole("button", { name: "Last 7 days" }).click();
  await expect(page.getByRole("img", { name: /^Revenue: 7 days/ })).toBeVisible();
  await page.getByText("Show data table").first().click();
  await expect(page.getByRole("table", { name: /Revenue per day — data/ })).toBeVisible();
  await expect(page.getByRole("list", { name: "Top products by revenue" })).toContainText("A2 Desi Ghee");
});

test("CMS: write and publish an article; banners and pages render", async ({ admin: page }) => {
  await visit(page, "/articles", "Articles");
  await page.getByRole("link", { name: "New article" }).click();
  await page.getByLabel(/^Title/).fill("Making ghee the bilona way");
  await page.getByLabel(/^Slug/).fill("Bilona Ghee");
  await page.getByLabel(/^Body/).fill("<p>Slow-churned from curd.</p>");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText(/Lowercase letters, digits and single hyphens/)).toBeVisible();
  await page.getByLabel(/^Slug/).fill("bilona-ghee");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Articles" })).toBeVisible();
  const row = page.getByRole("row", { name: /Making ghee the bilona way/ });
  await row.getByRole("button", { name: "Publish" }).click();
  await page
    .getByRole("dialog", { name: /publish “making ghee/i })
    .getByRole("button", { name: "Publish" })
    .click();
  await expect(row).toContainText("Published");

  await visit(page, "/banners", "Banners");
  await visit(page, "/pages", "Pages");
  await visit(page, "/newsletter", "Newsletter");
});

test("support: reply to a ticket and resolve it", async ({ admin: page }) => {
  await visit(page, "/tickets", "Support tickets");
  await page.getByRole("link", { name: /^Milk was sour/ }).click();
  await page.getByLabel(/reply to customer/i).fill("Sorry — a fresh pouch is on tomorrow's route.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Reply sent")).toBeVisible();
  await expect(page.getByText("Sorry — a fresh pouch is on tomorrow's route.")).toBeVisible();
  await page.getByLabel("Change status").selectOption("resolved");
  await expect(page.getByText("Ticket resolved")).toBeVisible();
});

test("ratings: approve and reply", async ({ admin: page }) => {
  await visit(page, "/ratings", "Ratings");
  const table = page.getByRole("table", { name: "Ratings" });
  await table.getByRole("button", { name: "Reply" }).click();
  const dialog = page.getByRole("dialog", { name: "Public reply" });
  await dialog.getByLabel(/^Reply/).fill("Thank you!");
  await dialog.getByRole("button", { name: "Reply" }).click();
  await expect(page.getByText("Reply saved")).toBeVisible();
  await table.getByRole("button", { name: "Approve review 1" }).click();
  await expect(page.getByText("Review approved")).toBeVisible();
});

test("coupons: create and deactivate", async ({ admin: page }) => {
  await visit(page, "/coupons", "Coupons");
  await page.getByRole("link", { name: "New coupon" }).click();
  await page.getByLabel(/^Code/).fill("diwali15");
  await page.getByLabel(/^Value/).fill("15");
  await page.getByLabel(/^Max discount/).fill("200");
  await page.getByRole("button", { name: "Create coupon" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "DIWALI15" })).toBeVisible();
  await page.getByRole("button", { name: "Deactivate" }).click();
  await page
    .getByRole("dialog", { name: /deactivate diwali15/i })
    .getByRole("button", { name: "Deactivate" })
    .click();
  await expect(page.getByText("Coupon deactivated")).toBeVisible();
});

test("audit log and feature flags", async ({ admin: page }) => {
  await visit(page, "/audit-log", "Audit log");
  await page.getByRole("table", { name: "Audit log" }).locator("summary").first().click();
  await expect(page.getByLabel("Detail of audit entry 1")).toContainText("WELCOME50");

  await visit(page, "/feature-flags", "Feature flags");
  const sw = page.getByRole("switch", { name: "checkout.upi_intent" });
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
});
