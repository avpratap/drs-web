import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full min-h-11 rounded-lg border bg-drs-white px-3 py-2 text-sm text-drs-ink placeholder:text-drs-ink/70 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    className: string;
  }) => React.ReactNode;
};

/** Label + control + hint/error wired up for screen readers. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-drs-ink">
        {label}
        {required && (
          <span className="text-drs-maroon" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        className: cn(control, error ? "border-drs-maroon" : "border-drs-ink/20"),
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-drs-ink/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-drs-maroon">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input id={id} type="checkbox" className="size-5 rounded accent-drs-green" {...rest} />
      {label}
    </label>
  );
}
