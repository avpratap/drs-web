import type { Page } from "@playwright/test";
import { choose, expect, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

async function signInCustomer(page: Page, baseURL: string) {
  await page.request.post(`${API}/__reset`);
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

test("rewards: points history, referral code, and redeeming a friend's code", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/rewards", "Rewards");
  await expect(page.getByTestId("points-balance")).toHaveText("120");
  await expect(page.getByRole("list", { name: "Points history" })).toContainText("Referral reward");
  await expect(page.getByText("ASHA2026")).toBeVisible();

  const form = page.getByRole("region", { name: "Got a friend's code?" });
  await form.getByLabel("Referral code").fill("ASHA2026");
  await form.getByRole("button", { name: "Apply" }).click();
  await expect(form.getByRole("alert")).toHaveText("You can't use your own referral code");
  await form.getByLabel("Referral code").fill("friend100");
  await form.getByRole("button", { name: "Apply" }).click();
  await expect(form.getByRole("status")).toContainText("Referral redeemed");
});

test("gift cards: balance check and redeem into the wallet", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/gift-cards", "Gift cards");
  const mine = page.getByRole("list", { name: "Your gift cards" });
  await expect(mine.getByRole("listitem")).toHaveCount(1);
  await expect(mine).toContainText("₹300 left of ₹500");

  await page.getByLabel("Gift card code").fill("nope1234");
  await page.getByRole("button", { name: "Check balance" }).click();
  const redeem = page.getByRole("region", { name: "Redeem a gift card" });
  await expect(redeem.getByRole("alert")).toHaveText("Gift card not found");

  await page.getByLabel("Gift card code").fill("welcome250");
  await page.getByRole("button", { name: "Check balance" }).click();
  await expect(page.getByText("WELCOME250: ₹250 available")).toBeVisible();
  await page.getByLabel("Amount to add").fill("100");
  await page.getByRole("button", { name: "Add to wallet", exact: true }).click();
  await expect(page.getByText("₹100 added to your wallet.")).toBeVisible();
  await expect(mine.getByRole("listitem")).toHaveCount(2); // now issued to me with ₹150 left

  await visit(page, "/account/wallet", "Wallet");
  await expect(page.getByTestId("wallet-balance")).toHaveText("₹350");
});

test("wishlist: heart on product cards and the PDP; the wishlist page lists and removes", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/products", "Shop all");
  const milkHeart = page.getByRole("button", { name: "Save Full Cream Milk to wishlist" });
  await expect(milkHeart).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Save A2 Desi Ghee to wishlist" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await milkHeart.click();
  await expect(milkHeart).toHaveAttribute("aria-pressed", "true");

  await visit(page, "/products/2-masala-buttermilk", "Masala Buttermilk");
  await page.getByRole("button", { name: "Save to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Saved to wishlist" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await visit(page, "/account/wishlist", "Wishlist");
  const saved = page.getByRole("list", { name: "Saved products" });
  await expect(saved.getByRole("listitem")).toHaveCount(3);
  await saved.getByRole("button", { name: "Save A2 Desi Ghee to wishlist" }).click();
  await expect(saved.getByRole("listitem")).toHaveCount(2);
});

test("wishlist heart asks signed-out shoppers to sign in", async ({ page }) => {
  await page.request.post(`${API}/__reset`);
  await page.goto("/products");
  await page.getByRole("button", { name: "Save Full Cream Milk to wishlist" }).click();
  await expect(page).toHaveURL(/\/account\/login\?next=%2Fproducts$/);
});

test("notifications: header bell badge, mark one and all as read", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account", "Hello, Asha");
  await page.getByRole("banner").getByRole("link", { name: "Notifications, 2 unread" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Notifications" })).toBeVisible();
  const list = page.getByRole("list", { name: "Notifications" });
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await list
    .getByRole("listitem")
    .filter({ hasText: "DRS-000880" })
    .getByRole("button", { name: "Mark read" })
    .click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Notifications, 1 unread" })).toBeVisible();
  await page.getByRole("button", { name: "Unread (1)" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByText("You're all caught up.")).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Notifications", exact: true }),
  ).toBeVisible();
});

test("support: open a request, read the thread and reply", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/support", "Help & support");
  await page.getByRole("button", { name: "New request" }).click();
  const form = page.getByRole("form", { name: "New support request" });
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(form.getByText("Add a short subject")).toBeVisible();
  await choose(form.getByLabel("What's it about?"), { label: "Product quality" });
  await form.getByLabel("Subject").fill("Curd was sour");
  await form.getByLabel("Message").fill("The curd delivered today tasted sour.");
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status").filter({ hasText: "sent" })).toBeVisible();

  const requests = page.getByRole("list", { name: "Your requests" });
  await expect(requests.getByRole("link")).toHaveCount(2);
  await requests.getByRole("link", { name: /Paneer was delivered late/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Support request" })).toBeVisible();
  const convo = page.getByRole("list", { name: "Conversation" });
  await expect(convo.getByRole("listitem")).toHaveCount(2);
  await page.getByLabel("Reply").fill("Thanks — today it was on time.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(convo.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText("Open", { exact: true }).first()).toBeVisible(); // awaiting-you → open again
});

test("privacy: consents, data export, and account deletion with an OTP", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/account/privacy", "Privacy & your data");
  await expect(page.getByRole("checkbox", { name: "Processing my data to run my account" })).toBeDisabled();
  const sms = page.getByRole("checkbox", { name: "Offers by SMS" });
  await expect(sms).not.toBeChecked();
  await sms.click();
  await expect(sms).toBeChecked();
  await expect(page.getByText("Offers by SMS: turned on.")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  expect((await download).suggestedFilename()).toMatch(/^drs-my-data-\d{4}-\d{2}-\d{2}\.json$/);

  await page.getByRole("button", { name: "Delete my account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your DRS account?" });
  await dialog.getByRole("button", { name: "Send code" }).click();
  await dialog.getByLabel(/Code sent to/).fill("000000");
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Invalid or expired OTP");
  await dialog.getByLabel(/Code sent to/).fill("123456");
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  const done = page.getByRole("dialog", { name: "Your account is deleted" });
  await expect(done).toContainText("kept for 8 years");
  await done.getByRole("button", { name: "Go to the home page" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login/);
});
