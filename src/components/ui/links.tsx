import Link from "next/link";
import { cn } from "@/lib/cn";

/** Primary text link in a table cell (green, underlined on hover). */
export function TextLink({
  href,
  children,
  sub,
  className,
}: {
  href: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("font-medium text-drs-green hover:underline", className)}>
      {children}
      {sub !== undefined && <span className="block text-xs font-normal text-drs-ink/65">{sub}</span>}
    </Link>
  );
}

/** Row action link with a 44px touch target; `srLabel` disambiguates for screen readers. */
export function RowLink({
  href,
  children,
  srLabel,
}: {
  href: string;
  children: React.ReactNode;
  srLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={srLabel && typeof children === "string" ? `${children} ${srLabel}` : undefined}
      className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-drs-green hover:underline"
    >
      {children}
    </Link>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:underline">
      <span aria-hidden>← </span>
      {children}
    </Link>
  );
}
