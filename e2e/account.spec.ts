import type { Page } from "@playwright/test";
import { choose, expect, isMobile, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signInCustomer(page: Page, baseURL: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

const nav = (page: Page) => page.getByRole("navigation", { name: "Account" });

test("account is customer-only; the overview shows wallet, subscriptions and recent orders", async ({
  page,
  baseURL,
}) => {
  await page.request.post(`${API}/__reset`);
  await page.goto("/account/wallet");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Faccount%2Fwallet$/);

  await signInCustomer(page, baseURL!);
  await visit(page, "/account", "Hello, Asha");
  await expect(nav(page).getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /Wallet balance/ })).toContainText("₹250");
  await expect(page.getByText("Active subscriptions")).toBeVisible();
  const recent = page.getByRole("region", { name: "Recent orders" });
  await recent.getByRole("link", { name: /Order DRS-000880/ }).click();
  await expect(page).toHaveURL(/\/account\/orders\/880$/);
  await expect(nav(page).getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");
});

test("orders: history, detail with tracking and the GST invoice PDF", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/orders", "Your orders");
  await page
    .getByRole("list", { name: "Your orders" })
    .getByRole("link", { name: /DRS-000880/ })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Order details" })).toBeVisible();
  await expect(page.getByText("Left at the door")).toBeVisible();
  await expect(page.getByRole("region", { name: "Items" })).toContainText("4 × 500 ml");
  await page.getByRole("button", { name: "GST invoice (PDF)" }).click();
  const view = page.getByRole("link", { name: /View PDF/ });
  await expect(view).toHaveAttribute("href", /\/files\/private\/invoices\/\d+\.pdf\?/);
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute(
    "download",
    /^DRS_2026-27_\d+\.pdf$/,
  );
});

test("addresses: add, edit, make default and delete", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/addresses", "Addresses");
  await expect(page.getByRole("heading", { name: "No saved addresses" })).toBeVisible();

  const add = async (line1: string, pincode: string, label: string) => {
    await page.getByRole("button", { name: "Add an address" }).click();
    const form = page.getByRole("form", { name: "New delivery address" });
    await form.getByLabel("Full name").fill("Asha Verma");
    await form.getByLabel("Mobile number").fill("9000000000");
    await form.getByLabel("House / flat, street").fill(line1);
    await form.getByLabel("City").fill("Jaipur");
    await form.getByLabel("Pincode").fill(pincode);
    await choose(form.getByLabel("State"), { label: "Rajasthan" });
    await choose(form.getByLabel("Save as"), { label });
    await form.getByRole("button", { name: "Save address" }).click();
    await expect(form).toBeHidden();
  };
  await add("12 Civil Lines", "302001", "Home");
  await add("Plot 4, Malviya Nagar", "302017", "Work");
  const list = page.getByRole("list", { name: "Saved addresses" });
  const home = list.getByRole("listitem").filter({ hasText: "12 Civil Lines" });
  const work = list.getByRole("listitem").filter({ hasText: "Malviya Nagar" });
  await expect(home).toContainText("Default"); // the first address becomes the default

  await work.getByRole("button", { name: "Make default: Work" }).click();
  await expect(work).toContainText("Default");
  await expect(home).not.toContainText("Default");

  await home.getByRole("button", { name: "Edit Home" }).click();
  const edit = page.getByRole("form", { name: "Edit address" });
  await edit.getByLabel("Landmark").fill("Statue Circle");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(home).toContainText("Near Statue Circle");

  await home.getByRole("button", { name: "Delete Home" }).click();
  await page
    .getByRole("dialog", { name: "Delete this address?" })
    .getByRole("button", { name: "Delete address" })
    .click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
});

test("profile: edit details, validation and notification preferences", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/profile", "Profile");
  const form = page.getByRole("form", { name: "Your profile" });
  await expect(form.getByLabel("Mobile number")).toHaveValue("9000000000");
  await expect(form.getByRole("button", { name: "Save changes" })).toBeDisabled();

  await form.getByRole("textbox", { name: "Email" }).fill("asha@");
  await form.getByLabel("What should we call you?").fill("Ashu");
  await form.getByRole("checkbox", { name: "Email updates" }).click();
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(form.getByText("Enter a valid email address")).toBeVisible();

  await form.getByRole("textbox", { name: "Email" }).fill("asha@example.com");
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
  await page.reload();
  await expect(form.getByRole("textbox", { name: "Email" })).toHaveValue("asha@example.com");
  await expect(form.getByRole("checkbox", { name: "Email updates" })).toBeChecked();
  await visit(page, "/account", "Hello, Ashu");
});

test("wallet: balance, paginated transactions and top-up (coming soon without gateway keys)", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/wallet", "Wallet");
  await expect(page.getByTestId("wallet-balance")).toHaveText("₹250");
  await expect(page.getByRole("heading", { name: "Online top-up coming soon" })).toBeVisible();
  const txns = page.getByRole("list", { name: "Wallet transactions" });
  await expect(txns.getByRole("listitem")).toHaveCount(20);
  const pager = page.getByRole("navigation", { name: "Transaction pages" });
  await expect(pager).toContainText("1–20 of 23");
  await pager.getByRole("button", { name: "Older" }).click();
  await expect(pager).toContainText("21–23 of 23");
  await expect(txns.getByRole("listitem")).toHaveCount(3);
  await expect(pager.getByRole("button", { name: "Older" })).toBeDisabled();
});

test("sign out from the account menu ends the customer session", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account", "Hello, Asha");
  await nav(page).getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login/);
  if (isMobile(page)) await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});
