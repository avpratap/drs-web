"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui-style Calendar on react-day-picker, themed with the DRS palette: white surface,
 * green selected day, a gold ring for today (the sparing accent). Keyboard: arrows move a
 * day/week, PageUp/PageDown a month (+Shift a year), Home/End the week, Enter/Space select.
 */
const dayParts = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

/** "28 October 2026, Wednesday, today, selected": contains the visible number as a word (WCAG 2.5.3). */
function dayLabel(date: Date, modifiers: { today?: boolean; selected?: boolean }): string {
  const p = Object.fromEntries(dayParts.formatToParts(date).map((x) => [x.type, x.value]));
  return [
    `${p.day} ${p.month} ${p.year}`,
    p.weekday,
    modifiers.today && "today",
    modifiers.selected && "selected",
  ]
    .filter(Boolean)
    .join(", ");
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={1}
      className={cn("p-3 text-sm text-drs-ink", className)}
      classNames={{
        root: "relative",
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous:
          "grid size-9 place-items-center rounded-md text-drs-green hover:bg-drs-green/10 disabled:opacity-40",
        button_next:
          "grid size-9 place-items-center rounded-md text-drs-green hover:bg-drs-green/10 disabled:opacity-40",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold text-drs-green",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 pb-1 text-center text-[0.75rem] font-medium text-drs-ink/70",
        week: "mt-1 flex w-full",
        day: "relative flex-1 p-0 text-center",
        outside: "text-drs-ink/65",
        disabled: "opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      labels={{ labelDayButton: dayLabel, ...props.labels }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", c)} aria-hidden />
          ) : (
            <ChevronRightIcon className={cn("size-4", c)} aria-hidden />
          ),
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  // react-day-picker moves keyboard focus by flagging the day as `focused`; follow it.
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button
      ref={ref}
      type="button"
      data-day={day.isoDate}
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      className={cn(
        "mx-auto grid size-10 place-items-center rounded-md text-sm transition-colors outline-none md:size-9",
        "hover:bg-drs-green/10 hover:text-drs-green focus-visible:ring-2 focus-visible:ring-drs-green focus-visible:ring-offset-1",
        modifiers.today &&
          !modifiers.selected &&
          "font-semibold text-drs-green ring-1 ring-drs-gold ring-inset",
        modifiers.selected &&
          "bg-drs-green font-semibold text-drs-cream hover:bg-drs-green hover:text-drs-cream",
        modifiers.outside && !modifiers.selected && "text-drs-ink/65",
        modifiers.disabled && "pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
