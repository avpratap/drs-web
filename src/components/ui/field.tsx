import { useId } from "react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./checkbox";

/** Text-input styling shared by every control (inputs, Select trigger): 44px, radius-lg, ink/20 border. */
export const inputClass =
  "block w-full min-h-11 rounded-lg border border-drs-ink/20 bg-drs-white px-3 py-2 text-sm text-drs-ink transition-colors placeholder:text-drs-ink/70 hover:border-drs-green/50 focus-visible:border-drs-green aria-[invalid=true]:border-drs-maroon read-only:hover:border-drs-ink/20";
const control = inputClass;

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

/** A labelled checkbox (shadcn/Radix Checkbox); the whole row is the click target. */
export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  onBlur,
  disabled,
  name,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  name?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        onBlur={onBlur}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm text-drs-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
      >
        {label}
      </label>
    </div>
  );
}
