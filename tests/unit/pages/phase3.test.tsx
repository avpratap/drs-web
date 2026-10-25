import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ArticlesPage from "@/app/admin/(dashboard)/articles/page";
import AuditLogPage from "@/app/admin/(dashboard)/audit-log/page";
import CouponCreatePage from "@/app/admin/(dashboard)/coupons/create/page";
import FeatureFlagsPage from "@/app/admin/(dashboard)/feature-flags/page";
import RatingsPage from "@/app/admin/(dashboard)/ratings/page";
import TicketShowPage from "@/app/admin/(dashboard)/tickets/[id]/page";
import { nav } from "../../setup";
import { mockApi, renderWithRefine, pick } from "../../helpers";

describe("Articles", () => {
  it("publishes a draft", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/content/articles",
        body: [{ id: 3, slug: "a2-milk", title: "Why A2 milk", body_html: "<p/>", status: "draft" }],
      },
      { method: "POST", path: "/api/v1/admin/content/articles/3/publish", body: {} },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<ArticlesPage />);
    const table = await screen.findByRole("table", { name: "Articles" });
    await within(table).findByRole("link", { name: /^Why A2 milk/ });
    await user.click(within(table).getByRole("button", { name: "Publish" }));
    await user.click(
      within(screen.getByRole("dialog", { name: /publish “why a2 milk”/i })).getByRole("button", {
        name: "Publish",
      }),
    );
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/content/articles/3/publish")).toBeTruthy());
  });
});

describe("Support ticket", () => {
  it("shows the thread, replies and changes status", async () => {
    nav.params = { id: "2" };
    const ticket = {
      id: 2,
      ticket_no: "T-0002",
      subject: "Sour milk",
      category: "product",
      status: "open",
      priority: "high",
      messages: [{ id: 1, sender_role: "customer", body: "The pouch was sour." }],
    };
    const api = mockApi([
      { path: "/api/v1/admin/support/tickets/2", body: ticket },
      { method: "POST", path: "/api/v1/admin/support/tickets/2/messages", body: ticket },
      {
        method: "POST",
        path: "/api/v1/admin/support/tickets/2/status",
        body: { ...ticket, status: "resolved" },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<TicketShowPage />);
    expect(await screen.findByText("The pouch was sour.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(await screen.findByText("Write a reply first")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/reply to customer/i), "Sorry! Replacement on the way.");
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/support/tickets/2/messages")?.body).toEqual({
        body: "Sorry! Replacement on the way.",
      }),
    );
    await pick(user, screen.getByLabelText("Change status"), "resolved");
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/support/tickets/2/status")?.body).toEqual({
        status: "resolved",
      }),
    );
  });
});

describe("Ratings moderation", () => {
  it("approves a pending review", async () => {
    const api = mockApi([
      { path: "/api/v1/admin/products", body: [{ id: 1, sku: "G", name: "A2 Ghee", status: "active" }] },
      { path: "/api/v1/admin/locations", body: [] },
      {
        path: "/api/v1/admin/ratings",
        body: [
          {
            id: 5,
            product_id: 1,
            user_id: 9,
            stars: 4,
            comment: "Lovely aroma",
            status: "pending",
            verified_purchase: true,
            helpful_count: 2,
          },
        ],
      },
      { method: "POST", path: "/api/v1/admin/ratings/5/moderate", body: {} },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<RatingsPage />);
    const table = await screen.findByRole("table", { name: "Ratings" });
    expect(await within(table).findByText("Lovely aroma")).toBeInTheDocument();
    expect(within(table).getByText("4 out of 5 stars")).toBeInTheDocument();
    await user.click(within(table).getByRole("button", { name: /approve review 5/i }));
    await waitFor(() =>
      expect(api.last("POST", "/api/v1/admin/ratings/5/moderate")?.body).toEqual({ status: "approved" }),
    );
  });
});

describe("Coupon create", () => {
  it("caps percentages at 100 and upper-cases the code", async () => {
    const api = mockApi([{ method: "POST", path: "/api/v1/admin/coupons", body: { id: 1 } }]);
    const user = userEvent.setup();
    renderWithRefine(<CouponCreatePage />);
    await user.type(screen.getByLabelText(/^Code/), "monsoon10");
    await user.type(screen.getByLabelText(/^Value/), "150");
    await user.click(screen.getByRole("button", { name: "Create coupon" }));
    expect(await screen.findByText("A percentage can't exceed 100")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/^Value/));
    await user.type(screen.getByLabelText(/^Value/), "10");
    await user.click(screen.getByRole("button", { name: "Create coupon" }));
    await waitFor(() => expect(api.last("POST", "/api/v1/admin/coupons")).toBeTruthy());
    expect(api.last("POST", "/api/v1/admin/coupons")!.body).toEqual({
      code: "MONSOON10",
      discount_type: "percent",
      value: 10,
      min_order_value: 0,
    });
  });
});

describe("Feature flags", () => {
  it("toggles a flag with an accessible switch", async () => {
    const api = mockApi([
      {
        path: "/api/v1/admin/feature-flags",
        body: [{ key: "checkout.upi_intent", enabled: false, description: "UPI intent flow" }],
      },
      {
        method: "PUT",
        path: "/api/v1/admin/feature-flags",
        body: { key: "checkout.upi_intent", enabled: true },
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<FeatureFlagsPage />);
    const sw = await screen.findByRole("switch", { name: "checkout.upi_intent" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    await waitFor(() =>
      expect(api.last("PUT", "/api/v1/admin/feature-flags")?.body).toEqual({
        key: "checkout.upi_intent",
        enabled: true,
        description: "UPI intent flow",
      }),
    );
  });
});

describe("Audit log", () => {
  it("lists entries with expandable detail", async () => {
    mockApi([
      {
        path: "/api/v1/admin/audit-log",
        body: [
          {
            id: 1,
            admin_user_id: 1,
            action: "POST /api/v1/admin/coupons",
            resource_type: "coupon",
            resource_id: "4",
            ip: "10.0.0.1",
            detail: { code: "X" },
            created_at: "2026-10-24T05:00:00Z",
          },
        ],
      },
    ]);
    const user = userEvent.setup();
    renderWithRefine(<AuditLogPage />);
    const table = await screen.findByRole("table", { name: "Audit log" });
    expect(await within(table).findByText("POST /api/v1/admin/coupons")).toBeInTheDocument();
    await user.click(within(table).getByText("View"));
    expect(within(table).getByLabelText("Detail of audit entry 1")).toHaveTextContent('"code": "X"');
  });
});
