import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/components/store/cart";
import { MyReview } from "@/components/store/my-review";
import {
  MAX_COMMENT,
  myReviewBadge,
  reviewPayload,
  savedMessage,
  starLabel,
  validateReview,
  type Review,
} from "@/modules/store/reviews";

describe("review helpers", () => {
  it("requires 1–5 whole stars and caps the comment", () => {
    expect(validateReview(0, "")).toBe("Choose a star rating.");
    expect(validateReview(6, "")).toBe("Choose a star rating.");
    expect(validateReview(2.5, "")).toBe("Choose a star rating.");
    expect(validateReview(1, "")).toBeNull();
    expect(validateReview(5, "x".repeat(MAX_COMMENT))).toBeNull();
    expect(validateReview(5, "x".repeat(MAX_COMMENT + 1))).toMatch(/under 1000/);
  });

  it("sends a trimmed comment, or null when blank", () => {
    expect(reviewPayload(4, "  Fresh and creamy  ")).toEqual({ stars: 4, comment: "Fresh and creamy" });
    expect(reviewPayload(3, "   ")).toEqual({ stars: 3, comment: null });
  });

  it("says held reviews wait for approval, and badges the caller's own status", () => {
    expect(savedMessage({ status: "pending" })).toMatch(/once it's approved/);
    expect(savedMessage({ status: "approved" })).toBe("Thanks for your review.");
    expect(myReviewBadge({ status: "approved" })).toBeNull();
    expect(myReviewBadge({ status: "pending" })).toEqual({ label: "Awaiting approval", tone: "gold" });
    expect(myReviewBadge({ status: "rejected" })?.label).toBe("Not published");
    expect(starLabel(1)).toBe("1 star");
    expect(starLabel(4)).toBe("4 stars");
  });
});

const review = (over: Partial<Review> = {}): Review => ({
  id: 77,
  product_id: 1,
  user_id: 50,
  mine: true,
  stars: 4,
  comment: "Lovely",
  status: "approved",
  verified_purchase: true,
  helpful_count: 0,
  admin_reply: null,
  ...over,
});

/** Session + ratings endpoints; `bought` decides whether a new review publishes or waits. */
function fakeBackend({
  customer,
  mine = null,
  bought = true,
  postStatus,
}: {
  customer: boolean;
  mine?: Review | null;
  bought?: boolean;
  postStatus?: number;
}) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  let current = mine;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init);
      const path = new URL(req.url).pathname;
      const body = req.method === "POST" && path.includes("/ratings") ? await req.json() : undefined;
      calls.push({ method: req.method, path, body });
      const json = (b: unknown, status = 200) =>
        new Response(status === 204 ? null : JSON.stringify(b), {
          status,
          headers: { "content-type": "application/json" },
        });
      if (path === "/api/store-auth/session") return json({ customer });
      if (path.endsWith("/refresh")) return json({}, 401);
      if (path.endsWith("/v1/cart")) return json({ id: 1, status: "open", items: [], subtotal: 0 });
      if (path.endsWith("/products/1/ratings")) {
        if (req.method === "GET")
          return json({
            product_id: 1,
            count: 1,
            average: 5,
            distribution: {},
            ratings: [review({ id: 5, mine: false, user_id: null }), ...(current ? [current] : [])],
          });
        if (req.method === "POST") {
          if (postStatus) return json({ detail: "Product not found" }, postStatus);
          const { stars, comment } = body as { stars: number; comment: string | null };
          current = review({
            ...(current ?? {}),
            stars,
            comment,
            verified_purchase: bought,
            status: bought ? "approved" : "pending",
          });
          return json(current);
        }
        if (req.method === "DELETE") {
          current = null;
          return json(null, 204);
        }
      }
      return json({}, 404);
    }),
  );
  return calls;
}

