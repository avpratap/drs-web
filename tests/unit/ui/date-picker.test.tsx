import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FieldGrid, type FieldDef } from "@/components/resource/fields";
import { DatePicker, parseIsoDate, toIsoDate } from "@/components/ui/date-picker";

function Harness(props: Partial<React.ComponentProps<typeof DatePicker>> & { initial?: string }) {
  const [value, setValue] = useState(props.initial ?? "");
  return (
    <>
      <label htmlFor="d">Valid from</label>
      <DatePicker id="d" value={value} onChange={setValue} {...props} />
      <output data-testid="value">{value}</output>
    </>
  );
}
const trigger = () => screen.getByRole("button", { name: /Valid from/ });
const grid = () => screen.getByRole("grid");
const focusedDay = () => (document.activeElement as HTMLElement | null)?.getAttribute("data-day");

describe("DatePicker", () => {
  it("parses and formats ISO calendar dates without timezone drift", () => {
    expect(toIsoDate(parseIsoDate("2026-03-01")!)).toBe("2026-03-01");
    expect(parseIsoDate("2026-13-40")).toBeUndefined();
    expect(parseIsoDate("")).toBeUndefined();
  });

  it("shows a muted placeholder, then the formatted date", async () => {
    const { rerender } = render(<DatePicker aria-label="Date" value="" onChange={() => undefined} />);
    const t = screen.getByRole("button", { name: "Date" });
    expect(t).toHaveTextContent("Pick a date");
    expect(t).toHaveAttribute("data-placeholder");
    rerender(<DatePicker aria-label="Date" value="2026-10-25" onChange={() => undefined} />);
    expect(t).toHaveTextContent("25 Oct 2026");
    expect(t).not.toHaveAttribute("data-placeholder");
  });

  it("opens a calendar dialog on the selected month and picks a day with the mouse", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-10-25" />);
    await user.click(trigger());
    const dialog = screen.getByRole("dialog", { name: "Choose date" });
    expect(within(dialog).getByText("October 2026")).toBeInTheDocument();
    await waitFor(() => expect(focusedDay()).toBe("2026-10-25")); // focus lands on the value
    await user.click(within(dialog).getByRole("button", { name: /^28 October 2026/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("2026-10-28");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
  });

  it("is keyboard operable: arrows, PageDown, Enter, Escape", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-10-25" />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(focusedDay()).toBe("2026-10-25"));
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(focusedDay()).toBe("2026-10-26"));
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(focusedDay()).toBe("2026-11-02"));
    await user.keyboard("{PageDown}");
    await waitFor(() => expect(focusedDay()).toBe("2026-12-02"));
    expect(within(grid()).getAllByRole("gridcell").length).toBeGreaterThan(27);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("2026-12-02");
    await waitFor(() => expect(trigger()).toHaveFocus());

    await user.keyboard("{Enter}");
    await waitFor(() => expect(focusedDay()).toBe("2026-12-02"));
    await user.keyboard("{ArrowLeft}{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByTestId("value")).toHaveTextContent("2026-12-02"); // unchanged
    expect(trigger()).toHaveFocus();
  });

  it("respects min/max and can be cleared when clearable", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-10-25" min="2026-10-10" max="2026-10-27" clearable />);
    await user.click(trigger());
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /^9 October 2026/ })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /^28 October 2026/ })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("value")).toHaveTextContent("");
    expect(trigger()).toHaveTextContent("Pick a date");
  });

  it("disabled: can't be opened", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("DatePicker in FieldGrid (react-hook-form)", () => {
  it("validates required and submits the ISO date", async () => {
    const onSubmit = vi.fn();
    const fields: FieldDef[] = [{ name: "valid_from", label: "Valid from", type: "date", required: true }];
    function Form() {
      const form = useForm<Record<string, unknown>>();
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGrid fields={fields} form={form} />
          <button type="submit">Save</button>
        </form>
      );
    }
    const user = userEvent.setup();
    render(<Form />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Valid from is required");
    await user.click(screen.getByRole("button", { name: /Valid from/ }));
    await user.click(screen.getByRole("button", { name: "Today" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ valid_from: iso }, expect.anything()));
  });
});
