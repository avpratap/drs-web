import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { validateAddress } from "@/components/store/address-form";
import { PaymentPanel } from "@/components/store/payment-panel";
import type { StoreProductFull } from "@/modules/store/catalog";
import { deliveryLabel, formatAddress, keepKeyForRetry } from "@/modules/store/checkout";
import { orderStage, orderStatusLabel, paymentLabel } from "@/modules/store/orders";
import { linePack } from "@/modules/store/packs";

describe("checkout helpers", () => {
  it("formats the order address as one line", () => {
    expect(
      formatAddress({
        contact_name: "Asha Verma",
        contact_phone: "9000000000",
        line1: "12 Civil Lines",
        line2: null,
        landmark: "Statue Circle",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      }),
    ).toBe("Asha Verma, 12 Civil Lines, Near Statue Circle, Jaipur, Rajasthan 302001, Ph 9000000000");
  });

  it("labels the delivery day from the courier ETA", () => {
    const now = new Date("2026-10-25T10:00:00+05:30");
    expect(deliveryLabel(1, now)).toBe("Tomorrow, before 7 am");
    expect(deliveryLabel(null, now)).toBe("Tomorrow, before 7 am");
    expect(deliveryLabel(3, now)).toBe("Wednesday, 28 Oct, before 7 am");
  });

  it("keeps the Idempotency-Key only for retries of an unanswered attempt", () => {
    expect(keepKeyForRetry(null)).toBe(true); // network error
    expect(keepKeyForRetry(503)).toBe(true);
    expect(keepKeyForRetry(409)).toBe(true); // "being opened; retry"
    expect(keepKeyForRetry(200)).toBe(false);
    expect(keepKeyForRetry(422)).toBe(false);
  });

  it("validates a new address like the backend", () => {
    const ok = {
      contact_name: "Asha",
      contact_phone: "+91 90000 00000",
      line1: "12 Civil Lines",
      line2: "",
      landmark: "",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      label: "Home",
      is_default: true,
    };
    expect(validateAddress(ok)).toEqual({});
    expect(validateAddress({ ...ok, pincode: "02001", contact_phone: "12345", state: "" })).toEqual({
      pincode: "Enter a 6-digit pincode",
      contact_phone: "Enter a 10-digit mobile number",
      state: "Choose the state",
    });
  });

  it("reads a cart line as packs of the smallest priced pack", () => {
    const milk = {
      id: 1,
      name: "Milk",
      uom: "ml",
      pack_size: 500,
      from_price: 33,
      variants: [
        { id: 1, label: "1 L", pack_size: 1000, selling_price: 66, mrp: 68, show_mrp_strike: true },
        { id: 2, label: "500 ml", pack_size: 500, selling_price: 33, mrp: 34, show_mrp_strike: true },
        { id: 3, label: "250 ml", pack_size: 250, selling_price: null, mrp: null, show_mrp_strike: false },
      ],
    } as unknown as StoreProductFull;
    expect(linePack(milk, 1500, 0.066)).toEqual({ label: "500 ml", size: 500, packs: 3, packPrice: 33 });
    expect(linePack(milk, 700, 0.066).packs).toBeNull(); // not whole packs: shown as a quantity
    expect(linePack(null, 2, 10)).toMatchObject({ label: "2", packs: 1 });
  });

  it("maps order and payment states for shoppers", () => {
    expect(orderStage("created")).toBe(0);
    expect(orderStage("out_for_delivery")).toBe(2);
    expect(orderStage("cancelled")).toBe("cancelled");
    expect(orderStatusLabel("delivered")).toEqual({ label: "Delivered", tone: "green" });
    expect(paymentLabel("pending")).toEqual({ label: "Payment due", tone: "gold" });
    expect(paymentLabel("paid").label).toBe("Paid");
  });
});

describe("payment panel (gateway handoff is guarded)", () => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  function fakeGateway(keyId: string) {
    const calls: { path: string; key: string | null; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const req = new Request(input, init);
        const path = new URL(req.url).pathname;
        calls.push({
          path,
          key: req.headers.get("idempotency-key"),
          body: await req
            .clone()
            .json()
            .catch(() => null),
        });
        if (path.endsWith("/payments/create"))
          return json(200, { payment_id: 9, gateway_order_id: "order_X", amount: 899, key_id: keyId });
        if (path.endsWith("/payments/verify"))
          return json(200, { detail: "ok", payment_id: 9, status: "success" });
        return json(404, {});
      }),
    );
    return calls;
  }

  it("without payments enabled it never calls the gateway: pay on delivery", () => {
    const calls = fakeGateway("");
    render(
      <PaymentPanel
        purpose={{ kind: "order", orderId: 5, orderNo: "DRS-5" }}
        total={899}
        enabled={false}
        onPaid={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Pay on delivery" })).toBeInTheDocument();
    expect(screen.getByText(/Online payment is coming soon/)).toBeInTheDocument();
    expect(calls).toEqual([]);
  });

  it("backend in dev-stub mode (no key_id): a labelled test payment verifies with signature 'dev'", async () => {
    const calls = fakeGateway("");
    const onPaid = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentPanel
        purpose={{ kind: "order", orderId: 5, orderNo: "DRS-5" }}
        total={899}
        enabled
        onPaid={onPaid}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pay ₹899 securely" }));
    await user.click(await screen.findByRole("button", { name: "Complete test payment · ₹899" }));
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(calls[0]).toMatchObject({
      path: "/api/backend/api/v1/payments/create",
      body: { purpose: "order_payment", order_id: 5 },
    });
    expect(calls[0].key).toMatch(/^[0-9a-f-]{36}$/);
    expect(calls[1]).toMatchObject({
      path: "/api/backend/api/v1/payments/verify",
      body: { gateway_order_id: "order_X", signature: "dev" },
    });
  });

  it("with gateway keys it opens Razorpay and verifies the signed result", async () => {
    const calls = fakeGateway("rzp_test_123");
    const opened: unknown[] = [];
    vi.stubGlobal(
      "Razorpay",
      class {
        constructor(
          private o: { key: string; order_id: string; amount: number; handler: (r: unknown) => void },
        ) {
          opened.push(o);
        }
        open() {
          this.o.handler({
            razorpay_payment_id: "pay_1",
            razorpay_order_id: this.o.order_id,
            razorpay_signature: "sig",
          });
        }
        on() {}
      },
    );
    const onPaid = vi.fn();
    const user = userEvent.setup();
    render(
      <PaymentPanel
        purpose={{ kind: "order", orderId: 5, orderNo: "DRS-5" }}
        total={899}
        enabled
        onPaid={onPaid}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pay ₹899 securely" }));
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
    expect(opened[0]).toMatchObject({ key: "rzp_test_123", order_id: "order_X", amount: 89900 });
    expect(calls[1].body).toEqual({
      gateway_order_id: "order_X",
      gateway_payment_id: "pay_1",
      signature: "sig",
    });
  });
});
