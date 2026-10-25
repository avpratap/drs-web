import { Refine } from "@refinedev/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DeliveryAssignmentsPage from "@/app/(admin)/delivery-assignments/page";
import { AuthGuard } from "@/components/layout/auth-guard";
import { authProvider } from "@/providers/auth-provider";
import { dataProvider, mockApi, renderWithRefine } from "../../helpers";

const drivers = {
  path: "/api/v1/admin/users",
  body: [
    { id: 8, phone: "9999900003", full_name: "Ramesh", role: "delivery", status: "active" },
    { id: 9, phone: "9999900004", full_name: "Suresh", role: "delivery", status: "suspended" },
  ],
};
const shops = {
  path: "/api/v1/admin/shops",
  body: [
    { id: 3, account_id: 4, name: "Sharma Sweets", pincode: "302001", status: "active" },
    { id: 4, account_id: 5, name: "Hotel Shree", pincode: "302004", status: "active" },
  ],
};
const row = (over: Record<string, unknown>) => ({
  id: 1,
  delivery_id: 8,
  shop_id: 3,
  active: true,
  driver_name: "Ramesh",
  driver_phone: "9999900003",
  driver_status: "active",
  shop_name: "Sharma Sweets",
  shop_pincode: "302001",
  shop_status: "active",
  created_at: "2026-10-20T05:00:00Z",
  ...over,
});

describe("Driver assignments page", () => {
  it("lists active assignments, unassigns and reassigns", async () => {
    const api = mockApi([
      drivers,
      shops,
      {
        path: "/api/v1/admin/delivery-assignments",
        body: [row({}), row({ id: 2, shop_id: 4, shop_name: "Hotel Shree", active: false })],
        headers: { "x-total-count": "2" },
      },
      { method: "DELETE", path: "/api/v1/admin/delivery-assignments/1", status: 204 },
      { method: "POST", path: "/api/v1/admin/delivery-assignments", body: row({ id: 2, shop_id: 4 }) },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<DeliveryAssignmentsPage />);
    expect(await screen.findByRole("heading", { level: 1, name: "Driver assignments" })).toBeInTheDocument();
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Hotel Shree")).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/api/v1/admin/delivery-assignments")!.query.get("active")).toBe(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Unassign Ramesh from Sharma Sweets" }));
    const confirm = screen.getByRole("dialog", { name: /Unassign Ramesh from Sharma Sweets/ });
    await user.click(within(confirm).getByRole("button", { name: "Unassign" }));
    await waitFor(() => expect(api.last("DELETE", "/api/v1/admin/delivery-assignments/1")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: "Reassign Ramesh to Hotel Shree" }));
    const again = screen.getByRole("dialog", { name: /Reassign Ramesh to Hotel Shree/ });
    await user.click(within(again).getByRole("button", { name: "Reassign" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/delivery-assignments")?.body).toEqual({
        shop_id: 4,
        delivery_id: 8,
      }),
    );
  });

  it("assigns an active driver to a shop", async () => {
    const api = mockApi([
      drivers,
      shops,
      { path: "/api/v1/admin/delivery-assignments", body: [], headers: { "x-total-count": "0" } },
      { method: "POST", path: "/api/v1/admin/delivery-assignments", body: row({}) },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<DeliveryAssignmentsPage />);
    expect(await screen.findByText("No assignments match.")).toBeInTheDocument();
    const open = screen.getByRole("button", { name: "Assign driver" });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    const dialog = screen.getByRole("dialog", { name: "Assign driver" });
    const driver = within(dialog).getByLabelText(/driver/i);
    expect(within(driver).queryByText(/Suresh/)).not.toBeInTheDocument(); // suspended
    await user.selectOptions(driver, "8");
    await user.selectOptions(within(dialog).getByLabelText(/shop/i), "4");
    await user.click(within(dialog).getByRole("button", { name: "Assign driver" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/delivery-assignments")?.body).toEqual({
        shop_id: 4,
        delivery_id: 8,
      }),
    );
  });
});

describe("AuthGuard", () => {
  const renderGuard = () =>
    render(
      <Refine dataProvider={dataProvider} authProvider={authProvider} options={{ disableTelemetry: true }}>
        <AuthGuard />
        <p>page content</p>
      </Refine>,
    );

  it("signs out a session the backend rejects", async () => {
    const api = mockApi([
      { path: "/api/v1/auth/me", status: 403, body: { detail: "Admins only" } },
      { method: "POST", path: "/api/auth/logout", body: {} },
    ]);
    renderGuard();
    expect(screen.getByText("page content")).toBeInTheDocument(); // the page renders immediately
    await waitFor(() => expect(api.last("POST", "/api/auth/logout")).toBeTruthy());
  });

  it("leaves an admin session alone", async () => {
    const api = mockApi([{ path: "/api/v1/auth/me", body: { id: 1, role: "admin", phone: "9876500001" } }]);
    renderGuard();
    await waitFor(() => expect(api.calls.some((c) => c.path === "/api/v1/auth/me")).toBe(true));
    await new Promise((r) => setTimeout(r, 50));
    expect(api.last("POST", "/api/auth/logout")).toBeUndefined();
  });
});
