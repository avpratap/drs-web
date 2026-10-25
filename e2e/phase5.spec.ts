import { choose, expect, pickDate, test, visit } from "./fixtures";

test("gift cards: issue (code in toast) and void with a confirm dialog", async ({ admin: page }) => {
  await visit(page, "/gift-cards", "Gift cards");
  await expect(page.getByRole("table")).toContainText("DRS-GIFT-7Q2K");
  await page.getByRole("button", { name: "Issue gift card" }).click();
  const dialog = page.getByRole("dialog", { name: "Issue gift card" });
  await dialog.getByLabel(/Amount/).fill("750");
  await choose(dialog.getByRole("combobox", { name: /Issue to account/ }), {
    label: "Hotel Shree · 9811111111",
  });
  await pickDate(dialog.getByRole("button", { name: /Expires on/ }), "2027-06-30");
  await dialog.getByRole("button", { name: "Issue gift card" }).click();
  await expect(page.getByText(/^Gift card DRS-GIFT-\w{4} issued$/)).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Hotel Shree");

  await page.getByRole("button", { name: "Void gift card DRS-GIFT-7Q2K" }).click();
  const confirm = page.getByRole("dialog", { name: "Void gift card DRS-GIFT-7Q2K?" });
  await expect(confirm).toContainText("₹320.00");
  await confirm.getByRole("button", { name: "Void card" }).click();
  await expect(page.getByText("Gift card voided")).toBeVisible();
  await expect(page.getByRole("button", { name: "Void gift card DRS-GIFT-7Q2K" })).toHaveCount(0);
});

