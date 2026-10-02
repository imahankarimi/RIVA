"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatNumber, type BackendCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL_SIZE = 13;
const CELL_GAP = 3;
const TOTAL = CELL_SIZE + CELL_GAP;

/** Single spending cell. Returns a Tailwind fill for the active theme. */
function intensityClass(amount: number, max: number): string {
  if (amount === 0) return "fill-surfaceMuted/50";
  const ratio = amount / max;
  if (ratio < 0.2) return "fill-signal-500/15";
  if (ratio < 0.4) return "fill-signal-500/30";
  if (ratio < 0.65) return "fill-signal-500/50";
  return "fill-signal-500/70";
}

function dayKey(d: Date): string {
  const s = d.toISOString();
  const idx = s.indexOf("T");
  return s.slice(0, idx === -1 ? s.length : idx);
}

function shortMonth(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "short",
  }).format(d);
}

export function SpendingHeatmap({
  data,
  currency,
}: {
  data: AnalyticsData;
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();

  const { grid, monthLabels, yearTotal, max } = useMemo(() => {
    const spend = data.spendByDay;

    // Reference behavior: a full week-column grid ending at today, with the
    // current data overlaid. Sparse data still fills the frame so the section
    // reads as a complete year — not a partial strip anchored to first spend.
    const now = new Date();
    const today = dayKey(now);
    const todayDate = new Date(today + "T12:00:00");
    const gridEnd = todayDate;
    gridEnd.setDate(gridEnd.getDate() - gridEnd.getDay()); // back to Sunday

    const lookup = spend;

    const weeks: { date: string; amount: number; col: number; row: number }[] = [];
    const months: { label: string; col: number }[] = [];
    const seenMonths = new Set<string>();

    for (let col = 0; col < 53; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(gridEnd);
        d.setDate(d.getDate() - (52 - col) * 7 + row);
        const key = dayKey(d);

        const amount = lookup.get(key) ?? 0;
        weeks.push({ date: key, amount, col, row });

        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (!seenMonths.has(monthKey) && row === 0) {
          seenMonths.add(monthKey);
          months.push({ label: shortMonth(d, locale), col });
        }
      }
    }

    const amounts = weeks.map((w) => w.amount).filter((a) => a > 0);
    const max = amounts.length ? Math.max(...amounts) : 1;
    const yearTotal = amounts.reduce((s, a) => s + a, 0);

    return { grid: weeks, monthLabels: months, yearTotal, max };
  }, [data, locale]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-[14.5px] font-bold text-ink">
            {t("analytics.spendingActivity")}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-ink-soft">
            <span className="font-mono font-figures font-semibold text-ink">
              {formatNumber(yearTotal, locale)}
            </span>{" "}
            {t("analytics.totalSpent")}
            <span className="text-ink-faint">
              {" "}· {data.rangeStart} → {data.rangeEnd}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-soft">
          <span>{t("analytics.less")}</span>
          <span className="inline-block size-3 rounded-sm bg-surfaceMuted/50" />
          <span className="inline-block size-3 rounded-sm bg-signal-500/15" />
          <span className="inline-block size-3 rounded-sm bg-signal-500/30" />
          <span className="inline-block size-3 rounded-sm bg-signal-500/50" />
          <span className="inline-block size-3 rounded-sm bg-signal-500/70" />
          <span>{t("analytics.more")}</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="overflow-x-auto">
          <svg
            width={53 * TOTAL + 32}
            height={7 * TOTAL + 24}
            className="text-ink-soft"
            role="img"
            aria-label={t("analytics.spendingActivity")}
          >
            {/* Month labels */}
            {monthLabels.map((m) => (
              <text
                key={`${m.label}-${m.col}`}
                x={m.col * TOTAL + 32}
                y={10}
                className="fill-ink-faint text-[10px]"
              >
                {m.label}
              </text>
            ))}

            {/* Day labels */}
            {DAY_LABELS.map((label, i) =>
              label ? (
                <text
                  key={i}
                  x={0}
                  y={i * TOTAL + 28}
                  className="fill-ink-faint text-[10px]"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              ) : null
            )}

            {/* Day cells */}
            {grid.map((cell) => {
              const formatted = formatNumber(cell.amount, locale);
              const tooltipDate = new Date(cell.date + "T12:00:00");
              const dateLabel = tooltipDate.toLocaleDateString(
                locale === "fa" ? "fa-IR" : "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              return (
                <Tooltip
                  key={cell.date}
                  delayMs={0}
                  content={
                    <span className="tabular-nums">
                      {formatted}
                      {cell.amount > 0 ? ` · ${dateLabel}` : ` ${dateLabel}`}
                    </span>
                  }
                >
                  <rect
                    x={cell.col * TOTAL + 32}
                    y={cell.row * TOTAL + 18}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    className={cn(
                      intensityClass(cell.amount, max),
                      "transition-colors hover:stroke-ink-faint hover:stroke-1"
                    )}
                  />
                </Tooltip>
              );
            })}
          </svg>
        </div>
      </div>

      {data.zeroSpend && (
        <p className="border-t border-line-soft px-5 py-3 text-[12.5px] text-ink-soft">
          {t("analytics.emptySpendBody")}
        </p>
      )}
    </Card>
  );
}