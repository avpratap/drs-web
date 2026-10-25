import type { Page } from "@playwright/test";
import {
  choose,
  expect,
  expectAccessible,
  expectNoHorizontalScroll,
  isMobile,
  test,
  visit,
} from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signInCustomer(page: Page, baseURL: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

async function addToCart(page: Page, baseURL: string, productId: number, qty: number) {
  const res = await page.request.post("/api/backend/api/v1/cart/items", {
    data: { product_id: productId, qty },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

test("cart: signed-out visitors are asked to sign in; empty cart offers the shop", async ({
  page,
  baseURL,
}) => {
  await page.request.post(`${API}/__reset`);
  await visit(page, "/cart", "Your cart");
  await expect(page.getByRole("heading", { name: "Sign in to see your cart" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/account/login?next=%2Fcart",
  );

  // Signed in with an empty cart. (Checked without `visit`'s networkidle wait: Next's link
  // prefetches on this short page can stay open in headless Chromium.)
  await signInCustomer(page, baseURL!);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start shopping/ })).toHaveAttribute("href", "/products");
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
});

test("cart: change packs, remove, coupon and a GST-inclusive summary", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await addToCart(page, baseURL!, 1, 1000); // 2 × 500 ml milk = ₹66
  await addToCart(page, baseURL!, 2, 200); // 1 × 200 ml buttermilk = ₹15
  await visit(page, "/cart", "Your cart");
  const items = page.getByRole("list", { name: "Items in your cart" });
  const milk = items.getByRole("listitem").filter({ hasText: "Full Cream Milk" });
  await expect(milk).toContainText("500 ml pack · ₹33 each");
  await expect(milk.getByRole("group", { name: "Packs of Full Cream Milk" })).toContainText("2");
  await expect(milk).toContainText("₹66");
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

  await milk.getByRole("button", { name: "One more pack of Full Cream Milk" }).click();
  await expect(milk).toContainText("₹99");
  const summary = page.getByRole("region", { name: "Order summary" });
  await expect(summary).toContainText("Subtotal (2 items)₹114");
  await expect(summary).toContainText("DeliveryFree");
  await expect(summary).toContainText(/Includes ₹\d/);

  await items.getByRole("button", { name: "Remove Masala Buttermilk" }).click();
  await expect(items.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();

  // Coupon below its minimum order is refused with the reason; above it, it applies.
  await summary.getByLabel("Coupon code").fill("welcome50");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByRole("alert")).toContainText("more to use WELCOME50");
  await addToCart(page, baseURL!, 3, 1); // ghee 1 L = ₹899
  await page.reload();
  await summary.getByLabel("Coupon code").fill("welcome50");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary).toContainText("WELCOME50 applied");
  await expect(summary).toContainText("Coupon discount−₹50");
  await expect(summary).toContainText("Total₹948"); // 99 + 899 − 50
});

test("checkout: add an address, unserviceable pincode blocks, place order with an Idempotency-Key (same key on retry)", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await addToCart(page, baseURL!, 3, 1); // ghee ₹899
  await visit(page, "/checkout", "Checkout");

  // No saved address: the form is open; validation explains what's missing.
  const form = page.getByRole("form", { name: "New delivery address" });
  await form.getByRole("button", { name: "Save address" }).click();
  await expect(form.getByText("Enter a 6-digit pincode")).toBeVisible();

  const fill = async (pincode: string, name: string) => {
    await form.getByLabel("Full name").fill(name);
    await form.getByLabel("Mobile number").fill("9000000000");
    await form.getByLabel("House / flat, street").fill("12 Civil Lines");
    await form.getByLabel("City").fill("Jaipur");
    await form.getByLabel("Pincode").fill(pincode);
    await choose(form.getByLabel("State"), { label: "Rajasthan" });
    await form.getByRole("button", { name: "Save address" }).click();
  };
  await fill("999999", "Far Away");
  await expect(page.getByText(/we don.t deliver to 999999/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Place order/ })).toBeDisabled();

  await page.getByRole("button", { name: "Add a new address" }).click();
  await fill("302001", "Asha Verma");
  await expect(page.getByText("We deliver to 302001")).toBeVisible();
  await expect(page.getByText("Tomorrow, before 7 am")).toBeVisible();
  await expect(page.getByText("Pay on delivery")).toBeVisible(); // gateway keys not configured

  // First attempt dies with a 503; the retry must re-send the SAME Idempotency-Key.
  const keys: string[] = [];
  let first = true;
  await page.route("**/api/backend/api/v1/cart/checkout", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    if (first) {
      first = false;
      await route.fulfill({ status: 503, json: { detail: "Temporarily unavailable" } });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Place order · ₹899" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Temporarily unavailable" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+\?placed=1$/);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
  expect(keys[1]).toBe(keys[0]);

  await expect(page.getByText("Thank you! Your order is placed.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pay on delivery" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Order progress" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Items" })).toContainText("A2 Desi Ghee");
  await expect(page.getByRole("complementary", { name: "Bill details" })).toContainText("Total₹899");
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();

  // History lists it.
  await visit(page, "/orders", "Your orders");
  await expect(page.getByRole("list", { name: "Your orders" }).getByRole("link")).toContainText(["₹899"]);
  if (isMobile(page)) await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("order pages are customer-only", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Forders$/);
});
