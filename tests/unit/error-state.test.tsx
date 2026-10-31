import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "@/components/store/error-state";

describe("ErrorState", () => {
  it("announces the error, focuses its heading and retries", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const retry = vi.fn();
    const reset = vi.fn();
    const error = Object.assign(new Error("db password is hunter2"), { digest: "abc123" });
    render(
      <ErrorState
        error={error}
        reset={reset}
        retry={retry}
        title="Checkout hit a problem"
        back={{ href: "/cart", label: "Back to cart" }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Checkout hit a problem" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Back to cart" })).toHaveAttribute("href", "/cart");
    expect(screen.getByText("Reference: abc123")).toBeInTheDocument();
    // The raw message never reaches the page.
    expect(screen.queryByText(/hunter2/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });

  it("falls back to reset when the router gives no retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reset = vi.fn();
    render(<ErrorState error={new Error("x")} reset={reset} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Back to the shop" })).toHaveAttribute("href", "/");
  });
});
