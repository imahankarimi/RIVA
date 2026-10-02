"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export interface DateRange {
  from?: Date;
  to?: Date;
}

const DAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function daysForLocale(locale: string) {
  return DAYS_EN;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(day: Date, from?: Date, to?: Date) {
  if (!from || !to) return false;
  const t = day.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function inRange(day: Date, from?: Date, to?: Date, hovered?: Date | null) {
  if (from && to) return isBetween(day, from, to);
  if (from && hovered) {
    const a = from.getTime();
    const b = hovered.getTime();
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return day.getTime() >= lo && day.getTime() <= hi;
  }
  return false;
}

function formatMonthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

interface DateRangePickerProps {
  selected?: DateRange;
  onSelect?: (range: DateRange) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  className?: string;
}

function DateRangePicker({
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 2,
  className,
}: DateRangePickerProps) {
  const { dir, locale } = useI18n();
  const base = defaultMonth ?? startOfMonth(new Date());
  const [monthIndex, setMonthIndex] = React.useState(
    Math.max(0, (base.getFullYear() - 2025) * 12 + base.getMonth())
  );
  const [hovered, setHovered] = React.useState<Date | null>(null);

  const from = selected?.from;
  const to = selected?.to;

  const months = React.useMemo(() => {
    const baseMonth = startOfMonth(
      addMonths(new Date(2025, 0, 1), Math.max(0, monthIndex))
    );
    return Array.from({ length: numberOfMonths }, (_, i) =>
      addMonths(baseMonth, i)
    );
  }, [monthIndex, numberOfMonths]);

  function renderMonth(monthStart: Date) {
    const first = startOfMonth(monthStart);
    const offset = first.getDay();
    const daysInMonth = new Date(
      first.getFullYear(),
      first.getMonth() + 1,
      0
    ).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    }

    return (
      <div key={first.toISOString()} className="flex w-full flex-col gap-3">
        <div className="text-center text-xs font-semibold text-foreground">
          {formatMonthLabel(first, locale)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {daysForLocale(locale).map((d) => (
            <div
              key={d}
              className="flex h-7 items-center justify-center text-[10px] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (!day)
              return <div key={`e${i}`} className="h-7" />;

            const start = from && isSameDay(day, from);
            const end = to && isSameDay(day, to);
            const inSel = inRange(day, from, to, hovered);
            const isToday = isSameDay(day, new Date());

            const handleClick = () => {
              if (!onSelect) return;
              if (!from || (from && to)) {
                onSelect({ from: day, to: undefined });
              } else {
                if (day.getTime() < from.getTime()) {
                  onSelect({ from: day, to: from });
                } else {
                  onSelect({ from, to: day });
                }
              }
            };

            return (
              <motion.button
                key={day.toISOString()}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={handleClick}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "relative flex h-7 items-center justify-center text-[11px] font-medium transition-all duration-100 rounded-sm",
                  inSel && "bg-primary/15 text-foreground",
                  start && "rounded-l-md bg-primary text-primary-foreground",
                  end && "rounded-r-md bg-primary text-primary-foreground",
                  start && end && "rounded-md",
                  !inSel &&
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isToday && !start && !end && "font-semibold text-primary"
                )}
              >
                {day.getDate()}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className={cn(
        "w-full bg-popover p-4",
        numberOfMonths > 1 &&
          "flex flex-col gap-4 sm:gap-6 md:flex-row md:gap-8",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonthIndex((m) => Math.max(0, m - 1))}
          className="flex h-8 px-3 items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Earlier
        </button>
        <span className="text-xs font-semibold text-foreground flex-1 text-center">
          {months[0] ? formatMonthLabel(months[0], locale) : ""}
          {numberOfMonths > 1 && months[1] && (
            <span className="text-muted-foreground">
              {" "}
              — {formatMonthLabel(months[1], locale)}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonthIndex((m) => m + 1)}
          className="flex h-8 px-3 items-center justify-center rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Next →
        </button>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:pt-10">
        {months.map(renderMonth)}
      </div>
    </div>
  );
}

export { DateRangePicker };
