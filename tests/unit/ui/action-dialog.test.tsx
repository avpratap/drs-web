import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionDialog } from "@/components/resource/action-dialog";
import { renderWithRefine } from "../../helpers";

const fields = [
  { name: "amount", label: "Amount", type: "money" as const, required: true, gt: 0, max: 1000 },
  { name: "note", label: "Note", type: "textarea" as const },
];

describe("ActionDialog", () => {
  it("validates, submits the built payload, toasts and closes", async () => {
    const onConfirm = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderWithRefine(<ActionDialog label="Top up" fields={fields} onConfirm={onConfirm} success="Done!" />);

    await user.click(screen.getByRole("button", { name: "Top up" }));
    const dialog = screen.getByRole("dialog", { name: "Top up" });
    await user.click(within(dialog).getByRole("button", { name: "Top up" }));
    expect(await within(dialog).findByText("Amount is required")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText(/amount/i), "1500");
    await user.click(within(dialog).getByRole("button", { name: "Top up" }));
    expect(await within(dialog).findByText(/at most 1,000/)).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/amount/i));
    await user.type(within(dialog).getByLabelText(/amount/i), "250");
    await user.click(within(dialog).getByRole("button", { name: "Top up" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ amount: 250 }));
    expect(await screen.findByText("Done!")).toBeInTheDocument();
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
  });

  it("keeps the dialog open and shows the API error on failure", async () => {
    const onConfirm = vi.fn().mockRejectedValue({ message: "Insufficient balance", statusCode: 409 });
    const user = userEvent.setup();
    renderWithRefine(<ActionDialog label="Approve" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = screen.getByRole("dialog", { name: "Approve" });
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Insufficient balance")).toBeInTheDocument();
    expect(dialog).toHaveAttribute("open");
  });

  it("cancel closes without calling the action", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderWithRefine(<ActionDialog label="Reject" onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = screen.getByRole("dialog", { name: "Reject" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
