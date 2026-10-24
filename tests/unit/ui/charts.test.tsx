import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BarList } from "@/components/charts/bar-list";
import { ChartFrame } from "@/components/charts/chart-frame";
import { TrendChart } from "@/components/charts/trend-chart";

const data = [
  { x: "2026-10-22", y: 100 },
  { x: "2026-10-23", y: 250 },
  { x: "2026-10-24", y: 75 },
];
const fmt = (n: number) => `₹${n}`;

describe("TrendChart", () => {
  it("is a labelled image with keyboard-driven readout", () => {
    render(<TrendChart data={data} label="Revenue" format={fmt} />);
    const img = screen.getByRole("img", { name: /Revenue: 3 days, latest ₹75/ });
    fireEvent.focus(img);
    expect(screen.getByRole("status")).toHaveTextContent("₹75");
    fireEvent.keyDown(img, { key: "ArrowLeft" });
    expect(screen.getByRole("status")).toHaveTextContent("₹250");
    expect(screen.getByRole("status")).toHaveTextContent("2026-10-23");
    fireEvent.blur(img);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("columns draw one bar per point and handle empty data", () => {
    const { container, rerender } = render(
      <TrendChart kind="column" data={data} label="Orders" format={fmt} />,
    );
    expect(container.querySelectorAll("svg path")).toHaveLength(3);
    rerender(<TrendChart kind="column" data={[]} label="Orders" format={fmt} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });
});

describe("BarList", () => {
  it("ranks with values in ink and reveals detail on focus", async () => {
    const user = userEvent.setup();
    render(
      <BarList
        label="Top products"
        format={fmt}
        data={[
          { label: "Ghee", value: 900, detail: "12 sold" },
          { label: "Milk", value: 300, detail: "80 sold" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Ghee₹900");
    await user.tab();
    expect(screen.getByText("12 sold")).toBeInTheDocument();
  });
});

describe("ChartFrame", () => {
  it("always offers a data table", async () => {
    const user = userEvent.setup();
    render(
      <ChartFrame
        title="Revenue per day"
        table={{ headers: ["Date", "Revenue"], rows: [["2026-10-24", "₹75"]] }}
      >
        <div />
      </ChartFrame>,
    );
    await user.click(screen.getByText("Show data table"));
    expect(screen.getByRole("table", { name: /Revenue per day — data/ })).toHaveTextContent("₹75");
  });
});
