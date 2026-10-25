import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChurnPage from "@/app/admin/(dashboard)/churn/page";
import CopilotPage from "@/app/admin/(dashboard)/copilot/page";
import ForecastPage from "@/app/admin/(dashboard)/forecast/page";
import GiftCardsPage from "@/app/admin/(dashboard)/gift-cards/page";
import InvoiceShowPage from "@/app/admin/(dashboard)/invoices/[id]/page";
import LoyaltyPage from "@/app/admin/(dashboard)/loyalty/page";
import NotificationsPage from "@/app/admin/(dashboard)/notifications/page";
import OrderShowPage from "@/app/admin/(dashboard)/orders/[id]/page";
import WebhookShowPage from "@/app/admin/(dashboard)/webhooks/[id]/page";
import WebhooksPage from "@/app/admin/(dashboard)/webhooks/page";
import { OverviewDashboard } from "@/components/overview/dashboard";
import { downloadCsv } from "@/components/resource/export-csv";
import { nav } from "../../setup";
import { mockApi, pick, renderWithRefine } from "../../helpers";

const accounts = {
  path: "/api/v1/admin/accounts",
  body: [
    {
      id: 1,
      owner_user_id: 11,
      account_type: "retail",
      billing_mode: "prepaid_wallet",
      phone: "9876543210",
      full_name: "Asha Verma",
    },
    {
      id: 2,
      owner_user_id: 12,
      account_type: "b2b",
      billing_mode: "postpaid_credit",
      phone: "9811111111",
      full_name: "Hotel Shree",
    },
  ],
  headers: { "x-total-count": "2" },
};
const users = {
  path: "/api/v1/admin/users",
  body: [{ id: 11, phone: "9876543210", full_name: "Asha Verma", role: "customer", status: "active" }],
};
const card = {
  id: 1,
  code: "DRS-GIFT-7Q2K",
  initial_amount: 500,
  balance: 320,
  status: "active",
  issued_to_account_id: 1,
  expires_at: "2027-03-31",
};
const invoice = {
  id: 1,
  invoice_no: "DRS/2026-27/0001",
  fy: "2026-27",
  account_id: 1,
  order_id: 7,
  delivery_order_id: null,
  invoice_date: "2026-10-25",
  seller_gstin: "08AAACD1234F1Z5",
  buyer_gstin: null,
  place_of_supply: "Rajasthan",
  is_interstate: false,
  taxable_value: 314.29,
  cgst: 7.86,
  sgst: 7.85,
  igst: 0,
  total: 330,
  is_credit_note: false,
  is_partial: false,
  original_invoice_id: null,
  status: "issued",
  lines: [
    {
      product_id: 2,
      hsn_code: "0403",
      description: "Masala Buttermilk 200 ml",
      qty: 10,
      unit_price: 31.43,
      taxable_value: 314.29,
      gst_rate: 5,
      cgst: 7.86,
      sgst: 7.85,
      igst: 0,
      line_total: 330,
    },
  ],
};