const ui = () =>
  render(
    <CartProvider>
      <MyReview productId={1} productName="Full Cream Milk" />
    </CartProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe("rate & review on the product page", () => {
  it("signed out: a sign-in prompt that returns to this product, no ratings call", async () => {
    window.history.replaceState({}, "", "/products/1-full-cream-milk");
    const calls = fakeBackend({ customer: false });
    ui();
    const link = await screen.findByRole("link", { name: "Sign in to review" });
    expect(link).toHaveAttribute("href", "/account/login?next=%2Fproducts%2F1-full-cream-milk");
    expect(calls.some((c) => c.path.includes("/ratings"))).toBe(false);
    window.history.replaceState({}, "", "/");
  });

  it("submit: needs a star, then posts stars + trimmed comment and shows it as theirs", async () => {
    const calls = fakeBackend({ customer: true });
    const user = userEvent.setup();
    ui();
    await user.click(await screen.findByRole("button", { name: /Rate & review/ }));
    const form = screen.getByRole("form", { name: "Review Full Cream Milk" });
    await user.click(within(form).getByRole("button", { name: "Post review" }));
    expect(within(form).getByRole("alert")).toHaveTextContent("Choose a star rating.");
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    await user.click(within(form).getByRole("radio", { name: "4 stars" }));
    expect(within(form).queryByRole("alert")).not.toBeInTheDocument();
    await user.type(within(form).getByLabelText(/Your review/), "  Fresh every morning  ");
    await user.click(within(form).getByRole("button", { name: "Post review" }));

    const mine = await screen.findByRole("region", { name: "Your review" });
    expect(mine).toHaveTextContent("Fresh every morning");
    expect(mine).toHaveTextContent("Verified purchase");
    expect(screen.getByRole("status")).toHaveTextContent("Thanks for your review.");
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      stars: 4,
      comment: "Fresh every morning",
    });
  });

  it("not a verified purchase: the review is held, and says so", async () => {
    fakeBackend({ customer: true, bought: false });
    const user = userEvent.setup();
    ui();
    await user.click(await screen.findByRole("button", { name: /Rate & review/ }));
    expect(
      screen.getByText(/haven't bought this product are checked before they appear/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "2 stars" }));
    await user.click(screen.getByRole("button", { name: "Post review" }));
    const mine = await screen.findByRole("region", { name: "Your review" });
    expect(mine).toHaveTextContent("Awaiting approval");
    expect(mine).not.toHaveTextContent("Verified purchase");
    expect(screen.getByRole("status")).toHaveTextContent("Your review will appear once it's approved.");
  });

  it("edit: the form starts from their review; cancel keeps it", async () => {
    const calls = fakeBackend({ customer: true, mine: review({ stars: 3, comment: "Good" }) });
    const user = userEvent.setup();
    ui();
    const mine = await screen.findByRole("region", { name: "Your review" });
    expect(mine).toHaveTextContent("Good");
    await user.click(within(mine).getByRole("button", { name: /Edit review/ }));
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
    expect(screen.getByLabelText(/Your review/)).toHaveValue("Good");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("region", { name: "Your review" })).toHaveTextContent("Good");

    await user.click(screen.getByRole("button", { name: /Edit review/ }));
    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    await user.clear(screen.getByLabelText(/Your review/));
    await user.click(screen.getByRole("button", { name: "Update review" }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Your review" })).toHaveTextContent("5 out of 5 stars"),
    );
    expect(calls.filter((c) => c.method === "POST").at(-1)?.body).toEqual({ stars: 5, comment: null });
  });

  it("delete: confirms, removes, and offers to review again", async () => {
    const calls = fakeBackend({ customer: true, mine: review() });
    const user = userEvent.setup();
    ui();
    await user.click(await screen.findByRole("button", { name: /^Delete$/ }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete review" }));
    expect(await screen.findByRole("button", { name: /Rate & review/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Review deleted.");
    expect(calls.some((c) => c.method === "DELETE" && c.path.endsWith("/products/1/ratings"))).toBe(true);
  });

  it("shows the API's reason when a save is refused (e.g. a retired product)", async () => {
    fakeBackend({ customer: true, postStatus: 404 });
    const user = userEvent.setup();
    ui();
    await user.click(await screen.findByRole("button", { name: /Rate & review/ }));
    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    await user.click(screen.getByRole("button", { name: "Post review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Product not found");
  });
});
