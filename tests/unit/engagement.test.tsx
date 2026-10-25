import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/components/store/cart";
import { EngagementProvider, NotificationBell, WishlistButton } from "@/components/store/engagement";
import { giftStatus } from "@/components/store/gift-cards-view";
import { categoryLabel } from "@/components/store/notifications-view";
import { CONSENTS } from "@/components/store/privacy-view";
import { reasonLabel } from "@/components/store/rewards-view";
import { ticketStatus } from "@/components/store/support-view";
import { nav } from "../setup";

describe("engagement labels", () => {
  it("names points, gift card, ticket and notification states for people", () => {
    expect(reasonLabel("referral")).toBe("Referral reward");
    expect(reasonLabel("birthday_bonus")).toBe("Birthday bonus");
    expect(giftStatus({ status: "active", balance: 10 })).toEqual({ label: "Active", tone: "green" });
    expect(giftStatus({ status: "redeemed", balance: 0 }).label).toBe("Redeemed");
    expect(ticketStatus("pending")).toEqual({ label: "Awaiting you", tone: "gold" });
    expect(categoryLabel("billing")).toBe("Wallet & billing");
    expect(categoryLabel("route_change")).toBe("Route change");
  });

  it("offers every consent purpose the backend records; only data processing is locked", () => {
    expect(CONSENTS.map((c) => c.purpose).sort()).toEqual(
      [
        "data_processing",
        "marketing_email",
        "marketing_push",
        "marketing_sms",
        "marketing_whatsapp",
        "whatsapp_optin",
      ].sort(),
    );
    expect(CONSENTS.filter((c) => "required" in c && c.required).map((c) => c.purpose)).toEqual([
      "data_processing",
    ]);
  });
});

describe("wishlist hearts and the bell", () => {
  function fakeBackend({ customer }: { customer: boolean }) {
    const calls: string[] = [];
    let wishlist = [3];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const req = new Request(input, init);
        const path = new URL(req.url).pathname;
        calls.push(`${req.method} ${path}`);
        const json = (b: unknown, status = 200) =>
          new Response(status === 204 ? null : JSON.stringify(b), {
            status,
            headers: { "content-type": "application/json" },
          });
        if (path === "/api/store-auth/session") return json({ customer });
        if (path.endsWith("/refresh")) return json({}, 401);
        if (path.endsWith("/v1/cart")) return json({ id: 1, status: "open", items: [], subtotal: 0 });
        if (path.endsWith("/notifications/unread-count")) return json({ unread: 4 });
        if (path.endsWith("/v1/wishlist") && req.method === "GET")
          return json(wishlist.map((product_id) => ({ product_id })));
        if (path.endsWith("/v1/wishlist") && req.method === "POST") {
          const { product_id } = (await req.json()) as { product_id: number };
          wishlist = [...wishlist, product_id];
          return json(wishlist.map((id) => ({ product_id: id })));
        }
        if (req.method === "DELETE") {
          wishlist = wishlist.filter((x) => x !== Number(path.split("/").pop()));
          return json(null, 204);
        }
        return json({}, 404);
      }),
    );
    return calls;
  }
  const ui = () =>
    render(
      <CartProvider>
        <EngagementProvider>
          <NotificationBell />
          <WishlistButton productId={1} productName="Full Cream Milk" />
          <WishlistButton productId={3} productName="A2 Desi Ghee" variant="full" />
        </EngagementProvider>
      </CartProvider>,
    );

  it("shows saved state, toggles, and the unread count for a signed-in customer", async () => {
    const calls = fakeBackend({ customer: true });
    const user = userEvent.setup();
    ui();
    expect(await screen.findByRole("link", { name: "Notifications, 4 unread" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Saved to wishlist" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    const milk = screen.getByRole("button", { name: "Save Full Cream Milk to wishlist" });
    expect(milk).toHaveAttribute("aria-pressed", "false");
    await user.click(milk);
    expect(milk).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Saved to wishlist" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save to wishlist" })).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
    expect(calls).toContain("POST /api/backend/api/v1/wishlist");
    expect(calls).toContain("DELETE /api/backend/api/v1/wishlist/3");
  });

  it("signed out: no bell, and the heart goes to sign-in without calling the API", async () => {
    const calls = fakeBackend({ customer: false });
    window.history.replaceState({}, "", "/products");
    const user = userEvent.setup();
    ui();
    await waitFor(() => expect(calls).toContain("GET /api/store-auth/session"));
    expect(screen.queryByRole("link", { name: /Notifications/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save Full Cream Milk to wishlist" }));
    expect(nav.push).toHaveBeenCalledWith("/account/login?next=%2Fproducts");
    expect(calls.some((c) => c.includes("/wishlist"))).toBe(false);
    window.history.replaceState({}, "", "/");
  });
});
