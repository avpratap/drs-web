import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-drs-green text-drs-cream hover:bg-drs-green/90 disabled:bg-drs-green/50",
  secondary:
    "bg-drs-white text-drs-green border border-drs-green/30 hover:border-drs-green hover:bg-drs-green/5",
  ghost: "text-drs-green hover:bg-drs-green/10",
  danger: "bg-drs-maroon text-drs-cream hover:bg-drs-maroon/90 disabled:bg-drs-maroon/50",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, styles[variant], className)}
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
  className,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, styles[variant], className)} {...rest} />;
}
