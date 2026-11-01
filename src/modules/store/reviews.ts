import type { components } from "@/lib/api/client";

/** A product review as the ratings API returns it (`mine` marks the caller's own). */
export type Review = components["schemas"]["RatingOut"];

export const MAX_COMMENT = 1000;

/** The rate_product body: blank comments are sent as null (the API stores no empty text). */
export function reviewPayload(stars: number, comment: string): components["schemas"]["RatingIn"] {
  const text = comment.trim();
  return { stars, comment: text ? text : null };
}

/** Client-side checks mirroring RatingIn, so a save only fails for server-side reasons. */
export function validateReview(stars: number, comment: string): string | null {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return "Choose a star rating.";
  if (comment.trim().length > MAX_COMMENT) return `Keep your review under ${MAX_COMMENT} characters.`;
  return null;
}

/**
 * Only a verified purchase publishes at once; anyone else's review (and an edit of a
 * rejected one) is held for moderation — the backend returns it as "pending".
 */
export const savedMessage = (r: Pick<Review, "status">) =>
  r.status === "pending" ? "Thanks! Your review will appear once it's approved." : "Thanks for your review.";

/** Status chip for the caller's own review (public reviews are always approved). */
export function myReviewBadge(r: Pick<Review, "status">): { label: string; tone: "gold" | "maroon" } | null {
  if (r.status === "pending") return { label: "Awaiting approval", tone: "gold" };
  if (r.status === "rejected" || r.status === "hidden") return { label: "Not published", tone: "maroon" };
  return null;
}

export const starLabel = (n: number) => `${n} star${n === 1 ? "" : "s"}`;
