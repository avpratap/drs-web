import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { isAccountActive } from "@/components/store/account-nav";
import { PaymentPanel } from "@/components/store/payment-panel";
import { profilePatch, validateProfile } from "@/components/store/profile-form";
import { txnView } from "@/components/store/wallet-view";

const draft = {
  full_name: "Asha Verma",
  display_name: "",
  email: "",
  alternate_phone: "",
  date_of_birth: "",
  gender: "",
  gstin: "",
  legal_name: "",
  notify_whatsapp: true,
  notify_sms: true,
  notify_email: false,
  notify_push: true,
};

describe("account helpers", () => {
  it("marks the current account section (overview only on its own page)", () => {
    expect(isAccountActive("/account", "/account")).toBe(true);
    expect(isAccountActive("/account/orders/880", "/account")).toBe(false);
    expect(isAccountActive("/account/orders/880", "/account/orders")).toBe(true);
    expect(isAccountActive("/account/ordersx", "/account/orders")).toBe(false);
  });

  it("validates the profile like the backend", () => {
    expect(validateProfile(draft)).toEqual({});
    expect(
      validateProfile({ ...draft, full_name: " ", email: "a@b", alternate_phone: "123", gstin: "08ABC" }),
    ).toEqual({
      full_name: "Enter your name",
      email: "Enter a valid email address",
      alternate_phone: "Enter a 10-digit mobile number",
      gstin: "Enter a valid 15-character GSTIN",
    });
    expect(validateProfile({ ...draft, gstin: "08aaacd1234f1z5" })).toEqual({});
  });

  it("sends only what changed, normalised; blanks clear optional fields", () => {
    expect(profilePatch(draft, draft)).toEqual({});
    expect(
      profilePatch(
        { ...draft, legal_name: "Verma Foods" },
        {
          ...draft,
          email: " asha@example.com ",
          alternate_phone: "+91 98765 43210",
          gstin: "08aaacd1234f1z5",
          legal_name: "",
          notify_email: true,
        },
      ),
    ).toEqual({
      email: "asha@example.com",
      alternate_phone: "9876543210",
      gstin: "08AAACD1234F1Z5",
      legal_name: null,
      notify_email: true,
    });
  });

  it("describes wallet transactions for people", () => {
    expect(txnView({ txn_type: "topup", ref_type: "payment", ref_id: 9 })).toEqual({
      label: "Money added",
      ref: null,
      credit: true,
    });
    expect(txnView({ txn_type: "debit", ref_type: "order", ref_id: 880 })).toEqual({
      label: "Order payment",
      ref: "Order #880",
      credit: false,
    });
    expect(txnView({ txn_type: "loyalty_redeem", ref_type: null, ref_id: null }).label).toBe(
      "Loyalty redeem",
    );
  });
});

describe("wallet top-up payment", () => {
  it("off: no gateway calls, 'coming soon'", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<PaymentPanel purpose={{ kind: "topup" }} total={0} enabled={false} onPaid={() => {}} />);
    expect(screen.getByRole("heading", { name: "Online top-up coming soon" })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("on: creates a wallet_topup payment for the chosen amount with an Idempotency-Key", async () => {
    const bodies: { path: string; key: string | null; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const req = new Request(input, init);
        const path = new URL(req.url).pathname;
        bodies.push({
          path,
          key: req.headers.get("idempotency-key"),
          body: await req
            .clone()
            .json()
            .catch(() => null),
        });
        const json = (b: unknown) =>
          new Response(JSON.stringify(b), { headers: { "content-type": "application/json" } });
        return path.endsWith("/create")
          ? json({ payment_id: 1, gateway_order_id: "order_T", amount: 500, key_id: "" })
          : json({ detail: "ok", payment_id: 1, status: "success" });
      }),
    );
    const onPaid = vi.fn();
    const user = userEvent.setup();
    render(<PaymentPanel purpose={{ kind: "topup" }} total={500} enabled onPaid={onPaid} />);
    expect(screen.getByRole("heading", { name: "Add ₹500 to your wallet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add ₹500 securely" }));
    await user.click(await screen.findByRole("button", { name: "Complete test payment · ₹500" }));
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(bodies[0]).toMatchObject({ body: { purpose: "wallet_topup", amount: 500 } });
    expect(bodies[0].key).toMatch(/^[0-9a-f-]{36}$/);
  });
});
