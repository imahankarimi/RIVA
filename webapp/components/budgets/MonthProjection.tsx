"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/Chart";
import { Area, AreaChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/currency";
import type { DemoBudget } from "./demoData";
import type { BackendCurrency } from "@/lib/currency";

/**
 * Month Projection — ported from the reference's Month Projection card:
 * a cumulative-spend projection vs. the daily budget burn line, with an
 * on-track / over-budget status and stat tiles.
 */
export function MonthProjection({ budgets, dailySpending, currency }: { budgets: DemoBudget[]; dailySpending: { day: number; amount: number }[]; currency: BackendCurrency }) {
  const { locale, t } = useI18n();

  const chartConfig: ChartConfig = {
    cumulative: { label: t("budgets.spendSoFar"), color: "var(--color-primary)" },
  };

  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
    const totalSpent = dailySpending.reduce((s, d) => s + d.amount, 0);
    const spentDays = dailySpending.filter((d) => d.amount > 0).length;
    const avgDaily = spentDays > 0 ? totalSpent / spentDays : 0;
    const daysLeft = Math.max(0, 28 - spentDays);
    const projected = totalSpent + avgDaily * daysLeft;
    const overBudget = projected > totalBudget;

    const chartData: { day: number; cumulative: number; budget: number }[] = [];
    let running = 0;
    dailySpending.forEach((d, i) => {
      running += d.amount;
      chartData.push({
        day: d.day,
        cumulative: running,
        budget: (totalBudget / 28) * (i + 1),
      });
    });

    return { totalBudget, totalSpent, avgDaily, daysLeft, projected, overBudget, chartData };
  }, [budgets, dailySpending]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("budgets.monthProjection")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            stats.overBudget ? "bg-destructive/10 text-destructive" : "bg-moss-100 text-moss-700"
          )}
        >
          {stats.overBudget ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
          {stats.overBudget ? t("budgets.projectedOver") : t("budgets.onTrack")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("budgets.daysLeft")} value={String(stats.daysLeft)} />
          <Stat label={t("budgets.avgPerDay")} value={formatCurrency(Math.round(stats.avgDaily), currency, locale)} />
          <Stat label={t("budgets.spentSoFar")} value={formatCurrency(stats.totalSpent, currency, locale)} />
          <Stat
            label={t("budgets.projected")}
            value={formatCurrency(Math.round(stats.projected), currency, locale)}
            tone={stats.overBudget ? "danger" : "default"}
          />
        </div>

        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <AreaChart data={stats.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} tickMargin={4} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickMargin={4}
              tickFormatter={(v: number) => formatNumber(v, locale)}
            />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v), currency, locale)} />} />
            <ReferenceLine y={stats.totalBudget} stroke="var(--chart-5)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area dataKey="budget" type="linear" stroke="var(--chart-3)" strokeOpacity={0.25} strokeDasharray="4 4" fill="transparent" dot={false} />
            <Area dataKey="cumulative" type="monotone" stroke="var(--color-primary)" strokeWidth={2} fill="url(#fillSpend)" dot={false} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", tone === "danger" ? "text-destructive" : "text-foreground")}>{value}</p>
    </div>
  );
}