import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PurchaseOrderShowPage from "@/app/(admin)/purchase-orders/[id]/page";
import StockPage from "@/app/(admin)/stock/page";
import TransferCreatePage from "@/app/(admin)/transfers/create/page";
import { nav } from "../../setup";
import { mockApi, renderWithRefine, pick } from "../../helpers";

const lookups = [
  {
    path: "/api/v1/admin/products",
    body: [
      { id: 1, sku: "MILK", name: "Full Cream Milk", uom: "litre", status: "active" },
      { id: 2, sku: "CUP", name: "Cups", uom: "piece", status: "active" },
    ],
  },
  {
    path: "/api/v1/admin/locations",
    body: [
      { id: 1, name: "Jaipur plant", kind: "plant", is_default: true, status: "active" },
      { id: 2, name: "Hub A", kind: "hub", is_default: false, status: "active" },
    ],
  },
  { path: "/api/v1/admin/suppliers", body: [{ id: 5, name: "Gwala Dairy", status: "active" }] },
];

describe("Stock page", () => {
  it("flags low stock and switches to reorder suggestions", async () => {
    mockApi([
      ...lookups,
      {
        path: "/api/v1/admin/stock",
        body: [{ product_id: 1, location_id: 1, qty_on_hand: 4, reorder_point: 10 }],
      },
      {
        path: "/api/v1/admin/stock/reorder-suggestions",
        body: [{ product_id: 1, location_id: 1, qty_on_hand: 4, reorder_point: 10, suggested_qty: 16 }],
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<StockPage />);
    const table = await screen.findByRole("table", { name: "Stock levels" });
    expect(await within(table).findByText("Full Cream Milk")).toBeInTheDocument();
    expect(within(table).getByText("Low")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Reorder suggestions" }));
    expect(await screen.findByRole("table", { name: "Reorder suggestions" })).toHaveTextContent("16");
  });
});

describe("Purchase order page", () => {
  it("receives goods (GRN) for the open lines only", async () => {
    nav.params = { id: "4" };
    const api = mockApi([
      ...lookups,
      {
        path: "/api/v1/admin/purchase-orders/4",
        body: {
          id: 4,
          po_no: "PO-0004",
          supplier_id: 5,
          location_id: 1,
          status: "placed",
          subtotal: 500,
          total: 500,
          items: [
            { product_id: 1, qty_ordered: 100, qty_received: 40, unit_cost: 5, line_total: 500 },
            { product_id: 2, qty_ordered: 10, qty_received: 10, unit_cost: 0, line_total: 0 },
          ],
        },
      },
      { method: "POST", path: "/api/v1/admin/purchase-orders/4/receive", body: {} },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<PurchaseOrderShowPage />);
    expect(await screen.findByRole("heading", { name: "PO-0004" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Place order" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Receive goods" }));
    const dialog = screen.getByRole("dialog", { name: /goods receipt/i });
    // Only the line still open, pre-filled with the remaining qty.
    expect(within(dialog).getByLabelText("Qty received (line 1)")).toHaveValue(60);
    expect(within(dialog).queryByLabelText("Qty received (line 2)")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Receive goods" }));
    expect(await within(dialog).findByText("Batch no. is required")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Batch no. (line 1)"), "b-2410");
    await user.click(within(dialog).getByRole("button", { name: "Receive goods" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/purchase-orders/4/receive")).toBeTruthy());
    expect(api.last("POST", "/api/v1/admin/purchase-orders/4/receive")!.body).toEqual({
      lines: [{ product_id: 1, qty_received: 60, batch_no: "B-2410", mfg_date: null, expiry_date: null }],
    });
  });
});

describe("Transfer create", () => {
  it("requires a different destination and posts the items", async () => {
    const api = mockApi([...lookups, { method: "POST", path: "/api/v1/admin/transfers", body: { id: 9 } }]);
    const user = userEvent.setup();
    renderWithRefine(<TransferCreatePage />);
    const to = await screen.findByLabelText(/^To/);
    await pick(user, screen.getByLabelText(/^From/), "1");
    await pick(user, to, "1");
    await pick(user, screen.getByLabelText("Product (line 1)"), "1");
    await user.type(screen.getByLabelText("Quantity (line 1)"), "25");
    await user.click(screen.getByRole("button", { name: "Create transfer" }));
    expect(await screen.findByText("Pick a different destination")).toBeInTheDocument();
    await pick(user, to, "2");
    await user.click(screen.getByRole("button", { name: "Create transfer" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/transfers")).toBeTruthy());
    expect(api.last("POST", "/api/v1/admin/transfers")!.body).toEqual({
      from_location_id: 1,
      to_location_id: 2,
      items: [{ product_id: 1, qty: 25 }],
    });
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/transfers/9"));
  });
});
