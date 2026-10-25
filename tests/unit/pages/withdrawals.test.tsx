import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import WithdrawalsPage from "@/app/admin/(dashboard)/withdrawals/page";
import { mockApi, renderWithRefine } from "../../helpers";

describe("Withdrawals page", () => {
  it("lists requested withdrawals and approves one", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/withdrawals",
        body: [
          { id: 7, account_id: 3, amount: 250, status: "requested" },
          { id: 6, account_id: 4, amount: 90, status: "paid" },
        ],
        headers: { "x-total-count": "2" },
      },
      { method: "POST", path: "/api/v1/admin/withdrawals/7/approve", body: { id: 7, status: "paid" } },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<WithdrawalsPage />);

    const table = await screen.findByRole("table", { name: "Withdrawals" });
    expect(await within(table).findByText("#7")).toBeInTheDocument();
    expect(api.calls[0].query.get("status_filter")).toBe("requested");

    await user.click(within(table).getByRole("button", { name: "Approve" }));
    const dialog = screen.getByRole("dialog", { name: /approve withdrawal #7/i });
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/withdrawals/7/approve")).toBeTruthy());
    expect(await screen.findByText("Withdrawal approved")).toBeInTheDocument();
  });
});
