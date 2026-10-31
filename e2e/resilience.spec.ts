import { expect, expectAccessible, expectNoHorizontalScroll, test } from "./fixtures";

const API = "http://127.0.0.1:8787";

test("a crashing account section shows the account error boundary, and Try again recovers", async ({
  page,
  baseURL,
}) => {
  await page.request.post(`${API}/__reset`);
  await page.request.post("/api/store-auth/otp/verify", {
    data: { phone: "9000000000", otp: "123456" },
    headers: { origin: baseURL! },
  });
  // Malformed data (no points history) makes the rewards page throw while rendering.
  await page.request.post(`${API}/__fail`, {
    data: { path: "/api/v1/loyalty", status: 200, body: { points_balance: 1 } },
  });
  await page.goto("/account/rewards");
  const boundary = page.getByRole("alert").filter({ hasText: "We couldn't load this section" });
  await expect(boundary.getByRole("heading", { level: 1 })).toBeFocused();
  // Only the section is replaced: the account nav is still there.
  await expect(page.getByRole("navigation", { name: "Account" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);

  await page.request.post(`${API}/__fail`, { data: { path: null } });
  await boundary.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rewards" })).toBeVisible();
  await expect(page.getByTestId("points-balance")).toHaveText("120");
});
