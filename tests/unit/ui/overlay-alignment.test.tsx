import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActionDialog } from "@/components/resource/action-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { renderWithRefine } from "../../helpers";

/** Render inside a right-aligned actions cell, like every list page does. */
const inActionsCell = (ui: React.ReactNode) => (
  <table>
    <tbody>
      <tr>
        <td className="text-right" style={{ textAlign: "right" }}>
          {ui}
        </td>
      </tr>
    </tbody>
  </table>
);

describe("overlays opened from a text-right actions cell are left-aligned", () => {
  it("ActionDialog content pins text-left and is portalled out of the cell", async () => {
    const user = userEvent.setup();
    renderWithRefine(
      inActionsCell(
        <ActionDialog
          label="Edit"
          description="Change the role."
          fields={[{ name: "n", label: "Name" }]}
          onConfirm={async () => undefined}
        />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Edit" });
    expect(dialog).toHaveClass("text-left");
    expect(dialog.closest("td")).toBeNull();
  });

  it("ConfirmDialog, Popover, DropdownMenu, Select list and DatePicker calendar pin text-left", async () => {
    const user = userEvent.setup();
    render(
      inActionsCell(
        <>
          <ConfirmDialog
            trigger={<Button>Void</Button>}
            title="Void it?"
            confirmLabel="Void"
            onConfirm={() => undefined}
          />
          <Popover>
            <PopoverTrigger>Info</PopoverTrigger>
            <PopoverContent aria-label="Info panel">Details</PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger>More</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select
            aria-label="Status"
            options={[{ value: "a", label: "Active" }]}
            value="a"
            onChange={() => undefined}
          />
          <DatePicker aria-label="Date" value="2026-10-25" onChange={() => undefined} />
        </>,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Void" }));
    const confirm = screen.getByRole("dialog", { name: "Void it?" });
    expect(confirm).toHaveClass("text-left");
    expect(confirm.closest("td")).toBeNull();
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Info" }));
    expect(screen.getByRole("dialog", { name: "Info panel" })).toHaveClass("text-left");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menu")).toHaveClass("text-left");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    expect(screen.getByRole("listbox")).toHaveClass("text-left");
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Date" }));
    const cal = screen.getByRole("dialog", { name: "Choose date" });
    expect(cal).toHaveClass("text-left");
    expect(cal.closest("td")).toBeNull();
  });
});
