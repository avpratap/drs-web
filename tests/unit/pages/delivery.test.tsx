import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DeliveryShowPage from "@/app/(admin)/delivery/[id]/page";
import DeliveryPage from "@/app/(admin)/delivery/page";
import { nav } from "../../setup";
import { mockApi, renderWithRefine } from "../../helpers";

const order = {
  id: 5,
  delivery_date: "2026-10-24",
  shop_id: 2,
  origin: "subscription",
  status: "delivered",
  subtotal: 120,
  total: 120,
  amount_due: 0,
  shop_name: "Sharma Sweets",
  address: "MI Road",
  pincode: "302001",
  contact_name: "Mr Sharma",
  contact_phone: "9811111111",
  items: [
    { product_id: 1, qty_planned: 4, qty_delivered: 4, unit_price: 30, line_total: 120, status: "delivered" },
  ],
};

describe("Daily deliveries", () => {
  it("shows the day's summary and stops for the chosen date", async () => {
    nav.search = new URLSearchParams("date=2026-10-24");
    const api = mockApi([
      {
        path: "/api/v1/delivery/summary",
        body: { date: "2026-10-24", delivered: 18, failed: 2, pending: 5, cash_collected: 1250 },
      },
      { path: "/api/v1/delivery/orders", body: [order] },
    ]);
    renderWithRefine(<DeliveryPage />);
    expect(screen.getByLabelText("Delivery date")).toHaveValue("2026-10-24");
    expect(await screen.findByText("₹1,250.00")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: /Delivery stops on/ });
    expect(await within(table).findByText("Sharma Sweets")).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/api/v1/delivery/orders")!.query.get("date")).toBe("2026-10-24");
  });
});

describe("Delivery detail", () => {
  it("shows POD, cash collected and returns", async () => {
    nav.params = { id: "5" };
    mockApi([
      {
        path: "/api/v1/admin/products",
        body: [{ id: 1, sku: "MILK", name: "Full Cream Milk", uom: "litre", status: "active" }],
      },
      { path: "/api/v1/admin/locations", body: [] },
      {
        path: "/api/v1/admin/delivery-orders/5/fulfillment",
        body: {
          order,
          pod: [
            {
              id: 1,
              recipient_name: "Mr Sharma",
              photo_url: "https://cdn.example/p.jpg",
              signature_url: null,
              captured_at: "2026-10-24T02:30:00Z",
            },
          ],
          cash: [
            {
              id: 1,
              amount_collected: 120,
              method: "upi",
              reference: "UPI99",
              collected_at: "2026-10-24T02:31:00Z",
            },
          ],
          returns: [
            { id: 1, product_id: 1, qty_returned: 1, reason: "damaged", created_at: "2026-10-24T02:31:00Z" },
          ],
          cash_total: 120,
        },
      },
    ]);
    renderWithRefine(<DeliveryShowPage />);
    expect(await screen.findByRole("heading", { name: "Sharma Sweets" })).toBeInTheDocument();
    expect(screen.getByAltText("Delivery photo — received by Mr Sharma")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Cash collected" })).toHaveTextContent("UPI99");
    expect(screen.getByRole("table", { name: "Returns" })).toHaveTextContent("Damaged");
    // Delivered stops can be invoiced, not failed.
    expect(screen.getByRole("button", { name: "Generate invoice" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark failed" })).not.toBeInTheDocument();
  });
});
