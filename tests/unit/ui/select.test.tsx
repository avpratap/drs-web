import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FieldGrid, type FieldDef } from "@/components/resource/fields";
import { Select, type SelectOption } from "@/components/ui/select";

const fruit: SelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry", disabled: true },
  { value: "date", label: "Date" },
];

function Harness(props: Partial<React.ComponentProps<typeof Select>> & { initial?: string }) {
  const [value, setValue] = useState<string | number>(props.initial ?? "");
  const onChange = vi.fn((v: string | number) => setValue(v));
  return (
    <>
      <label htmlFor="fruit">Fruit</label>
      <Select id="fruit" options={fruit} value={value} onChange={onChange} {...props} />
      <output data-testid="value">{String(value)}</output>
    </>
  );
}

// While open, Radix hides the rest of the page from assistive tech (aria-hidden), so look
// the trigger up once, before opening.
const getTrigger = () => screen.getByRole("combobox", { name: "Fruit" });
const listbox = () => screen.getByRole("listbox");
const active = () => document.activeElement?.textContent ?? null;

describe("Select", () => {
  it("shows a muted placeholder, opens on click and selects with the mouse", async () => {
    const user = userEvent.setup();
    render(<Harness placeholder="Pick a fruit" />);
    const t = getTrigger();
    expect(t).toHaveTextContent("Pick a fruit");
    expect(t).toHaveAttribute("data-placeholder");
    expect(t).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(t);
    expect(t).toHaveAttribute("aria-expanded", "true");
    expect(within(listbox()).getAllByRole("option")).toHaveLength(5);
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(screen.getByTestId("value")).toHaveTextContent("banana");
    expect(t).toHaveTextContent("Banana");
    expect(t).not.toHaveAttribute("data-placeholder");
    expect(t).toHaveAttribute("aria-expanded", "false");
    expect(t).toHaveFocus(); // focus returns to the trigger
  });

  it("is fully keyboard operable: arrows, Home/End, Enter, Space and Escape", async () => {
    const user = userEvent.setup();
    render(<Harness initial="banana" />);
    const t = getTrigger();
    t.focus();
    await user.keyboard("{ArrowDown}");
    expect(t).toHaveAttribute("aria-expanded", "true");
    expect(active()).toBe("Banana"); // opens on the current value
    expect(within(listbox()).getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(active()).toBe("Date"); // skips the disabled Cherry
    await user.keyboard("{Home}");
    expect(active()).toBe("Apple");
    await user.keyboard("{End}");
    expect(active()).toBe("Date");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("date");
    expect(t).toHaveAttribute("aria-expanded", "false");
    expect(t).toHaveFocus();

    await user.keyboard(" ");
    expect(t).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowUp}{ArrowUp} ");
    expect(screen.getByTestId("value")).toHaveTextContent("banana");

    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
    expect(t).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("value")).toHaveTextContent("banana"); // Esc doesn't change it
    expect(t).toHaveFocus();
  });

  it("type-ahead: on the closed trigger it picks the match; when open it moves to it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const t = getTrigger();
    t.focus();
    await user.keyboard("d");
    expect(screen.getByTestId("value")).toHaveTextContent("date");
    expect(t).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    expect(active()).toBe("Date");
    await user.keyboard("b");
    expect(active()).toBe("Banana");
    await user.keyboard("b");
    expect(active()).toBe("Blueberry"); // a repeated letter cycles through matches
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("blueberry");
  });

  it("closes on an outside click without changing the value", async () => {
    const user = userEvent.setup();
    render(<Harness initial="apple" />);
    const t = getTrigger();
    await user.click(t);
    expect(listbox()).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "false"));
    expect(screen.getByTestId("value")).toHaveTextContent("apple");
  });

  it("disabled: can't be opened by mouse or keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness disabled initial="apple" />);
    const t = getTrigger();
    expect(t).toBeDisabled();
    await user.click(t);
    fireEvent.keyDown(t, { key: "ArrowDown" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("disabled options can't be chosen", async () => {
    const user = userEvent.setup();
    render(<Harness initial="apple" />);
    await user.click(getTrigger());
    const cherry = within(listbox()).getByRole("option", { name: "Cherry" });
    expect(cherry).toHaveAttribute("aria-disabled", "true");
    await user.click(cherry);
    expect(screen.getByTestId("value")).toHaveTextContent("apple");
  });

  it("clearable: an empty first option resets to the placeholder", async () => {
    const user = userEvent.setup();
    render(<Harness clearable placeholder="All" initial="date" />);
    const t = getTrigger();
    await user.click(t);
    const opts = within(listbox()).getAllByRole("option");
    expect(opts[0]).toHaveTextContent("All");
    await user.click(opts[0]);
    expect(screen.getByTestId("value")).toHaveTextContent("");
    expect(t).toHaveTextContent("All");
  });

  it("keeps numeric option values numeric", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select
        aria-label="Tier"
        options={[
          { value: 1, label: "Retail" },
          { value: 2, label: "Hotels" },
        ]}
        value={1}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Tier" }));
    await user.click(screen.getByRole("option", { name: "Hotels" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe("Select in FieldGrid (react-hook-form)", () => {
  const fields: FieldDef[] = [
    {
      name: "tier",
      label: "Tier",
      type: "select",
      required: true,
      options: [
        { value: 1, label: "Retail" },
        { value: 2, label: "Hotels" },
      ],
    },
  ];
  function Form({ onSubmit }: { onSubmit: (v: Record<string, unknown>) => void }) {
    const form = useForm<Record<string, unknown>>();
    return (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGrid fields={fields} form={form} />
        <button type="submit">Save</button>
      </form>
    );
  }

  it("validates required and submits the typed value", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Form onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tier is required");
    const t = screen.getByRole("combobox", { name: /Tier/ });
    expect(t).toHaveAttribute("aria-invalid", "true");
    await user.click(t);
    await user.click(screen.getByRole("option", { name: "Hotels" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({ tier: 2 }, expect.anything());
  });
});
