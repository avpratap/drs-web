import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

describe("shadcn/Radix primitives", () => {
  it("Dialog: opens with a labelled dialog, traps focus and closes on Escape back to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive shop</DialogTitle>
            <DialogDescription>It stops receiving deliveries.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Archive shop" });
    expect(dialog).toHaveAccessibleDescription("It stops receiving deliveries.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("DropdownMenu: keyboard opens it, arrows move and Enter runs the item", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onEdit).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("Popover: toggles a dialog-role panel", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent aria-label="Shop details">Sharma Sweets · 302001</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByRole("dialog", { name: "Shop details" })).toHaveTextContent("302001");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Toast: announces title and description in a labelled region", async () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <ToastProvider>
          <Toast open={open} onOpenChange={setOpen} variant="success">
            <ToastTitle>Saved</ToastTitle>
            <ToastDescription>Price tier updated.</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    }
    render(<Demo />);
    expect(screen.getByRole("region", { name: /notifications/i })).toBeInTheDocument();
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Price tier updated.")).toBeInTheDocument();
  });
});
