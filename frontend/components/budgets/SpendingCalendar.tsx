"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { BackendCurrency } from "@/lib/currency";

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Spending Calendar — heatmap of daily spending with intensity visualization.
 * Shows money spent per day with a color ramp (0-4 intensity levels).
 * Highlights today and includes month navigation.
 */
export function SpendingCalendar({
  dailySpending,
  currency,
  monthLabel,
}: {
  dailySpending: { day: number; amount: number }[];
  currency: BackendCurrency;
  monthLabel: string;
}) {
  const { locale, dir } = useI18n();
  const [month, setMonth] = useState(new Date());

  const { weeks, maxAmount, todayDay } = useMemo(() => {
    const now = new Date();
    const displayMonth = month.getMonth();
    const displayYear = month.getFullYear();
    const todayDay = now.getDate();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const map = new Map(dailySpending.map((d) => [d.day, d.amount]));

    const cells: { day: number | null; amount: number }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, amount: 0 });
    let max = 1;
    for (let d = 1; d <= daysInMonth; d++) {
      const amount = map.get(d) ?? 0;
      if (amount > max) max = amount;
      cells.push({ day: d, amount });
    }

    const weeks: { day: number | null; amount: number }[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const last = weeks[weeks.length - 1];
    if (last) while (last.length < 7) last.push({ day: null, amount: 0 });

    return { weeks, maxAmount: max, todayDay };
  }, [dailySpending, month]);

  const DAYS = DAYS_EN;
  const displayMonthLabel = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(month);

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">{displayMonthLabel}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              ← Earlier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={nextMonth}
              aria-label="Next month"
            >
              Next →
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-medium text-muted-foreground mb-2">
          {DAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid gap-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-2">
              {week.map((cell, ci) => {
                if (cell.day === null) {
                  return <div key={ci} />;
                }
                const intensity =
                  cell.amount === 0
                    ? 0
                    : Math.min(Math.round((cell.amount / maxAmount) * 4), 4);
                const isToday = cell.day === todayDay && month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();

                return (
                  <motion.div
                    key={ci}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    title={cell.amount > 0 ? `${cell.day} · ${formatCurrency(cell.amount, currency, locale)}` : undefined}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg py-2 text-center transition-all duration-200 cursor-default",
                      intensity === 0 && "bg-transparent",
                      intensity === 1 && "bg-primary/10",
                      intensity === 2 && "bg-primary/20",
                      intensity === 3 && "bg-primary/35",
                      intensity === 4 && "bg-primary/50",
                      isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <span className={cn(
                      "text-[11px] font-semibold tabular-nums",
                      isToday && "text-primary"
                    )}>
                      {cell.day}
                    </span>
                    {cell.amount > 0 && (
                      <span className="hidden text-[8px] tabular-nums text-muted-foreground sm:inline">
                        {formatCurrency(cell.amount, currency, locale)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}