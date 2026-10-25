import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_STORAGE_KEY, SidebarNav, activeGroupOf } from "@/components/layout/sidebar-nav";
import { FieldGrid, type FieldDef } from "@/components/resource/fields";
import { CheckboxField } from "@/components/ui/field";
import { nav } from "../../setup";

describe("Checkbox (Radix)", () => {
  it("is a labelled role=checkbox toggled by click, label click and Space", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <CheckboxField label="Perishable" checked={false} onCheckedChange={onChange} />,
    );
    const box = screen.getByRole("checkbox", { name: "Perishable" });
    expect(box).toHaveAttribute("aria-checked", "false");
    await user.click(box);
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByText("Perishable"));
    expect(onChange).toHaveBeenCalledTimes(2);
    rerender(<CheckboxField label="Perishable" checked onCheckedChange={onChange} />);
    expect(box).toHaveAttribute("aria-checked", "true");
    expect(box).toHaveAttribute("data-state", "checked");
    box.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("disabled checkboxes don't toggle", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CheckboxField label="Default" checked={false} disabled onCheckedChange={onChange} />);
    await user.click(screen.getByRole("checkbox", { name: "Default" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("FieldGrid checkbox submits a boolean", async () => {
    const onSubmit = vi.fn();
    const fields: FieldDef[] = [{ name: "active", label: "Active", type: "checkbox" }];
    function Form() {
      const form = useForm<Record<string, unknown>>({ defaultValues: { active: false } });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGrid fields={fields} form={form} />
          <button type="submit">Save</button>
        </form>
      );
    }
    const user = userEvent.setup();
    render(<Form />);
    await user.click(screen.getByRole("checkbox", { name: "Active" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ active: true }, expect.anything()));
  });
});

describe("Sidebar collapsible groups", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    nav.pathname = "/";
    window.localStorage.clear();
  });
  const header = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`, "i") });

  it("opens the group holding the active route; others start collapsed", () => {
    nav.pathname = "/purchase-orders/4";
    expect(activeGroupOf("/purchase-orders/4")).toBe("Inventory");
    render(<SidebarNav />);
    expect(header("Inventory")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Purchase orders" })).toHaveAttribute("aria-current", "page");
    expect(header("Billing")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Withdrawals" })).not.toBeInTheDocument();
    // Overview is not in a section and is always visible.
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
  });

  it("toggles by click and keyboard, and remembers the choice", async () => {
    nav.pathname = "/";
    const user = userEvent.setup();
    const { unmount } = render(<SidebarNav />);
    const billing = header("Billing");
    await user.click(billing);
    expect(billing).toHaveAttribute("aria-expanded", "true");
    expect(within(screen.getByRole("navigation")).getByRole("link", { name: "Withdrawals" })).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem(NAV_STORAGE_KEY)!)).toMatchObject({ Billing: true });

    const content = header("Content");
    content.focus();
    await user.keyboard("{Enter}");
    expect(content).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(content).toHaveAttribute("aria-expanded", "false");

    unmount();
    render(<SidebarNav />); // e.g. after navigating: Billing is still open
    expect(header("Billing")).toHaveAttribute("aria-expanded", "true");
    expect(header("Content")).toHaveAttribute("aria-expanded", "false");
  });

  it("survives unavailable or corrupt storage", () => {
    window.localStorage.setItem(NAV_STORAGE_KEY, "{not json");
    nav.pathname = "/stock";
    render(<SidebarNav />);
    expect(header("Inventory")).toHaveAttribute("aria-expanded", "true");
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => header("Billing").click()).not.toThrow();
    spy.mockRestore();
  });
});
