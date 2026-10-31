import type { Page } from "@playwright/test";
import { choose, expect, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signIn(page: Page, baseURL: string, phone: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone, otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}
const SUBSCRIBER = "9000000001";
const CUSTOMER = "9000000000";

const nav = (page: Page) => page.getByRole("navigation", { name: "Account" });
const shopSwitcher = (page: Page) => page.getByRole("combobox", { name: /Showing shop/ });

test("business pages are hidden from retail customers and visitors", async ({ page, baseURL }) => {
  await page.request.post(`${API}/__reset`);
  await page.goto("/account/subscriptions");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Faccount%2Fsubscriptions$/);

  await signIn(page, baseURL!, CUSTOMER);
  await visit(page, "/account", "Hello, Asha");
  await expect(nav(page).getByRole("link", { name: "Orders" })).toBeVisible();
  await expect(nav(page).getByRole("link", { name: "Subscriptions" })).toHaveCount(0);
  await page.goto("/account/deliveries");
  await expect(page).toHaveURL(/\/account$/);
});

test("subscribers get the business section in the account nav", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account", "Hello, Asha");
  for (const name of ["Subscriptions", "Deliveries", "Invoices", "Shops", "Orders"])
    await expect(nav(page).getByRole("link", { name })).toHaveCount(1);
});

