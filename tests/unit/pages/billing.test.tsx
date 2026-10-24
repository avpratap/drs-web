import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AccountShowPage from "@/app/(admin)/accounts/[id]/page";
import PaymentShowPage from "@/app/(admin)/payments/[id]/page";
import { nav } from "../../setup";
import { mockApi, renderWithRefine } from "../../helpers";

const account = {
  id: 3,
  owner_user_id: 11,
  account_type: "b2b",
  billing_mode: "postpaid_credit",
  price_tier_id: null,
  phone: "9876543210",
  full_name: "Hotel Shree",
  wallet_balance: 120,
  credit_outstanding: 450,
  order_count: 12,
  subscription_count: 2,
};

describe("Account page", () => {
  it("shows balances and the credit ledger, and settles credit with an idempotency key", async () => {
    nav.params = { id: "3" };
    const api = mockApi([
      { path: "/api/v1/admin/accounts/3", body: account },
      {
        path: "/api/v1/admin/price-tiers",
        body: [{ id: 1, code: "HORECA", name: "Horeca", tier_type: "b2b" }],
      },
      {
        path: "/api/v1/admin/accounts/3/credit/ledger",
        body: [
          {
            id: 1,
            entry_type: "charge",
            amount: 450,
            balance_after: 450,
            created_at: "2026-10-23T05:00:00Z",
          },
        ],
        headers: { "x-total-count": "1" },
      },
      { path: "/api/v1/admin/accounts/3/wallet/transactions", body: [] },
      {
        method: "POST",
        path: "/api/v1/admin/accounts/3/credit/settle",
        body: { account_id: 3, credit_outstanding: 0 },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<AccountShowPage />);

    expect(await screen.findByRole("heading", { name: "Hotel Shree" })).toBeInTheDocument();
    expect(screen.getByText("₹450.00", { selector: "p" })).toBeInTheDocument();
    // Postpaid accounts open on the credit ledger.
    expect(screen.getByRole("tab", { name: "Credit ledger" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("table", { name: "Credit ledger" })).toHaveTextContent("Charge");

    await user.click(screen.getByRole("button", { name: "Settle credit" }));
    const dialog = screen.getByRole("dialog", { name: "Settle credit" });
    await user.type(within(dialog).getByLabelText(/amount received/i), "500");
    await user.click(within(dialog).getByRole("button", { name: "Settle credit" }));
    expect(await within(dialog).findByText("More than the outstanding balance")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText(/amount received/i));
    await user.type(within(dialog).getByLabelText(/amount received/i), "450");
    await user.click(within(dialog).getByRole("button", { name: "Settle credit" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/accounts/3/credit/settle")).toBeTruthy());
    const call = api.last("POST", "/api/v1/admin/accounts/3/credit/settle")!;
    expect(call.body).toEqual({ amount: 450 });
    expect(call.headers.get("idempotency-key")).toBeTruthy();
  });
});

describe("Payment page", () => {
  it("only allows refunding successful payments", async () => {
    nav.params = { id: "8" };
    mockApi([
      {
        path: "/api/v1/admin/payments/8",
        body: {
          id: 8,
          account_id: 3,
          payment_type: "order",
          gateway: "razorpay",
          amount: 300,
          status: "failed",
          created_at: "2026-10-24T05:00:00Z",
        },
      },
    ]);
    renderWithRefine(<PaymentShowPage />);
    expect(await screen.findByRole("heading", { name: "Payment #8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refund" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Refunds" })).toHaveAttribute(
      "href",
      "/refunds?filters[0][field]=payment_id&filters[0][operator]=eq&filters[0][value]=8",
    );
  });
});
