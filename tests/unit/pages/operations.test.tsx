import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CutoffPage from "@/app/admin/(dashboard)/cutoff/page";
import ReturnShowPage from "@/app/admin/(dashboard)/returns/[id]/page";
import ShopShowPage from "@/app/admin/(dashboard)/shops/[id]/page";
import SubscriptionShowPage from "@/app/admin/(dashboard)/subscriptions/[id]/page";
import { nav } from "../../setup";
import { mockApi, renderWithRefine, optionLabels, pick } from "../../helpers";

const products = {
  path: "/api/v1/admin/products",
  body: [
    { id: 1, sku: "MILK-500", name: "Full Cream Milk", uom: "ml", category: "milk", status: "active" },
    { id: 2, sku: "GHEE-1L", name: "A2 Ghee", uom: "litre", category: "ghee", status: "active" },
  ],
};
const lookups = [products, { path: "/api/v1/admin/locations", body: [] }];

const rma = {
  id: 5,
  rma_no: "RMA-0005",
  order_id: 12,
  account_id: 3,
  status: "approved",
  reason: "sour",
  resolution: null,
  refund_amount: 0,
  items: [{ product_id: 1, qty: 2, reason: "sour" }],
  created_at: "2026-10-24T05:00:00Z",
  order_no: "ORD-0012",
  order_total: 120,
  order_payment_status: "paid",
  customer_name: "Asha",
  customer_phone: "9876543210",
  returned_value: 66,
  refundable_headroom: 50,
  refund_credits: [],
  credit_notes: [],
};

