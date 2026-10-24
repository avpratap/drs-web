import { expect, test, visit } from "./fixtures";

test("account: top up the wallet and see it in the ledger", async ({ admin: page }) => {
  await visit(page, "/accounts", "Accounts & wallets");
  await page.getByRole("link", { name: /^Asha Verma/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Asha Verma" })).toBeVisible();
  await expect(page.getByText("₹450.00", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Top up wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Top up wallet" });
  await dialog.getByLabel(/amount/i).fill("250");
  await dialog.getByRole("button", { name: "Top up wallet" }).click();
  await expect(page.getByText("Wallet topped up")).toBeVisible();
  await expect(page.getByText("₹700.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("table", { name: "Wallet ledger" })).toContainText("+₹250.00");
});

test("B2B account: settle outstanding credit", async ({ admin: page }) => {
  await page.goto("/accounts/2");
  await expect(page.getByRole("tab", { name: "Credit ledger" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Settle credit" }).click();
  const dialog = page.getByRole("dialog", { name: "Settle credit" });
  await dialog.getByLabel(/amount received/i).fill("1200");
  await dialog.getByRole("button", { name: "Settle credit" }).click();
  await expect(page.getByText("Settlement recorded")).toBeVisible();
  await expect(page.getByRole("table", { name: "Credit ledger" })).toContainText("-₹1,200.00");
});

test("withdrawals: approve a request", async ({ admin: page }) => {
  await visit(page, "/withdrawals", "Withdrawals");
  const table = page.getByRole("table", { name: "Withdrawals" });
  await table.getByRole("button", { name: "Approve" }).click();
  await page
    .getByRole("dialog", { name: /approve withdrawal #1/i })
    .getByRole("button", { name: "Approve" })
    .click();
  await expect(page.getByText("Withdrawal approved")).toBeVisible();
  await expect(table.getByRole("cell", { name: "#1" })).toHaveCount(0); // gone from the "requested" view
});

test("payments → refund → reconcile", async ({ admin: page }) => {
  await visit(page, "/payments", "Payments");
  await page.getByRole("link", { name: /^#1 \d/ }).click();
  await page.getByRole("button", { name: "Refund" }).click();
  const dialog = page.getByRole("dialog", { name: /refund payment #1/i });
  await dialog.getByLabel(/amount/i).fill("50");
  await dialog.getByRole("button", { name: "Refund" }).click();
  await expect(page.getByText("Refund initiated")).toBeVisible();

  await visit(page, "/refunds", "Refunds");
  await page.getByRole("link", { name: /^#1 \d/ }).click();
  await page.getByRole("button", { name: "Reconcile" }).click();
  const rec = page.getByRole("dialog", { name: "Reconcile" });
  await rec.getByLabel(/outcome/i).selectOption("processed");
  await rec.getByRole("button", { name: "Reconcile" }).click();
  await expect(page.getByText("Refund reconciled")).toBeVisible();
});
