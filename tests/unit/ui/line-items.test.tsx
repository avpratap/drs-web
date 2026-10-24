import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { LineItems } from "@/components/resource/line-items";

function Harness({ onSubmit }: { onSubmit: (v: unknown) => void }) {
  const form = useForm({ defaultValues: { items: [{}] } });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <LineItems
        form={form as never}
        name="items"
        legend="Items"
        columns={[
          {
            name: "product_id",
            label: "Product",
            type: "select",
            options: [
              { value: 1, label: "Milk" },
              { value: 2, label: "Ghee" },
            ],
            required: true,
          },
          { name: "qty", label: "Quantity", type: "number", required: true, gt: 0 },
        ]}
      />
      <button type="submit">Save</button>
    </form>
  );
}

describe("LineItems", () => {
  it("adds, validates and removes rows; selects coerce to numbers", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    expect(screen.getByRole("group", { name: "Items" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove line 1" })).toBeDisabled(); // min 1 row

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Product is required")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Product (line 1)"), "2");
    await user.type(screen.getByLabelText("Quantity (line 1)"), "0");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Must be > 0")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Quantity (line 1)"));
    await user.type(screen.getByLabelText("Quantity (line 1)"), "3");
    await user.click(screen.getByRole("button", { name: /add line/i }));
    expect(screen.getByLabelText("Product (line 2)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove line 2" }));
    expect(screen.queryByLabelText("Product (line 2)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ items: [{ product_id: 2, qty: 3 }] });
  });
});
