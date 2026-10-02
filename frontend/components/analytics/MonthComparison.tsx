"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTooltip } from "@/components/reports/ChartTooltip";
import { useChartColors } from "@/components/reports/chartColors";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatCurrency, type BackendCurrency } from "@/lib/currency";
import { monthLabelOf, type AnalyticsData } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function toPersian(input: string): string {
  return input.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** Compact axis label — 84,500,000 → "84.5M" (English) / "۸۴.۵M" (Persian). */
function compactAxis(value: number, locale: Locale): string {
  const abs = Math.abs(value);
  const tiers = [
    { n: 1e9, s: "B" },
    { n: 1e6, s: "M" },
    { n: 1e3, s: "K" },
  ];
  for (const { n, s } of tiers) {
    if (abs >= n) {
      const v = (value / n).toFixed(abs >= 100 * n ? 0 : 1);
      const digits = locale === "fa" ? toPersian(v.replace(/\.0$/, "")) : v.replace(/\.0$/, "");
      return `${digits}${s}`;
    }
  }
  const v = String(Math.round(value));
  return locale === "fa" ? toPersian(v) : v;
}

interface Row {
  category: string;
  thisMonth: number;
  lastMonth: number;
}

/** Recharts LabelList content — annotated the reference-style % change above the bar. */
function ChangeLabel(props: Record<string, unknown>) {
  const { x, y, width, index, rows } = props as {
    x: number;
    y: number;
    width: number;
    index: number;
    rows?: Row[];
  };
  const row = rows?.[index ?? 0];
  if (!row || row.lastMonth === 0) return null;
  const pct = Math.round(((row.thisMonth - row.lastMonth) / row.lastMonth) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      className={cn(
        "text-[10px] font-medium tabular-nums",
        isUp ? "fill-rose-500" : "fill-moss-500"
      )}
    >
      {isUp ? "+" : ""}
      {pct}%
    </text>
  );
}

export function MonthComparison({
  data,
  currency,
}: {
  data: AnalyticsData;
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const CC = useChartColors();

  const { rows, thisMonthTotal, lastMonthTotal, thisMonthLabel, lastMonthLabel } =
    useMemo(() => {
      const now = new Date();
      const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

      const cVal = data.expenseByMonth.get(cur) ?? 0;
      const pVal = data.expenseByMonth.get(prev) ?? 0;

      if (cVal === 0 && pVal === 0) {
        return {
          rows: [],
          thisMonthTotal: 0,
          lastMonthTotal: 0,
          thisMonthLabel: cur,
          lastMonthLabel: prev,
        };
      }

      return {
        rows: [
          {
            category: monthLabelOf(cur, locale),
            thisMonth: cVal,
            lastMonth: pVal,
          },
        ],
        thisMonthTotal: cVal,
        lastMonthTotal: pVal,
        thisMonthLabel: cur,
        lastMonthLabel: prev,
      };
    }, [data, locale]);

  const changePct = useMemo(() => {
    if (lastMonthTotal === 0) return null;
    return Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
  }, [thisMonthTotal, lastMonthTotal]);

  if (rows.length === 0) {
    return (
      <Card className="flex min-h-[280px] flex-col items-center justify-center px-5 py-8 text-center">
        <p className="text-[13.5px] font-medium text-ink">
          {t("analytics.monthVsLast")}
        </p>
        <p className="mt-1 max-w-xs text-[12.5px] text-ink-soft">
          {t("analytics.emptySpendBody")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line-soft px-5 py-4">
        <div>
          <h3 className="font-display text-[14.5px] font-bold text-ink">
            {t("analytics.monthVsLast")}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {t("analytics.thisMonth")}{" "}
              <span className="font-mono font-figures font-medium text-ink">
                {formatCurrency(thisMonthTotal, currency, locale)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              {t("analytics.lastMonth")}{" "}
              <span className="font-mono font-figures font-medium text-ink">
                {formatCurrency(lastMonthTotal, currency, locale)}
              </span>
            </span>
          </div>
        </div>
        {changePct !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
              changePct > 0
                ? "bg-rose-100/70 text-rose-700"
                : "bg-moss-100/70 text-moss-700"
            )}
          >
            {changePct > 0 ? "+" : ""}
            {changePct}%
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="h-[280px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={CC.grid}
            />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
              tick={{ fill: CC.axis }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
              width={52}
              tick={{ fill: CC.axis }}
              tickFormatter={(v) => compactAxis(v, locale)}
            />
            <Tooltip
              cursor={{ fill: CC.cursor }}
              content={
                <ChartTooltip
                  formatValue={(v) => formatCurrency(v, currency, locale)}
                />
              }
            />
            <Bar
              dataKey="lastMonth"
              name={t("analytics.lastMonth")}
              fill={CC.axis}
              fillOpacity={0.3}
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="thisMonth"
              name={t("analytics.thisMonth")}
              fill={CC.primary}
              radius={[4, 4, 0, 0]}
              barSize={18}
            >
              <LabelList dataKey="thisMonth" content={<ChangeLabel rows={rows} />} />
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}