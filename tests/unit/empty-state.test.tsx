import { render, screen } from "@testing-library/react";
import { PackageIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/store/empty-state";

describe("EmptyState (L)", () => {
  it("shows an icon, a title, a line of help and the next step", () => {
    render(
      <EmptyState
        as="h2"
        icon={PackageIcon}
        title="No orders yet"
        body="Your first fresh delivery is a few taps away."
        action={{ href: "/products", label: "Shop fresh dairy" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "No orders yet" })).toBeInTheDocument();
    expect(screen.getByText("Your first fresh delivery is a few taps away.")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Shop fresh dairy" });
    expect(cta).toHaveAttribute("href", "/products");
    expect(cta.className).toContain("rounded-full");
  });

  it("is a plain line when it isn't a section's content, with no CTA by default", () => {
    render(<EmptyState icon={PackageIcon} title="No invoices yet" />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByText("No invoices yet").tagName).toBe("P");
    expect(screen.queryByRole("link")).toBeNull();
  });
});
