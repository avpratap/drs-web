import type { Page } from "@playwright/test";
import { expect, test, visit } from "./fixtures";

const API = "http://127.0.0.1:8787";

// The mock customer (9000000000) has a delivered, paid order of product 1 (Full Cream Milk):
// a verified purchase. They've never bought product 3 (A2 Desi Ghee).
async function signInCustomer(page: Page, baseURL: string) {
  const res = await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL },
  });
  expect(res.ok()).toBeTruthy();
}

const reviews = (page: Page) => page.getByRole("region", { name: "Ratings & reviews" });

test.beforeEach(async ({ page }) => {
  await page.request.post(`${API}/__reset`);
});

test("signed out: a sign-in prompt that comes back to the product", async ({ page }) => {
  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  const prompt = reviews(page).getByRole("link", { name: "Sign in to review" });
  await expect(prompt).toHaveAttribute("href", "/account/login?next=%2Fproducts%2F1-full-cream-milk");
  await expect(reviews(page).getByRole("button", { name: /Rate & review/ })).toHaveCount(0);
  await prompt.click();
  await expect(page).toHaveURL(/\/account\/login\?next=%2Fproducts%2F1-full-cream-milk$/);
});

test("submit, edit and delete a review of something they bought", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  const section = reviews(page);
  await section.getByRole("button", { name: /Rate & review/ }).click();
  const form = section.getByRole("form", { name: "Review Full Cream Milk" });

  // Submit: a star is required; the comment is optional.
  await form.getByRole("button", { name: "Post review" }).click();
  await expect(form.getByRole("alert")).toHaveText("Choose a star rating.");
  await form.getByRole("radio", { name: "4 stars" }).check();
  await form.getByLabel(/Your review/).fill("Creamy and always on time.");
  await form.getByRole("button", { name: "Post review" }).click();
  const mine = section.getByRole("region", { name: "Your review" });
  await expect(mine).toContainText("Creamy and always on time.");
  await expect(mine).toContainText("Verified purchase");
  await expect(mine).toContainText("4 out of 5 stars");
  await expect(section.getByRole("status")).toHaveText("Thanks for your review.");

  // It's theirs after a reload too (read back from the API, not local state).
  await page.reload();
  await expect(reviews(page).getByRole("region", { name: "Your review" })).toContainText(
    "Creamy and always on time.",
  );

  // Edit: the form starts from the saved review.
  await mine.getByRole("button", { name: /Edit review/ }).click();
  await expect(form.getByRole("radio", { name: "4 stars" })).toBeChecked();
  await expect(form.getByLabel(/Your review/)).toHaveValue("Creamy and always on time.");
  await form.getByRole("radio", { name: "5 stars" }).check();
  await form.getByLabel(/Your review/).fill("Even better this week.");
  await form.getByRole("button", { name: "Update review" }).click();
  await expect(mine).toContainText("Even better this week.");
  await expect(mine).toContainText("5 out of 5 stars");

  // Delete: confirmed in a dialog, then they can review again.
  await mine.getByRole("button", { name: /^Delete$/ }).click();
  await page
    .getByRole("dialog", { name: "Delete your review?" })
    .getByRole("button", { name: "Delete review" })
    .click();
  await expect(section.getByRole("status")).toHaveText("Review deleted.");
  await expect(section.getByRole("region", { name: "Your review" })).toHaveCount(0);
  await expect(section.getByRole("button", { name: /Rate & review/ })).toBeVisible();
  await page.reload();
  await expect(reviews(page).getByRole("button", { name: /Rate & review/ })).toBeVisible();
});

test("not a verified purchase: the review is held for approval and only they see it", async ({
  page,
  baseURL,
}) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/products/3-a2-desi-ghee", /A2 Desi Ghee/);
  const section = reviews(page);
  await section.getByRole("button", { name: /Rate & review/ }).click();
  await expect(section.getByText(/haven't bought this product are checked before they appear/)).toBeVisible();
  await section.getByRole("radio", { name: "3 stars" }).check();
  await section.getByRole("button", { name: "Post review" }).click();
  const mine = section.getByRole("region", { name: "Your review" });
  await expect(mine).toContainText("Awaiting approval");
  await expect(mine).not.toContainText("Verified purchase");
  await expect(section.getByRole("status")).toHaveText("Thanks! Your review will appear once it's approved.");

  // The public list doesn't show a held review to anyone else.
  const other = await page.context().browser()!.newContext({ baseURL });
  const anon = await other.newPage();
  const res = await anon.request.get(`${API}/api/v1/products/3/ratings`);
  const body = (await res.json()) as { ratings: { status: string }[] };
  expect(body.ratings.every((r) => r.status === "approved")).toBe(true);
  await other.close();
});

test("the star picker works from the keyboard", async ({ page, baseURL }) => {
  await signInCustomer(page, baseURL!);
  await visit(page, "/products/1-full-cream-milk", "Full Cream Milk");
  await reviews(page)
    .getByRole("button", { name: /Rate & review/ })
    .click();
  const one = reviews(page).getByRole("radio", { name: "1 star" });
  await one.focus();
  await page.keyboard.press("Space");
  await expect(one).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(reviews(page).getByRole("radio", { name: "3 stars" })).toBeChecked();
});