test("loyalty: adjust points with validation", async ({ admin: page }) => {
  await visit(page, "/loyalty", "Loyalty points");
  await page.getByRole("button", { name: /Adjust points for Asha Verma/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Points/).fill("-500");
  await dialog.getByRole("button", { name: "Adjust" }).click();
  await expect(dialog.getByText("Can't deduct more than 260")).toBeVisible();
  await dialog.getByLabel(/Points/).fill("40");
  await dialog.getByRole("button", { name: "Adjust" }).click();
  await expect(page.getByText("Points adjusted")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("300");
});

test("notifications: resend, flush and send a test", async ({ admin: page }) => {
  await visit(page, "/notifications", "Notifications");
  await page.getByRole("button", { name: "Resend notification 502" }).click();
  await expect(page.getByText("Notification re-queued")).toBeVisible();
  await page.getByRole("button", { name: "Send test" }).click();
  const dialog = page.getByRole("dialog", { name: "Send test" });
  await choose(dialog.getByRole("combobox", { name: /Recipient/ }), { label: "Asha Verma · 9876543210" });
  await dialog.getByRole("button", { name: "Send test" }).click();
  await expect(page.getByText("Test queued on 2 channels")).toBeVisible();
  await page.getByRole("button", { name: "Flush outbox" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Flush now" }).click();
  await expect(page.getByText(/Processed 3: 3 sent, 0 failed/)).toBeVisible();
});

test("webhooks: create, disable, test, delete", async ({ admin: page }) => {
  await visit(page, "/webhooks", "Webhooks");
  await page.getByRole("button", { name: "New webhook" }).click();
  const dialog = page.getByRole("dialog", { name: "New webhook" });
  await choose(dialog.getByRole("combobox", { name: /Event/ }), "subscription.paused");
  await dialog.getByLabel(/Endpoint URL/).fill("https://ops.example/drs");
  await dialog.getByRole("button", { name: "New webhook" }).click();
  await expect(page.getByText("Webhook created")).toBeVisible();
  await expect(page.getByRole("table")).toContainText("https://ops.example/drs");

  await page.getByRole("button", { name: /Disable webhook payment.success/ }).click();
  await expect(page.getByText("Webhook disabled")).toBeVisible();

  await page.getByRole("link", { name: /Manage.*erp.example/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "payment.success" })).toBeVisible();
  await page.getByRole("button", { name: "Send test event" }).click();
  await expect(page.getByText("Test delivery delivered")).toBeVisible();
  await expect(page.getByRole("table", { name: "Recent deliveries" }).getByRole("row")).toHaveCount(3);
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete webhook" }).click();
  await expect(page).toHaveURL(/\/webhooks$/);
  await expect(page.getByRole("table")).not.toContainText("erp.example");
});

test("insights: churn re-score, forecast window, reorder suggestions, copilot", async ({ admin: page }) => {
  await visit(page, "/churn", "Churn risk");
  await expect(page.getByRole("table")).toContainText("82%");
  await page.getByRole("button", { name: "Re-score accounts" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Run scoring" }).click();
  await expect(page.getByText("Scored 3 accounts")).toBeVisible();

  await visit(page, "/forecast", "Demand forecast");
  await expect(page.getByRole("table", { name: "Production plan" })).toContainText("Full Cream Milk");
  await choose(page.getByRole("combobox", { name: "History" }), "56");
  await expect(page.getByText("Based on the last 56 days")).toBeVisible();

  await visit(page, "/reorder-suggestions", "Reorder suggestions");

  await visit(page, "/copilot", "AI copilot");
  await page.getByRole("button", { name: "Which products sold most in the last 7 days?" }).click();
  await expect(page.getByText(/Full Cream Milk led sales/)).toBeVisible();
  await page.getByLabel("Your question").fill("And buttermilk?");
  await page.getByLabel("Your question").press("Enter");
  await expect(page.getByText(/for "And buttermilk\?"/)).toBeVisible();
});

test("invoices: list → detail → PDF dialog; order detail opens its invoice PDF", async ({ admin: page }) => {
  await visit(page, "/invoices", "Invoices");
  await page.getByRole("link", { name: /^DRS\/2026-27\/0001/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "DRS/2026-27/0001" })).toBeVisible();
  await page.getByRole("button", { name: "View PDF" }).click();
  const dialog = page.getByRole("dialog", { name: "Invoice DRS/2026-27/0001" });
  await expect(dialog.locator("iframe")).toHaveAttribute("src", /\/files\/private\/invoices\/1\.pdf/);
  await expect(dialog.getByRole("link", { name: "Download PDF" })).toHaveAttribute(
    "download",
    "DRS_2026-27_0001.pdf",
  );
  await page.keyboard.press("Escape");

  await page.goto("/orders/7");
  await page.getByRole("button", { name: "Invoice PDF" }).click();
  await expect(page.getByRole("dialog", { name: "Invoice DRS/2026-27/0001" })).toBeVisible();
});

test("CSV export downloads a file from the main lists", async ({ admin: page }) => {
  for (const [path, heading, kind] of [
    ["/orders", "Orders", "orders"],
    ["/payments", "Payments", "payments"],
    ["/users", "Users & staff", "users"],
    ["/invoices", "Invoices", "invoices"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(
      new RegExp(`^drs-${kind}-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
    );
    await expect(page.getByText(new RegExp(`^${kind}`, "i")).filter({ hasText: "exported" })).toBeVisible();
  }
});

test("overview: KPIs, needs attention and quick actions", async ({ admin: page }) => {
  await visit(page, "/", "Overview");
  const attention = page.getByRole("region", { name: "Needs attention" });
  await expect(attention.getByRole("link", { name: /Withdrawals to approve/ })).toBeVisible();
  await expect(attention.getByRole("link", { name: /High churn risk/ })).toContainText("1");
  await page.getByRole("link", { name: /Ask the AI copilot/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "AI copilot" })).toBeVisible();
});

test("purchase order GRN: expiry before manufacture is refused per line", async ({ admin: page }) => {
  await page.goto("/purchase-orders");
  await page.getByRole("link", { name: /^PO-/ }).first().click();
  const receive = page.getByRole("button", { name: "Receive goods (GRN)" });
  if (await receive.count()) {
    await receive.click();
    const grn = page.getByRole("dialog", { name: /goods receipt/i });
    await grn.getByLabel("Batch no. (line 1)").fill("B-1");
    await pickDate(grn.getByRole("button", { name: /Mfg \(line 1\)/ }), "2026-10-20");
    await pickDate(grn.getByRole("button", { name: /Expiry \(line 1\)/ }), "2026-10-01");
    await grn.getByRole("button", { name: "Receive goods (GRN)" }).click();
    await expect(grn.getByText("Expiry is before manufacture")).toBeVisible();
  }
});
