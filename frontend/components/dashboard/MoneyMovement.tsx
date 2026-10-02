"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/Chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatNumber, formatMonthShort } from "@/lib/currency";
import { useChartColors } from "@/components/reports/chartColors";
import type { MonthPoint } from "@/lib/hooks/useReports";
import type { BackendCurrency } from "@/lib/currency";

type Range = "3" | "6" | "12";

/**
 * Money Movement — ported from the reference's Money Movement card.
 * Money In / Money Out grouped bars, net-flow summary, and a period Select.
 * Built from RIVA's real monthly revenue/expense points.
 */
export function MoneyMovement({
  months,
  currency,
}: {
  months: MonthPoint[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const CC = useChartColors();
  const [range, setRange] = useState<Range>("6");

  const budget = useMemo(() => {
    const n = Number(range);
    return months.slice(-n);
  }, [months, range]);

  const chartConfig: ChartConfig = {
    moneyIn: { label: t("overview.revenue"), color: CC.primary },
    moneyOut: { label: t("overview.expenses"), color: CC.axis },
  };

  const data = budget.map((m) => ({
    label: formatMonthShort(m.key, locale),
    moneyIn: m.revenue,
    moneyOut: m.expenses,
  }));

  const totals = useMemo(() => {
    const inTotal = data.reduce((s, d) => s + d.moneyIn, 0);
    const outTotal = data.reduce((s, d) => s + d.moneyOut, 0);
    return { in: inTotal, out: outTotal, net: inTotal - outTotal };
  }, [data]);

  const OPTIONS: { value: Range; label: string }[] = [
    { value: "3", label: "3" },
    { value: "6", label: "6" },
    { value: "12", label: "12" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">
          {t("overview.moneyMovement")}
        </CardTitle>
        <div className="inline-flex h-8 items-center rounded-md bg-muted p-[3px] text-xs">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={cn(
                "h-full rounded-[5px] px-2.5 text-[11px] font-medium transition-all",
                range === o.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-moss-100/60 px-3 py-2.5 rtl:flex-row-reverse">
            <div className="flex size-8 items-center justify-center rounded-lg bg-moss-500/15">
              <ArrowDownLeftIcon className="size-4 text-moss-700" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-moss-700/70">{t("overview.moneyIn")}</p>
              <p className="text-sm font-bold tabular-nums text-moss-700">
                {formatCurrency(totals.in, currency, locale)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-rose-100/60 px-3 py-2.5 rtl:flex-row-reverse">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15">
              <ArrowUpRightIcon className="size-4 text-rose-700" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-rose-700/70">{t("overview.moneyOut")}</p>
              <p className="text-sm font-bold tabular-nums text-rose-700">
                {formatCurrency(totals.out, currency, locale)}
              </p>
            </div>
          </div>
        </div>

        {/* Net flow */}
        <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
          <span className="text-xs text-muted-foreground">{t("overview.netFlow")}</span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              totals.net >= 0 ? "text-moss-700" : "text-rose-700"
            )}
          >
            {formatCurrency(totals.net, currency, locale, { signed: true })}
          </span>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CC.grid} strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={6}
              tick={{ fill: CC.axis }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={4}
              tick={{ fill: CC.axis }}
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1_000_000 ? `${formatNumber(Math.round(v / 1_000_000), locale)}M` : formatNumber(v, locale)
              }
            />
            <ChartTooltip
              cursor={{ fill: CC.cursor }}
              content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v), currency, locale)} />}
            />
            <Bar dataKey="moneyIn" fill="var(--color-moneyIn)" radius={[6, 6, 0, 0]} maxBarSize={24} />
            <Bar dataKey="moneyOut" fill="var(--color-moneyOut)" fillOpacity={0.35} radius={[6, 6, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}