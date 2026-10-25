import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ReportsPage from "@/app/admin/(dashboard)/reports/page";
import { todayIST } from "@/lib/forms";
import { nav } from "../../setup";
import { mockApi, renderWithRefine } from "../../helpers";

describe("Reports", () => {
  it("renders KPIs, charts with data tables, and switches range", async () => {
    nav.search = new URLSearchParams("days=7");
    nav.pathname = "/admin/reports";
    const api = mockApi([
      {
        path: "/api/v1/admin/reports/summary",
        body: {
          paid_order_revenue: 125000,
          wallet_float: 9000,
          credit_outstanding: 4500,
          active_subscriptions: 310,
          shops: 42,
          delivered_orders: 2210,
        },
      },
      {
        path: "/api/v1/admin/analytics/overview",
        body: {
          paid_order_revenue: 125000,
          orders: 2400,
          active_subscriptions: 310,
          delivered_orders: 2210,
          low_stock_items: 3,
          credit_outstanding: 4500,
          wallet_float: 9000,
        },
      },
      { path: "/api/v1/admin/analytics/revenue", body: [{ date: todayIST(), revenue: 5400, orders: 12 }] },
      {
        path: "/api/v1/admin/analytics/top-products",
        body: [{ product_id: 1, name: "A2 Ghee", qty: 30, revenue: 27000 }],
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ReportsPage />);

    expect(await screen.findByText("₹1,25,000.00")).toBeInTheDocument();
    expect(screen.getByText("2,400")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /Revenue: 7 days, latest ₹5,400.00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 7 days" })).toHaveAttribute("aria-pressed", "true");
    expect(api.calls.find((c) => c.path === "/api/v1/admin/analytics/revenue")!.query.get("days")).toBe("7");

    const top = screen.getByRole("list", { name: "Top products by revenue" });
    expect(within(top).getByText("A2 Ghee")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Last 90 days" }));
    expect(nav.replace).toHaveBeenCalledWith("/admin/reports?days=90");
  });
});
