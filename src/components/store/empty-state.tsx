import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * On-brand "nothing here yet" panel for lists (mirrors ErrorState): an icon in a soft circle,
 * a short title, an optional line of help and an optional next step. `as="h2"` when the empty
 * state stands in for a page section's content.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  as: Title = "p",
  tone = "green",
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  body?: React.ReactNode;
  action?: { href: string; label: string };
  as?: "p" | "h2" | "h3";
  tone?: "green" | "maroon";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-drs-ink/20 bg-drs-white/70 px-6 py-12 text-center md:py-14",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-14 place-items-center rounded-full",
          tone === "maroon" ? "bg-drs-maroon/10 text-drs-maroon" : "bg-drs-green/10 text-drs-green",
        )}
      >
        <Icon aria-hidden className="size-7" strokeWidth={1.6} />
      </span>
      <Title className="mt-4 text-lg font-semibold text-drs-ink md:text-xl">{title}</Title>
      {body && <p className="mt-1 max-w-sm text-sm leading-relaxed text-drs-ink/75">{body}</p>}
      {action && (
        <Link href={action.href} className={buttonClass("primary", "mt-6 px-6 text-sm", "pill")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
