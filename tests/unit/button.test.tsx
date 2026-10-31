import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonClass } from "@/components/ui/button";

describe("Button (F/G/H)", () => {
  it("has the storefront pill CTA size", () => {
    const c = buttonClass("primary", undefined, "pill");
    expect(c).toContain("rounded-full");
    expect(c).toContain("min-h-12");
    expect(c).toContain("shadow-sm");
    expect(buttonClass("secondary", undefined, "pill")).not.toContain("shadow-sm");
  });

  it("every variant has a disabled look and no hover while disabled", () => {
    for (const v of ["primary", "secondary", "ghost", "danger", "inverse"] as const) {
      const c = buttonClass(v);
      expect(c, v).toMatch(/disabled:text-/);
      expect(c, v).toContain("disabled:pointer-events-none");
    }
  });

  it("has a pressed state that respects reduced motion", () => {
    const c = buttonClass("ghost");
    expect(c).toContain("active:scale-[0.98]");
    expect(c).toContain("motion-reduce:active:scale-100");
    expect(c).toContain("active:bg-");
  });

  it("caller classes win over the size defaults", () => {
    render(
      <Button size="pill" className="w-full px-6 text-base">
        Place order
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Place order" });
    expect(b.className).toContain("px-6");
    expect(b.className).not.toContain("px-7");
    expect(b.className).toContain("text-base");
  });
});
