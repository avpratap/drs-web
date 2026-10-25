import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { pick } from "../../helpers";
import { PodViewer } from "@/components/delivery/pod-viewer";
import { Stars } from "@/components/customers/badges";
import { FilterBar } from "@/components/resource/filter-bar";
import { Tabs } from "@/components/ui/tabs";
import { NAV, NAV_GROUPS, isActive } from "@/components/layout/nav";

describe("PodViewer", () => {
  it("shows photo and signature with descriptive alt text and a map link", () => {
    render(
      <PodViewer
        pods={[
          {
            id: 1,
            recipient_name: "Ravi",
            photo_url: "https://cdn.example/p.jpg",
            signature_url: null,
            lat: 26.9124,
            lng: 75.7873,
            captured_at: "2026-10-24T02:30:00Z",
            note: "Left with guard",
          },
        ]}
      />,
    );
    expect(screen.getByAltText("Delivery photo — received by Ravi")).toHaveAttribute(
      "src",
      "https://cdn.example/p.jpg",
    );
    expect(screen.getByText("Not captured")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /26.91240, 75.78730/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=26.9124,75.7873",
    );
    expect(screen.getByText("Left with guard")).toBeInTheDocument();
  });

  it("says so when nothing was captured", () => {
    render(<PodViewer pods={[]} />);
    expect(screen.getByText(/No proof of delivery/)).toBeInTheDocument();
  });
});

describe("Tabs", () => {
  it("follows the ARIA tabs pattern with arrow keys", () => {
    render(
      <Tabs
        tabs={[
          { id: "a", label: "Wallet", content: <p>wallet panel</p> },
          { id: "b", label: "Credit", content: <p>credit panel</p> },
        ]}
      />,
    );
    const [a, b] = screen.getAllByRole("tab");
    expect(a).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("wallet panel");
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(b).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("credit panel");
    expect(b).toHaveFocus();
  });
});

describe("FilterBar", () => {
  it("selects apply immediately; search applies on submit", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterBar
        defs={[
          { field: "q", label: "Search", type: "search" },
          { field: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }] },
        ]}
        filters={[]}
        onChange={onChange}
      />,
    );
    await pick(user, screen.getByLabelText("Status"), "open");
    expect(onChange).toHaveBeenLastCalledWith("status", "open");
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "  ghee ");
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onChange).toHaveBeenLastCalledWith("q", "ghee");
  });
});

describe("misc", () => {
  it("stars carry a text alternative", () => {
    render(<Stars value={4} />);
    expect(screen.getByText("4 out of 5 stars")).toBeInTheDocument();
  });

  it("navigation covers every phase and highlights nested routes", () => {
    expect(NAV_GROUPS.map((g) => g.label).filter(Boolean)).toEqual([
      "Catalog",
      "Billing",
      "Loyalty",
      "Inventory",
      "Delivery",
      "Insights",
      "Content",
      "Customers",
      "System",
    ]);
    expect(NAV.length).toBeGreaterThanOrEqual(40);
    expect(isActive("/admin/purchase-orders/4", "/admin/purchase-orders")).toBe(true);
    expect(isActive("/admin/products", "/admin")).toBe(false);
  });
});
