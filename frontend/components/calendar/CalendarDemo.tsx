"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  TrendingUp,
  Home,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  amount: number;
  type: "income" | "expense" | "recurring";
  category: string;
}

export const demoEvents: CalendarEvent[] = [
  { id: "e1", day: 2, title: "Client Invoice #104", amount: 3200, type: "income", category: "Revenue" },
  { id: "e2", day: 5, title: "Office rent", amount: 1850, type: "expense", category: "Rent" },
  { id: "e3", day: 8, title: "SaaS subscriptions", amount: 340, type: "recurring", category: "Software" },
  { id: "e4", day: 11, title: "Supplier payment", amount: 890, type: "expense", category: "Supplies" },
  { id: "e5", day: 15, title: "Payroll", amount: 4200, type: "recurring", category: "Salaries" },
  { id: "e6", day: 19, title: "Client milestone", amount: 5600, type: "income", category: "Revenue" },
  { id: "e7", day: 22, title: "Marketing spend", amount: 640, type: "expense", category: "Marketing" },
  { id: "e8", day: 26, title: "Utilities", amount: 210, type: "recurring", category: "Utilities" },
];

const TYPE_ICON: Record<CalendarEvent["type"], React.ComponentType<{ className?: string }>> = {
  income: TrendingUp,
  expense: Receipt,
  recurring: Home,
};

const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  income: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  expense: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  recurring: "text-sky-600 bg-sky-50 dark:bg-sky-950/30",
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

export function CalendarDemo() {
  const { locale, t, dir } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<number>(today.getDate());

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const ev of demoEvents) {
      const list = map.get(ev.day) ?? [];
      list.push(ev);
      map.set(ev.day, list);
    }
    return map;
  }, []);

  const month = cursor.getMonth();
  const year = cursor.getFullYear();
  const cells = monthDays(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedEvents = (eventsByDay.get(selected) ?? []).slice(0, 4);

  const monthLabel = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const nav = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      {/* Month grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">{monthLabel}</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => nav(-1)}
                aria-label="Previous month"
              >
                ← Earlier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => nav(1)}
                aria-label="Next month"
              >
                Next →
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <div className="px-4 pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-medium text-muted-foreground mb-2">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selected;
              const dayEvents = eventsByDay.get(day) ?? [];
              const net = dayEvents.reduce((s, ev) => s + (ev.type === "expense" ? -ev.amount : ev.amount), 0);

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex flex-col items-center justify-start gap-1 rounded-lg border-2 p-2 text-center transition-all duration-200 min-h-[64px]",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : isToday
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-colors",
                      isToday ? "bg-primary text-primary-foreground" : isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <>
                      <span
                        className={cn(
                          "text-[9px] font-semibold tabular-nums",
                          net >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {net >= 0 ? "+" : ""}
                        {formatCurrency(net, "USD", locale, { signed: true })}
                      </span>
                      {dayEvents.length > 1 && (
                        <span className="flex gap-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                ev.type === "income"
                                  ? "bg-emerald-500"
                                  : ev.type === "expense"
                                  ? "bg-rose-500"
                                  : "bg-sky-500"
                              )}
                            />
                          ))}
                        </span>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Selected day detail */}
      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }).format(new Date(year, month, selected))}
          </CardTitle>
          <CardAction>
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Add event">
              <Plus className="h-4 w-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <div className="px-4 pb-4">
          <AnimatePresence mode="wait">
            {selectedEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-col items-center justify-center gap-2 py-8 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Sparkles className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <p className="text-sm font-medium text-foreground">{t("calendar.noEvents")}</p>
                <p className="max-w-xs text-xs text-muted-foreground">{t("calendar.noEventsBody")}</p>
              </motion.div>
            ) : (
              <motion.ul
                key="events"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-2"
              >
                {selectedEvents.map((ev) => {
                  const Icon = TYPE_ICON[ev.type];
                  return (
                    <motion.li
                      key={ev.id}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TYPE_COLORS[ev.type])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge
                            variant={ev.type === "income" ? "success" : ev.type === "expense" ? "destructive" : "neutral"}
                            className="text-[10px]"
                          >
                            {ev.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{t(`calendar.${ev.type}`)}</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          ev.type === "income"
                            ? "text-emerald-600"
                            : ev.type === "expense"
                            ? "text-rose-600"
                            : "text-foreground"
                        )}
                      >
                        {formatCurrency(ev.amount, "USD", locale, { signed: ev.type === "income" })}
                      </span>
                    </motion.li>
                  );
                })}
                {dayEventsCount(selected) > 4 && (
                  <li className="pt-1 text-center text-xs font-medium text-primary">
                    +{dayEventsCount(selected) - 4} {t("calendar.more")}
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );

  function dayEventsCount(day: number) {
    return (eventsByDay.get(day) ?? []).length;
  }
}