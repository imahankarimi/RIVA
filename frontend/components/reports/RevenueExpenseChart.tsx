"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatMonthShort } from "@/lib/currency";
import { ChartTooltip } from "./ChartTooltip";
import { useChartColors } from "./chartColors";
import type { MonthPoint } from "@/lib/hooks/useReports";
import type { BackendCurrency } from "@/lib/currency";

export function RevenueExpenseChart({
  months,
  currency,
}: {
  months: MonthPoint[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const CC = useChartColors();

  const data = months.map((m) => ({
    label: formatMonthShort(m.key, locale),
    revenue: m.revenue,
    expenses: m.expenses,
  }));

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CC.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: CC.axis }}
            axisLine={{ stroke: CC.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CC.axis }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => (Math.abs(v) >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : String(v))}
          />
          <Tooltip
            cursor={{ fill: CC.cursor }}
            content={<ChartTooltip formatValue={(v) => formatCurrency(v, currency, locale)} />}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: CC.axis }}
            formatter={(value) => (value === "revenue" ? t("reports.revenue") : t("reports.expenses"))}
          />
          <Bar
            dataKey="revenue"
            name={t("reports.revenue")}
            fill={CC.revenue}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="expenses"
            name={t("reports.expenses")}
            fill={CC.expenses}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={100}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