test("standing order: edit lines, change a single day, pause, resume and cancel", async ({
  page,
  baseURL,
}) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/subscriptions", "Subscriptions");
  await expect(shopSwitcher(page)).toContainText("Sharma Sweets, Karol Bagh");
  await page.getByRole("link", { name: /Sharma Sweets, Karol Bagh\s*Active/ }).click();
  await expect(page).toHaveURL(/\/account\/subscriptions\/801$/);
  await expect(nav(page).getByRole("link", { name: "Subscriptions" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await visit(page, "/account/subscriptions/801", "Standing order");

  const standing = page.getByRole("region", { name: "Standing order" });
  const lines = standing.getByRole("list", { name: "Standing order lines" });
  await expect(lines.getByRole("listitem")).toHaveCount(2);
  await lines.getByLabel("Quantity per delivery (ml)").first().fill("25000");
  await standing.getByRole("button", { name: "Save standing order" }).click();
  await expect(standing.getByRole("status")).toHaveText("Standing order saved.");

  const days = page.getByRole("region", { name: "Day by day" });
  await expect(days.getByRole("button", { name: "Tomorrow", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const tomorrow = days.getByRole("list", { name: "Deliveries on Tomorrow" });
  await expect(tomorrow).toContainText("25 L");
  await days.getByRole("button", { name: "Skip Full Cream Milk on Tomorrow" }).click();
  await expect(days.getByRole("status")).toHaveText("Full Cream Milk skipped for Tomorrow.");
  await expect(tomorrow.getByRole("listitem").first()).toContainText("No delivery");
  await days.getByRole("button", { name: "Add Full Cream Milk on Tomorrow" }).click();
  await days.getByLabel("Quantity on Tomorrow (ml)").fill("5000");
  await days.getByRole("button", { name: "Save", exact: true }).click();
  await expect(days.getByRole("status")).toHaveText("Full Cream Milk set to 5 L for Tomorrow.");
  await expect(tomorrow.getByRole("listitem").first()).toContainText("usually 25 L");

  const status = page.getByRole("region", { name: /Sharma Sweets, Karol Bagh/ });
  await status.getByRole("button", { name: "Pause" }).click();
  await expect(status.getByRole("status")).toContainText("Paused");
  await expect(days).toContainText("nothing is delivered until you resume");
  await status.getByRole("button", { name: "Resume" }).click();
  await expect(status.getByRole("status")).toContainText("Resumed");

  await status.getByRole("button", { name: "Cancel" }).click();
  const dialog = page.getByRole("dialog", { name: "Cancel this standing order?" });
  await dialog.getByRole("button", { name: "Cancel standing order" }).click();
  await expect(dialog).toBeHidden();
  await expect(status).toContainText("Cancelled");
  await expect(status.getByRole("button", { name: "Restart standing order" })).toBeVisible();
});

test("multi-shop: switch shop and start its standing order", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/subscriptions", "Subscriptions");
  await choose(shopSwitcher(page), { label: "Sharma Sweets, Lajpat Nagar" });
  await expect(page.getByText("No standing order for this shop yet.")).toBeVisible();
  // The other shop's standing order is still one tap away.
  await expect(page.getByRole("list", { name: "Your other shops" })).toContainText(
    "Sharma Sweets, Karol Bagh",
  );
  await page.getByRole("button", { name: "Start a standing order" }).click();
  await expect(page).toHaveURL(/\/account\/subscriptions\/\d+$/);

  const standing = page.getByRole("region", { name: "Standing order" });
  await expect(standing).toContainText("No products yet");
  await choose(standing.getByRole("combobox", { name: /Add a product/ }), {
    label: "Full Cream Milk (500 ml)",
  });
  await standing.getByRole("button", { name: "Add", exact: true }).click();
  await standing.getByRole("button", { name: "Save standing order" }).click();
  await expect(standing.getByRole("alert")).toHaveText("Enter a quantity (0 or more)");
  await standing.getByLabel("Quantity per delivery (ml)").fill("10000");
  await choose(standing.getByRole("combobox", { name: /How often/ }), "weekly");
  await standing.getByRole("checkbox", { name: "Saturday" }).click();
  await standing.getByRole("button", { name: "Save standing order" }).click();
  await expect(standing.getByRole("status")).toHaveText("Standing order saved.");
  await expect(page.getByRole("region", { name: "Day by day" })).toBeVisible();
});

test("deliveries by date, per shop", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/deliveries", "Deliveries");
  const day = page.getByRole("region", { name: "Tomorrow" });
  const list = day.getByRole("list", { name: "Deliveries on Tomorrow" });
  await expect(list.getByRole("listitem").filter({ hasText: "Delivery #" })).toHaveCount(1);
  await expect(list).toContainText("Standing order · Delivery #712");
  await expect(list).toContainText("Full Cream Milk");

  await choose(shopSwitcher(page), { label: "Sharma Sweets, Lajpat Nagar" });
  await expect(list).toContainText("One-off order · Delivery #713");
  await expect(list).toContainText("₹660.00");

  await page
    .getByRole("group", { name: "Delivery date" })
    .getByRole("button", { name: "Today", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Today" })).toContainText("No deliveries recorded.");
});

test("invoices with PDFs and the credit statement", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/invoices", "Invoices");
  const invoices = page.getByRole("list", { name: "Invoices" });
  await expect(invoices.getByRole("listitem")).toHaveCount(3);
  await expect(invoices.getByRole("listitem").first()).toContainText("Credit note");
  await page.getByRole("button", { name: "PDF of invoice DRS/2026-27/B002" }).click();
  await expect(page.getByRole("link", { name: /Open PDF for invoice DRS\/2026-27\/B002/ })).toHaveAttribute(
    "href",
    /\/files\/private\/invoices\/602\.pdf/,
  );

  await page.getByRole("tab", { name: "Credit statement" }).click();
  await expect(page.getByTestId("credit-outstanding")).toHaveText("₹1,520.00");
  const lines = page.getByRole("list", { name: "Statement lines" });
  await expect(lines.getByRole("listitem")).toHaveCount(4);
  await expect(lines).toContainText("Payment received");
});

test("invoices and the credit statement follow the shop switcher", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/invoices", "Invoices");
  await expect(shopSwitcher(page)).toContainText("Sharma Sweets, Karol Bagh");
  const invoices = page.getByRole("list", { name: "Invoices" });
  await expect(invoices.getByRole("listitem")).toHaveCount(3);
  await expect(invoices).not.toContainText("DRS/2026-27/B004");

  await choose(shopSwitcher(page), { label: "Sharma Sweets, Lajpat Nagar" });
  await expect(invoices.getByRole("listitem")).toHaveCount(1);
  await expect(invoices).toContainText("DRS/2026-27/B004");

  // The tab stays put across a switch, and the statement is that shop's own ledger.
  await page.getByRole("tab", { name: "Credit statement" }).click();
  await expect(page.getByTestId("credit-outstanding")).toHaveText("₹660.00");
  await choose(shopSwitcher(page), { label: "Sharma Sweets, Karol Bagh" });
  await expect(page.getByRole("tab", { name: "Credit statement" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("credit-outstanding")).toHaveText("₹1,520.00");
});

test("shops: list and add a shop, which becomes the one you're viewing", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/shops", "Shops");
  const shops = page.getByRole("list", { name: "Your shops" });
  await expect(shops.getByRole("listitem")).toHaveCount(2);

  await page.getByRole("button", { name: "Add a shop" }).click();
  const form = page.getByRole("region", { name: "Add a shop" });
  await form.getByRole("button", { name: "Add shop" }).click();
  await expect(form.getByText("Enter the shop's name")).toBeVisible();
  await form.getByLabel("Shop name").fill("Sharma Sweets, Rohini");
  await form.getByLabel("Delivery address").fill("Sector 7 Market");
  await choose(form.getByRole("combobox", { name: "State" }), "Delhi");
  await form.getByLabel("Pincode").fill("110085");
  await form.getByRole("button", { name: "Add shop" }).click();
  await expect(page.getByRole("status")).toContainText("Sharma Sweets, Rohini added");
  await expect(shops.getByRole("listitem")).toHaveCount(3);
  await expect(shops.getByRole("listitem").filter({ hasText: "Rohini" })).toContainText("Viewing");

  await shops.getByRole("button", { name: /View this shop.*Karol Bagh/ }).click();
  await expect(shops.getByRole("listitem").filter({ hasText: "Karol Bagh" })).toContainText("Viewing");
});

test("saving the standing order keeps the chosen day selected in Day by day", async ({ page, baseURL }) => {
  await signIn(page, baseURL!, SUBSCRIBER);
  await visit(page, "/account/subscriptions/801", "Standing order");
  const days = page.getByRole("region", { name: "Day by day" });
  const chips = days.getByRole("group", { name: "Delivery date" }).getByRole("button");
  const third = chips.nth(2);
  const label = (await third.textContent())!.trim();
  await third.click();
  await expect(third).toHaveAttribute("aria-pressed", "true");

  const standing = page.getByRole("region", { name: "Standing order" });
  await standing.getByLabel("Quantity per delivery (ml)").first().fill("30000");
  await standing.getByRole("button", { name: "Save standing order" }).click();
  await expect(standing.getByRole("status")).toHaveText("Standing order saved.");
  // Still on the same day, and its plan reflects the new quantity.
  await expect(days.getByRole("button", { name: label, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(days.getByRole("list", { name: `Deliveries on ${label}` })).toContainText("30 L");
});
