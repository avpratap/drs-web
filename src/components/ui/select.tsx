"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { swallowDialogCancel, useDialogContainer } from "./use-dialog-container";

/* ------------------------------------------------------------------------------------------
 * shadcn/ui Select primitives (Radix), themed with the DRS tokens. The Radix root is
 * exported as `SelectRoot` so that `Select` can stay the app's {value,label} options API.
 * ---------------------------------------------------------------------------------------- */

const SelectRoot = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

/** Same height/radius/border/padding as the text inputs; the chevron turns while open. */
export const triggerClass =
  "relative flex w-full min-h-11 items-center justify-between gap-2 rounded-lg border border-drs-ink/20 bg-drs-white px-3 py-2 text-left text-sm text-drs-ink transition-colors hover:border-drs-green/50 focus-visible:border-drs-green data-[state=open]:border-drs-green data-[placeholder]:text-drs-ink/70 aria-[invalid=true]:border-drs-maroon data-[invalid]:border-drs-maroon disabled:cursor-not-allowed disabled:bg-drs-cream/50 disabled:text-drs-ink/70 disabled:hover:border-drs-ink/20 [&>span]:min-w-0 [&>span]:truncate [&[data-state=open]>svg]:rotate-180";

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(triggerClass, className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 text-drs-green transition-transform duration-150"
          strokeWidth={2}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("flex cursor-default items-center justify-center py-1 text-drs-green", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" aria-hidden />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("flex cursor-default items-center justify-center py-1 text-drs-green", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" aria-hidden />
    </SelectPrimitive.ScrollDownButton>
  );
}

/**
 * Popper-positioned listbox at the trigger's width. Radix (floating-ui) keeps it on-screen:
 * it flips above when there's more room there, shifts to stay `collisionPadding` inside the
 * viewport edges and caps its height to the space available (then scrolls).
 */
function SelectContent({
  className,
  children,
  position = "popper",
  container,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <SelectPrimitive.Portal container={container ?? undefined}>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          "relative z-50 overflow-hidden rounded-lg border border-drs-green/15 bg-drs-white text-sm text-drs-ink shadow-lg shadow-drs-green/10",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
          position === "popper" &&
            "max-h-[min(18rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1rem)] origin-[var(--radix-select-content-transform-origin)]",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-xs font-medium text-drs-ink/70", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 w-full cursor-pointer items-center rounded-md py-2 pr-3 pl-8 outline-none select-none",
        "focus:bg-drs-green/10 focus:text-drs-green data-[state=checked]:font-medium data-[state=checked]:text-drs-green",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-drs-green" strokeWidth={2.25} aria-hidden />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-drs-ink/10", className)} {...props} />;
}

export {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

/* ------------------------------------------------------------------------------------------
 * App-level Select: the {value,label} options API used across the dashboard.
 * ---------------------------------------------------------------------------------------- */

export type SelectOption = { value: string | number; label: string; disabled?: boolean };
type Value = string | number | null | undefined;

export type SelectProps = {
  options: readonly SelectOption[];
  value: Value;
  /** Called with the option's own value (numbers stay numbers), or "" for the empty choice. */
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  /** Muted text shown when nothing is selected. */
  placeholder?: string;
  /** Adds an empty first option (labelled `emptyLabel`, else the placeholder) that clears the value. */
  clearable?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Size the trigger to its widest option instead of filling the container. */
  fit?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
};

// Radix item values must be non-empty strings: map typed values onto keys and back.
const EMPTY = "__drs_empty__";
const keyOf = (v: string | number) => `${typeof v}:${String(v)}`;
const blank = (v: Value) => v === "" || v == null;

export function Select({
  options,
  value,
  onChange,
  onBlur,
  id,
  name,
  placeholder = "Select…",
  clearable,
  emptyLabel,
  disabled,
  invalid,
  fit,
  className,
  ...aria
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { container, resolve } = useDialogContainer(triggerRef);
  const [open, setOpen] = useState(false);

  const byKey = useMemo(() => new Map(options.map((o) => [keyOf(o.value), o.value])), [options]);
  const selected = blank(value) ? undefined : options.find((o) => String(o.value) === String(value));

  // Portal into an enclosing native modal <dialog> (it lives in the top layer and makes the
  // rest of the page inert), otherwise into <body>.
  const onOpenChange = useCallback(
    (next: boolean) => {
      if (next) resolve();
      setOpen(next);
      if (!next) onBlur?.();
    },
    [onBlur, resolve],
  );

  return (
    <div className={cn(fit ? "inline-grid w-full md:w-auto" : "grid w-full", className)}>
      <SelectRoot
        open={open}
        onOpenChange={onOpenChange}
        value={selected ? keyOf(selected.value) : ""}
        onValueChange={(k) => {
          if (k === EMPTY) onChange("");
          else if (byKey.has(k)) onChange(byKey.get(k)!);
        }}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger
          ref={triggerRef}
          id={id}
          aria-invalid={invalid || undefined}
          aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-labelledby"]}
          aria-describedby={aria["aria-describedby"]}
          onBlur={() => !open && onBlur?.()}
          className="col-start-1 row-start-1"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent container={container} onEscapeKeyDown={swallowDialogCancel}>
          {clearable && (
            <SelectItem value={EMPTY} data-value="" className="text-drs-ink/70">
              {emptyLabel ?? placeholder}
            </SelectItem>
          )}
          {options.map((o) => (
            <SelectItem
              key={keyOf(o.value)}
              value={keyOf(o.value)}
              data-value={String(o.value)}
              disabled={o.disabled}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      {fit && (
        // Invisible sizer: the grid cell grows to the widest label (+ chevron), so the
        // trigger is never wider, or narrower, than its longest choice.
        <span aria-hidden className="invisible col-start-1 row-start-1 grid h-0 overflow-hidden">
          {[placeholder, emptyLabel ?? "", ...options.map((o) => o.label)].map((l, i) => (
            <span key={i} className="col-start-1 row-start-1 pr-9 pl-3 text-sm whitespace-nowrap">
              {l}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
