import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { CategoryBadge, StatusBadge, isMilkLine } from "@/components/ui/badge";

describe("badges", () => {
  it("renders status labels", () => {
    render(<StatusBadge status="retired" />);
    expect(screen.getByText("Retired")).toHaveClass("text-drs-maroon");
  });

  it("uses sky only for the milk / buttermilk line", () => {
    expect(isMilkLine("Milk")).toBe(true);
    expect(isMilkLine("buttermilk")).toBe(true);
    expect(isMilkLine("paneer")).toBe(false);
    render(<CategoryBadge category="ghee" />);
    expect(screen.getByText("ghee").className).not.toMatch(/sky/);
  });
});

describe("LoginForm", () => {
  it("validates the phone, requests an OTP, then verifies it", async () => {
    const user = userEvent.setup();
    const requestOtp = vi.fn().mockResolvedValue({ ok: true, data: { detail: "sent", dev_otp: "123456" } });
    const verifyOtp = vi.fn().mockResolvedValue({ ok: true });
    render(<LoginForm requestOtp={requestOtp} verifyOtp={verifyOtp} />);

    await user.type(screen.getByLabelText(/mobile number/i), "12345");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid 10-digit/i);
    expect(requestOtp).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/mobile number/i));
    await user.type(screen.getByLabelText(/mobile number/i), "+91 98765 43210");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    expect(requestOtp).toHaveBeenCalledWith("9876543210");

    expect(await screen.findByText(/dev mode code: 123456/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/one-time code/i), "123456");
    await user.click(screen.getByRole("button", { name: /verify/i }));
    expect(verifyOtp).toHaveBeenCalledWith("9876543210", "123456");
  });

  it("shows the backend error when verification fails", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        requestOtp={vi.fn().mockResolvedValue({ ok: true, data: { detail: "sent" } })}
        verifyOtp={vi.fn().mockResolvedValue({ ok: false, message: "Invalid or expired OTP" })}
      />,
    );
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    await user.type(await screen.findByLabelText(/one-time code/i), "000000");
    await user.click(screen.getByRole("button", { name: /verify/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired OTP");
  });
});