describe("Return detail", () => {
  it("caps the refund at min(returned value, order headroom) and posts it", async () => {
    nav.params = { id: "5" };
    const api = mockApi([
      ...lookups,
      { path: "/api/v1/admin/returns/5", body: rma },
      { method: "POST", path: "/api/v1/admin/returns/5/refund", body: { ...rma, status: "refunded" } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ReturnShowPage />);
    expect(await screen.findByRole("heading", { name: "RMA-0005" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ORD-0012" })).toHaveAttribute("href", "/admin/orders/12");

    await user.click(screen.getByRole("button", { name: "Refund" }));
    const dialog = screen.getByRole("dialog", { name: /refund rma-0005/i });
    const amount = within(dialog).getByLabelText(/refund amount/i);
    expect(amount).toHaveValue(50); // headroom is the tighter limit
    await user.clear(amount);
    await user.type(amount, "60");
    await user.click(within(dialog).getByRole("button", { name: "Refund" }));
    expect(await within(dialog).findByText(/at most 50/)).toBeInTheDocument();
    await user.clear(amount);
    await user.type(amount, "45");
    await user.click(within(dialog).getByRole("button", { name: "Refund" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/returns/5/refund")?.body).toEqual({ amount: 45 }),
    );
  });

  it("shows store credit and credit notes after a refund", async () => {
    nav.params = { id: "5" };
    mockApi([
      ...lookups,
      {
        path: "/api/v1/admin/returns/5",
        body: {
          ...rma,
          status: "refunded",
          refund_amount: 45,
          refund_credits: [{ id: 1, amount: 45, balance_after: 245, created_at: "2026-10-24T06:00:00Z" }],
          credit_notes: [{ id: 9, invoice_no: "CN/2026-27/0009", invoice_date: "2026-10-24", total: 45 }],
        },
      },
    ]);
    renderWithRefine(<ReturnShowPage />);
    expect(await screen.findByRole("table", { name: "Store credit paid" })).toHaveTextContent("+₹45.00");
    expect(screen.getByRole("table", { name: "GST credit notes on the order" })).toHaveTextContent(
      "CN/2026-27/0009",
    );
    expect(screen.queryByRole("button", { name: "Refund" })).not.toBeInTheDocument();
  });
});

describe("Subscription detail", () => {
  const sub = {
    id: 2,
    shop_id: 3,
    account_id: 4,
    status: "active",
    start_date: "2026-09-01",
    end_date: null,
    shop_name: "Sharma Sweets",
    customer_name: "Mr Sharma",
    customer_phone: "9811111111",
    item_count: 1,
    price_tier_id: null,
    shop_address: "MI Road",
    shop_pincode: "302001",
    shop_status: "active",
    items: [
      {
        id: 1,
        product_id: 1,
        default_qty: 10,
        frequency: "daily",
        interval_days: null,
        days_of_week: null,
        active: true,
      },
    ],
  };

  it("shows the milk line in sky, edits lines and validates weekly days", async () => {
    nav.params = { id: "2" };
    const api = mockApi([
      products,
      { path: "/api/v1/admin/price-tiers", body: [] },
      { path: "/api/v1/admin/subscriptions/2", body: sub },
      { method: "PUT", path: "/api/v1/subscriptions/2/items", body: sub },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<SubscriptionShowPage />);
    const table = await screen.findByRole("table", { name: "Standing order" });
    expect(await within(table).findByText("Full Cream Milk")).toBeInTheDocument();
    expect(within(table).getByText("milk").className).toMatch(/sky/);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit lines" }));
    await user.click(screen.getByRole("button", { name: /add product/i }));
    await pick(user, screen.getByLabelText("Product (line 2)"), "2");
    await pick(user, screen.getByLabelText("Frequency (line 2)"), "weekly");
    await user.click(screen.getByRole("button", { name: "Save standing order" }));
    expect(await screen.findByText("Weekdays 1–7, comma separated")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Days (Mon=1) (line 2)"), "6, 7");
    await user.click(screen.getByRole("button", { name: "Save standing order" }));
    await waitFor(() =>
      expect(api.last("PUT", "/api/v1/subscriptions/2/items")?.body).toEqual([
        { product_id: 1, default_qty: 10, frequency: "daily", interval_days: null, days_of_week: null },
        { product_id: 2, default_qty: 1, frequency: "weekly", interval_days: null, days_of_week: "6,7" },
      ]),
    );
  });

  it("rejects the same product twice", async () => {
    nav.params = { id: "2" };
    const api = mockApi([
      products,
      { path: "/api/v1/admin/price-tiers", body: [] },
      { path: "/api/v1/admin/subscriptions/2", body: sub },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<SubscriptionShowPage />);
    await user.click(await screen.findByRole("button", { name: "Edit lines" }));
    await user.click(screen.getByRole("button", { name: /add product/i }));
    await pick(user, screen.getByLabelText("Product (line 2)"), "1");
    await user.click(screen.getByRole("button", { name: "Save standing order" }));
    expect(await screen.findByText("Each product may appear only once.")).toBeInTheDocument();
    expect(api.last("PUT", "/api/v1/subscriptions/2/items")).toBeUndefined();
  });
});

describe("Shop detail", () => {
  it("assigns a driver who isn't already on the shop", async () => {
    nav.params = { id: "3" };
    const api = mockApi([
      {
        path: "/api/v1/admin/price-tiers",
        body: [{ id: 2, code: "HORECA", name: "Hotels", tier_type: "b2b" }],
      },
      {
        path: "/api/v1/admin/users",
        body: [
          { id: 8, phone: "9999900003", full_name: "Ramesh", role: "delivery", status: "active" },
          { id: 9, phone: "9999900004", full_name: "Suresh", role: "delivery", status: "active" },
        ],
      },
      {
        path: "/api/v1/admin/shops/3",
        body: {
          id: 3,
          account_id: 4,
          name: "Sharma Sweets",
          status: "active",
          price_tier_id: 2,
          is_home: false,
          drivers: [
            { assignment_id: 1, delivery_id: 8, full_name: "Ramesh", phone: "9999900003", active: true },
          ],
        },
      },
      { method: "POST", path: "/api/v1/admin/delivery-assignments", body: {} },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ShopShowPage />);
    expect(await screen.findByRole("heading", { name: "Sharma Sweets" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Delivery drivers" })).toHaveTextContent("Ramesh");
    expect(await screen.findByText("Hotels")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Assign driver" }));
    const dialog = screen.getByRole("dialog", { name: "Assign driver" });
    const select = within(dialog).getByLabelText(/driver/i);
    expect((await optionLabels(user, select)).join()).not.toMatch(/Ramesh/); // already assigned
    await pick(user, select, "9");
    await user.click(within(dialog).getByRole("button", { name: "Assign driver" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/delivery-assignments")?.body).toEqual({
        shop_id: 3,
        delivery_id: 9,
      }),
    );
    expect(api.calls.find((c) => c.path === "/api/v1/admin/users")!.query.get("role")).toBe("delivery");
  });
});

describe("Cutoff page", () => {
  it("shows status and history", async () => {
    mockApi([
      {
        path: "/api/v1/admin/cutoff/status",
        body: {
          timezone: "Asia/Kolkata",
          cutoff_hour: 23,
          now: "2026-10-25T10:00:00+05:30",
          next_cutoff_at: "2026-10-25T23:00:00+05:30",
          next_delivery_date: "2026-10-26",
          tomorrow_run: null,
          last_run: {
            id: 4,
            for_delivery_date: "2026-10-25",
            status: "frozen",
            orders_generated: 312,
            started_at: "2026-10-24T17:30:00Z",
            finished_at: "2026-10-24T17:30:04Z",
            duration_seconds: 4.2,
          },
          standing_changes_frozen: false,
        },
      },
      {
        path: "/api/v1/admin/cutoff/runs",
        body: [
          {
            id: 4,
            for_delivery_date: "2026-10-25",
            status: "frozen",
            orders_generated: 312,
            started_at: "2026-10-24T17:30:00Z",
            finished_at: "2026-10-24T17:30:04Z",
            duration_seconds: 4.2,
          },
        ],
      },
    ]);
    renderWithRefine(<CutoffPage />);
    expect(await screen.findByText("Not run yet")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Cutoff run history" });
    expect(await within(table).findByText("312")).toBeInTheDocument();
    expect(within(table).getByText("4.2 s")).toBeInTheDocument();
  });
});
