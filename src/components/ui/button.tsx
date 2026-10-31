import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "md" | "pill";

/**
 * Hover only while enabled (disabled buttons get pointer-events: none), one disabled look per
 * variant, and a subtle pressed state everywhere. Focus is the global outline; filled buttons
 * use an ink outline a little further out, since green-on-green would vanish.
 */
const styles: Record<Variant, string> = {
  primary:
    "bg-drs-green text-drs-cream hover:bg-drs-green/90 active:bg-drs-green/85 disabled:bg-drs-ink/15 disabled:text-drs-ink/70 disabled:shadow-none focus-visible:outline-drs-ink focus-visible:outline-offset-[3px]",
  secondary:
    "bg-drs-white text-drs-green border border-drs-green/30 hover:border-drs-green hover:bg-drs-green/5 active:bg-drs-green/10 disabled:border-drs-ink/15 disabled:bg-drs-white disabled:text-drs-ink/50",
  ghost:
    "text-drs-green hover:bg-drs-green/10 active:bg-drs-green/15 disabled:bg-transparent disabled:text-drs-ink/50",
  danger:
    "bg-drs-maroon text-drs-cream hover:bg-drs-maroon/90 active:bg-drs-maroon/85 disabled:bg-drs-ink/15 disabled:text-drs-ink/70 focus-visible:outline-drs-ink focus-visible:outline-offset-[3px]",
  // On green surfaces (e.g. the subscription band).
  inverse:
    "bg-drs-cream text-drs-green hover:bg-drs-white active:bg-drs-white/90 disabled:bg-drs-cream/40 disabled:text-drs-green/60",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 rounded-lg px-4 text-sm font-medium",
  // The storefront's call-to-action pill.
  pill: "min-h-12 rounded-full px-7 text-[0.9375rem] font-semibold",
};

const base =
  "inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:cursor-not-allowed";

/** Class string for a button-styled element that isn't a <Button> (links, pager, search submit…). */
export const buttonClass = (variant: Variant = "primary", className?: string, size: Size = "md") =>
  cn(base, sizes[size], styles[variant], size === "pill" && variant === "primary" && "shadow-sm", className);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, className, size)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, className, size)} {...rest} />;
}