describe("Gift cards", () => {
  it("lists cards, issues one (toast shows the new code) and voids an active card after confirming", async () => {
    const api = mockApi([
      accounts,
      { path: "/api/v1/admin/gift-cards", body: [card], headers: { "x-total-count": "1" } },
      {
        method: "POST",
        path: "/api/v1/admin/gift-cards",
        body: { ...card, id: 9, code: "DRS-GIFT-NEW1", balance: 750, initial_amount: 750, expires_at: null },
      },
      { method: "POST", path: "/api/v1/admin/gift-cards/1/void", body: { ...card, status: "disabled" } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<GiftCardsPage />);
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("DRS-GIFT-7Q2K")).toBeInTheDocument();
    expect(await within(table).findByRole("link", { name: /Asha Verma/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Issue gift card" }));
    const dialog = screen.getByRole("dialog", { name: "Issue gift card" });
    await user.type(within(dialog).getByLabelText(/Amount/), "750");
    await user.click(within(dialog).getByRole("button", { name: "Issue gift card" }));
    expect(await screen.findByText("Gift card DRS-GIFT-NEW1 issued")).toBeInTheDocument();
    const post = api.last("POST", "/api/v1/admin/gift-cards")!;
    expect(post.body).toEqual({ amount: 750 });
    expect(post.headers.get("idempotency-key")).toMatch(/[0-9a-f-]{36}/);

    await user.click(screen.getByRole("button", { name: "Void gift card DRS-GIFT-7Q2K" }));
    const confirm = screen.getByRole("dialog", { name: "Void gift card DRS-GIFT-7Q2K?" });
    expect(confirm).toHaveTextContent("₹320.00");
    await user.click(within(confirm).getByRole("button", { name: "Void card" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/gift-cards/1/void")).toBeTruthy());
    expect(await screen.findByText("Gift card voided")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const api = mockApi([
      accounts,
      { path: "/api/v1/admin/gift-cards", body: [card], headers: { "x-total-count": "1" } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<GiftCardsPage />);
    await screen.findByText("DRS-GIFT-7Q2K");
    await pick(user, screen.getByRole("combobox", { name: "Status" }), "redeemed");
    await waitFor(() =>
      expect(
        api.calls
          .filter((c) => c.path === "/api/v1/admin/gift-cards")
          .at(-1)!
          .query.get("status_filter"),
      ).toBe("redeemed"),
    );
  });
});

describe("Loyalty", () => {
  it("adjusts points and refuses to deduct more than the balance", async () => {
    const api = mockApi([
      accounts,
      {
        path: "/api/v1/admin/loyalty",
        body: [{ account_id: 2, points_balance: 1840 }],
        headers: { "x-total-count": "1" },
      },
      {
        method: "POST",
        path: "/api/v1/admin/loyalty/2/adjust",
        body: { account_id: 2, points_balance: 1940, recent: [] },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<LoyaltyPage />);
    expect(await screen.findByText("1,840")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Adjust points for Hotel Shree/ }));
    const dialog = screen.getByRole("dialog");
    const pts = within(dialog).getByLabelText(/Points/);
    await user.type(pts, "-2000");
    await user.click(within(dialog).getByRole("button", { name: "Adjust" }));
    expect(await within(dialog).findByText("Can't deduct more than 1,840")).toBeInTheDocument();
    await user.clear(pts);
    await user.type(pts, "100");
    await pick(user, within(dialog).getByRole("combobox", { name: /Reason/ }), "goodwill");
    await user.click(within(dialog).getByRole("button", { name: "Adjust" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/loyalty/2/adjust")?.body).toEqual({
        points: 100,
        reason: "goodwill",
      }),
    );
    expect(await screen.findByText("Points adjusted")).toBeInTheDocument();
  });
});

describe("Notifications", () => {
  const rows = [
    {
      id: 502,
      user_id: 11,
      event_type: "wallet.low",
      channel: "sms",
      category: "transactional",
      status: "failed",
      skip_reason: null,
      body: "Low wallet",
      attempts: 3,
    },
    {
      id: 501,
      user_id: 11,
      event_type: "payment.success",
      channel: "whatsapp",
      category: "transactional",
      status: "sent",
      skip_reason: null,
      body: "Paid",
      attempts: 1,
    },
  ];
  it("resends a failed message, flushes the outbox and sends a test", async () => {
    const api = mockApi([
      users,
      { path: "/api/v1/admin/notifications", body: rows },
      { method: "POST", path: "/api/v1/admin/notifications/502/resend", body: { id: 502, status: "queued" } },
      {
        method: "POST",
        path: "/api/v1/admin/notifications/flush",
        body: { processed: 3, sent: 3, failed: 0 },
      },
      {
        method: "POST",
        path: "/api/v1/admin/notifications/test",
        body: { created: [{ id: 9, channel: "whatsapp", status: "queued" }] },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<NotificationsPage />);
    expect(await screen.findByText("wallet.low")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend notification 501" })).not.toBeInTheDocument(); // sent
    await user.click(screen.getByRole("button", { name: "Resend notification 502" }));
    expect(await screen.findByText("Notification re-queued")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Flush outbox" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Flush now" }));
    expect(await screen.findByText("Processed 3: 3 sent, 0 failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send test" }));
    const dialog = screen.getByRole("dialog", { name: "Send test" });
    await pick(user, within(dialog).getByRole("combobox", { name: /Recipient/ }), "11");
    await user.click(within(dialog).getByRole("button", { name: "Send test" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/notifications/test")?.body).toEqual({
        user_id: 11,
        event_type: "payment.success",
      }),
    );
    expect(await screen.findByText("Test queued on 1 channel")).toBeInTheDocument();
  });
});

describe("Webhooks", () => {
  const hook = { id: 1, event_type: "payment.success", url: "https://erp.example/hooks/drs", active: true };
  it("creates a webhook with URL validation and toggles one", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/outbound-webhooks", body: [hook], headers: { "x-total-count": "1" } },
      { method: "POST", path: "/api/v1/admin/outbound-webhooks", body: { ...hook, id: 2 } },
      { method: "PATCH", path: "/api/v1/admin/outbound-webhooks/1", body: { ...hook, active: false } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<WebhooksPage />);
    expect(await screen.findByText("https://erp.example/hooks/drs")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Disable webhook payment.success/ }));
    await waitFor(() =>
      expect(api.last("PATCH", "/api/v1/admin/outbound-webhooks/1")?.body).toEqual({ active: false }),
    );

    await user.click(screen.getByRole("button", { name: "New webhook" }));
    const dialog = screen.getByRole("dialog", { name: "New webhook" });
    expect(within(dialog).getByRole("checkbox", { name: "Active" })).toBeChecked();
    await pick(user, within(dialog).getByRole("combobox", { name: /Event/ }), "order.generated");
    await user.type(within(dialog).getByLabelText(/Endpoint URL/), "ftp://nope");
    await user.click(within(dialog).getByRole("button", { name: "New webhook" }));
    expect(await within(dialog).findByText("Must be an http(s) URL")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText(/Endpoint URL/));
    await user.type(within(dialog).getByLabelText(/Endpoint URL/), "https://ops.example/drs");
    await user.click(within(dialog).getByRole("button", { name: "New webhook" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/outbound-webhooks")?.body).toEqual({
        event_type: "order.generated",
        url: "https://ops.example/drs",
        active: true,
      }),
    );
  });

  it("detail: sends a test event, lists deliveries and deletes after confirming", async () => {
    nav.params = { id: "1" };
    const api = mockApi([
      { path: "/api/v1/admin/outbound-webhooks", body: [hook] },
      {
        path: "/api/v1/admin/outbound-webhooks/1/deliveries",
        body: [
          {
            id: 7,
            webhook_id: 1,
            event_type: "payment.success",
            status: "delivered",
            attempts: 1,
            response_code: 200,
          },
        ],
        headers: { "x-total-count": "1" },
      },
      {
        method: "POST",
        path: "/api/v1/admin/outbound-webhooks/1/test",
        body: {
          id: 8,
          webhook_id: 1,
          event_type: "payment.success",
          status: "delivered",
          attempts: 1,
          response_code: 200,
        },
      },
      { method: "DELETE", path: "/api/v1/admin/outbound-webhooks/1", status: 204 },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<WebhookShowPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "payment.success" })).toBeInTheDocument();
    expect(await screen.findByRole("table", { name: "Recent deliveries" })).toHaveTextContent("#7");
    await user.click(screen.getByRole("button", { name: "Send test event" }));
    expect(await screen.findByText("Test delivery delivered")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete webhook" }));
    await waitFor(() => expect(api.last("DELETE", "/api/v1/admin/outbound-webhooks/1")).toBeTruthy());
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/admin/webhooks"));
  });
});

describe("Churn, forecast, copilot", () => {
  it("churn: risk counts, table and re-scoring", async () => {
    const api = mockApi([
      accounts,
      {
        path: "/api/v1/admin/ml/churn",
        body: [{ account_id: 2, score: 0.82, risk: "high" }],
        headers: { "x-total-count": "1" },
      },
      {
        method: "POST",
        path: "/api/v1/admin/ml/churn/score",
        body: { scored: 5, low: 2, medium: 2, high: 1 },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ChurnPage />);
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("82%")).toBeInTheDocument();
    expect(within(table).getByText("High")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        api.calls.filter((c) => c.path === "/api/v1/admin/ml/churn").map((c) => c.query.get("risk")),
      ).toEqual(expect.arrayContaining(["high", "medium", "low"])),
    );
    await user.click(screen.getByRole("button", { name: "Re-score accounts" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Run scoring" }));
    expect(await screen.findByText("Scored 5 accounts")).toBeInTheDocument();
    expect(screen.getByText("1 high · 2 medium · 2 low risk")).toBeInTheDocument();
  });

  it("forecast: shows the plan and refetches for a different history window", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/forecast",
        body: {
          for_date: "2026-10-26",
          history_days: 28,
          plan: [
            {
              product_id: 1,
              product_name: "Full Cream Milk",
              committed_qty: 240,
              forecast_variable_qty: 36.5,
              safety_qty: 12,
              recommended_production: 288.5,
              method: "seasonal_naive",
            },
          ],
        },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ForecastPage />);
    const table = await screen.findByRole("table", { name: "Production plan" });
    expect(await within(table).findByText("Full Cream Milk")).toBeInTheDocument();
    expect(within(table).getByText("288.5")).toBeInTheDocument();
    await pick(user, screen.getByRole("combobox", { name: "History" }), "56");
    await waitFor(() =>
      expect(
        api.calls
          .filter((c) => c.path === "/api/v1/admin/forecast")
          .at(-1)!
          .query.get("history_days"),
      ).toBe("56"),
    );
  });

  it("copilot: asks a question and shows the answer", async () => {
    const api = mockApi([
      { method: "POST", path: "/api/v1/admin/ai/ask", body: { answer: "Milk sold most.", ai_live: false } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<CopilotPage />);
    await user.type(screen.getByLabelText("Your question"), "What sold most?");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("Milk sold most.")).toBeInTheDocument();
    expect(screen.getByText("Offline answer")).toBeInTheDocument();
    expect(api.last("POST", "/api/v1/admin/ai/ask")?.body).toEqual({ message: "What sold most?" });
    expect(screen.getByLabelText("Your question")).toHaveValue("");
  });
});

describe("Invoices, exports and overview", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("invoice detail: lines, totals and a PDF dialog with download", async () => {
    nav.params = { id: "1" };
    mockApi([
      accounts,
      { path: "/api/v1/invoices/1", body: invoice },
      {
        path: "/api/v1/invoices/1/pdf",
        body: { invoice_no: invoice.invoice_no, pdf_url: "https://files.example/inv-1.pdf?sig=x" },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<InvoiceShowPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "DRS/2026-27/0001" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Lines" })).toHaveTextContent("Masala Buttermilk 200 ml");
    await user.click(screen.getByRole("button", { name: "View PDF" }));
    const dialog = await screen.findByRole("dialog", { name: "Invoice DRS/2026-27/0001" });
    expect(within(dialog).getByTitle("Invoice DRS/2026-27/0001 PDF")).toHaveAttribute(
      "src",
      "https://files.example/inv-1.pdf?sig=x",
    );
    expect(within(dialog).getByRole("link", { name: "Download PDF" })).toHaveAttribute(
      "download",
      "DRS_2026-27_0001.pdf",
    );
  });

  it("order detail: issues/fetches the order's invoice and opens its PDF", async () => {
    nav.params = { id: "7" };
    const api = mockApi([
      { path: "/api/v1/admin/products", body: [] },
      { path: "/api/v1/admin/locations", body: [] },
      {
        path: "/api/v1/orders/7",
        body: {
          id: 7,
          order_no: "ORD-0007",
          account_id: 1,
          shop_id: 1,
          status: "delivered",
          payment_status: "paid",
          order_type: "one_time",
          subtotal: 314.29,
          total: 330,
          items: [],
        },
      },
      { method: "POST", path: "/api/v1/orders/7/invoice", body: invoice },
      {
        path: "/api/v1/invoices/1/pdf",
        body: { invoice_no: invoice.invoice_no, pdf_url: "/files/private/inv-1.pdf?sig=x" },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<OrderShowPage />);
    await user.click(await screen.findByRole("button", { name: "Invoice PDF" }));
    expect(await screen.findByRole("dialog", { name: "Invoice DRS/2026-27/0001" })).toBeInTheDocument();
    expect(api.last("POST", "/api/v1/orders/7/invoice")).toBeTruthy();
  });

  it("CSV export downloads the file and reports truncation", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/exports/orders.csv",
        body: "id,total",
        headers: { "x-export-truncated": "true" },
      },
    ]);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await expect(downloadCsv("orders")).resolves.toEqual({ truncated: true });
    expect(api.calls[0].path).toBe("/api/v1/admin/exports/orders.csv");
    expect(click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });

  it("overview: KPIs and needs-attention counts", async () => {
    mockApi([
      {
        path: "/api/v1/admin/analytics/overview",
        body: {
          paid_order_revenue: 125000,
          orders: 340,
          active_subscriptions: 42,
          delivered_orders: 300,
          low_stock_items: 3,
          credit_outstanding: 3200,
          wallet_float: 9100,
        },
      },
      { path: "/api/v1/admin/withdrawals", body: [{}], headers: { "x-total-count": "2" } },
      { path: "/api/v1/admin/returns", body: [], headers: { "x-total-count": "0" } },
      { path: "/api/v1/admin/support/tickets", body: [{}], headers: { "x-total-count": "4" } },
      { path: "/api/v1/admin/stock/low", body: [{}], headers: { "x-total-count": "3" } },
      { path: "/api/v1/admin/ml/churn", body: [{}], headers: { "x-total-count": "1" } },
    ]);
    renderWithRefine(<OverviewDashboard />);
    expect(await screen.findByText("₹1,25,000.00")).toBeInTheDocument();
    const attention = screen.getByRole("region", { name: "Needs attention" });
    await waitFor(() =>
      expect(within(attention).getByRole("link", { name: /Withdrawals to approve/ })).toHaveTextContent("2"),
    );
    expect(within(attention).getByRole("link", { name: /Open support tickets/ })).toHaveTextContent("4");
    expect(within(attention).getByRole("link", { name: /Returns to review/ })).toHaveTextContent("0");
    expect(screen.getByRole("link", { name: /Ask the AI copilot/ })).toHaveAttribute(
      "href",
      "/admin/copilot",
    );
  });
});
