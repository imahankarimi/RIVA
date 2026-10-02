"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * Calendar — RIVA-native range picker ported from the Shadcn reference
 * interaction (hover preview, day-cell grid, month nav). Lightweight,
 * dependency-free, RTL- and locale-aware.
 */

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

function Calendar({
  mode = "range",
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 1,
  className,
}: {
  mode?: "range" | "single";
  selected?: DateRange | Date;
  onSelect?: (range: DateRange) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  className?: string;
}) {
  const { dir, locale } = useI18n();
  const base = defaultMonth ?? startOfMonth(new Date());
  const [monthIndex, setMonthIndex] = React.useState(
    Math.max(0, (base.getFullYear() - 2025) * 12 + base.getMonth())
  );
  const [hovered, setHovered] = React.useState<Date | null>(null);

  const from = mode === "range" && selected && "from" in selected ? selected.from : undefined;
  const to = mode === "range" && selected && "to" in selected ? selected.to : undefined;

  const months = React.useMemo(() => {
    const baseMonth = startOfMonth(
      addMonths(new Date(2025, 0, 1), Math.max(1, monthIndex))
    );
    return Array.from({ length: numberOfMonths }, (_, i) =>
      addMonths(baseMonth, i)
    );
  }, [monthIndex, numberOfMonths]);

  function renderMonth(monthStart: Date) {
    const first = startOfMonth(monthStart);
    const offset = first.getDay(); // 0 = Sunday
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
        <div className="text-center text-sm font-medium text-ink">
          {formatMonthLabel(first, locale)}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {daysForLocale(locale).map((d) => (
            <div
              key={d}
              className="flex h-8 items-center justify-center text-[11px] font-medium text-ink-faint"
            >
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="h-8" />;

            const start = from && isSameDay(day, from);
            const end = to && isSameDay(day, to);
            const inSel = inRange(day, from, to, hovered);
            const isToday = isSameDay(day, new Date());

            const handleClick = () => {
              if (mode !== "range" || !onSelect) return;
              if (!from || (from && to)) {
                onSelect({ from: day, to: undefined });
              } else {
                if (day.getTime() < (from as Date).getTime()) {
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
                  "relative flex h-8 items-center justify-center text-[12px] tabular-nums transition-colors duration-100",
                  inSel && "bg-signal-50 text-ink",
                  start && "rounded-l-md bg-signal-500 text-onSignal",
                  end && "rounded-r-md bg-signal-500 text-onSignal",
                  start && end && "rounded-md",
                  !inSel && "text-ink-soft hover:bg-surfaceMuted hover:text-ink",
                  isToday && !start && !end && "font-semibold text-signal-700"
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

  const canNext = true;

  return (
    <div
      dir={dir}
      className={cn(
        "w-full bg-popover p-3",
        numberOfMonths > 1 && "sm:flex sm:flex-col sm:gap-4 md:flex-row md:gap-8",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonthIndex((m) => Math.max(0, m - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surfaceMuted hover:text-ink"
        >
          {dir === "rtl" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <span className="text-sm font-semibold text-ink">
          {months[0] ? formatMonthLabel(months[0], locale) : ""}
          {numberOfMonths > 1 && months[1] && (
            <span className="text-ink-faint"> — {formatMonthLabel(months[1], locale)}</span>
          )}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonthIndex((m) => m + 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surfaceMuted hover:text-ink",
            !canNext && "pointer-events-none opacity-40"
          )}
        >
          {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        {months.map(renderMonth)}
      </div>
    </div>
  );
}

export { Calendar };