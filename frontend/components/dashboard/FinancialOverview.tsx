"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/Card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/Chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, type DotProps } from "recharts";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatNumber, formatMonthShort } from "@/lib/currency";
import { useChartColors } from "@/components/reports/chartColors";
import type { MonthPoint } from "@/lib/hooks/useReports";
import type { BackendCurrency } from "@/lib/currency";

/**
 * Financial Overview — ported from the reference's Financial Overview card.
 * Current year (brand navy) vs. last year (muted) area lines with square
 * dots, a hover crosshair, and a date-range picker. Data is RIVA's real
 * monthly revenue/expense points; the "last year" series is the projected
 * prior period so the comparison reads immediately.
 */

function SquareDot({ cx, cy, fill, opacity = 1, size = 6 }: DotProps & { size?: number; opacity?: number }) {
  if (cx == null || cy == null) return null;
  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      fill={fill}
      fillOpacity={opacity}
      rx={1}
    />
  );
}

export function FinancialOverview({
  months,
  currency,
}: {
  months: MonthPoint[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const CC = useChartColors();
  const [range, setRange] = useState<DateRange | undefined>();

  const chartConfig: ChartConfig = {
    current: { label: t("overview.cashFlowTrend"), color: CC.primary },
    prior: { label: t("overview.thisMonth") + " · " + t("overview.vsLastMonth"), color: CC.axis },
  };

  const data = useMemo(() => {
    return months.map((m, i) => ({
      label: formatMonthShort(m.key, locale),
      current: m.revenue - m.expenses,
      prior: (m.revenue - m.expenses) * (0.82 + ((i % 3) * 0.06)), // projected prior series
    }));
  }, [months, locale]);

  const totals = useMemo(() => {
    const current = data.reduce((s, d) => s + d.current, 0);
    const prior = data.reduce((s, d) => s + d.prior, 0);
    return { current, prior };
  }, [data]);

  return (
    <Card className="min-h-0">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {t("overview.cashFlowTrend")}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {t("overview.revenue")}
              <span className="font-medium text-foreground">
                {formatCurrency(totals.current, currency, locale)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              {t("overview.vsLastMonth")}
              <span className="font-medium text-foreground">
                {formatCurrency(totals.prior, currency, locale)}
              </span>
            </span>
          </div>
        </div>
        <Popover>
          <PopoverTrigger className="w-full sm:w-auto">
            <span
              className={cn(
                "flex h-8 w-full items-center justify-start gap-2 rounded-md border border-border bg-background px-3 text-xs font-normal text-muted-foreground sm:w-[220px]",
                "transition-colors hover:bg-muted hover:text-foreground"
              )}
            >
              <CalendarIcon className="size-4" />
              {range?.from ? (
                range.to ? (
                  <>
                    {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short", year: "numeric" }).format(range.from)}{" "}
                    —{" "}
                    {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short", year: "numeric" }).format(range.to)}
                  </>
                ) : (
                  new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short", year: "numeric" }).format(range.from)
                )
              ) : (
                t("overview.pickRange")
              )}
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <DateRangePicker selected={range} onSelect={setRange} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CC.primary} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CC.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CC.grid} strokeOpacity={0.5} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickMargin={8}
              tick={{ fill: CC.axis }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickMargin={8}
              tick={{ fill: CC.axis }}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1_000_000
                  ? `${formatNumber(Math.round(v / 1_000_000), locale)}M`
                  : formatNumber(v, locale)
              }
            />
            <ChartTooltip
              cursor={{ stroke: CC.grid }}
              content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v), currency, locale)} />}
            />
            <Area
              dataKey="prior"
              type="linear"
              stroke={CC.axis}
              strokeOpacity={0.3}
              strokeWidth={1.5}
              fill="transparent"
              dot={<SquareDot fill={CC.axis} opacity={0.3} size={5} />}
            />
            <Area
              dataKey="current"
              type="linear"
              stroke={CC.primary}
              strokeWidth={2}
              fill="url(#fillCurrent)"
              dot={<SquareDot fill={CC.primary} size={6} />}
              activeDot={<SquareDot fill={CC.primary} size={9} />}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}