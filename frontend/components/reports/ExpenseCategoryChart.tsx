"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { ChartTooltip } from "./ChartTooltip";
import { useChartColors } from "./chartColors";
import type { CategoryPoint } from "@/lib/hooks/useReports";
import type { BackendCurrency } from "@/lib/currency";
import { translateCategory } from "@/lib/i18n/labels";

export function ExpenseCategoryChart({
  categories,
  currency,
}: {
  categories: CategoryPoint[];
  currency: BackendCurrency;
}) {
  const { locale, t } = useI18n();
  const CC = useChartColors();

  const chartCategories = categories.map((entry) => ({
  ...entry,
  category: translateCategory(entry.category, t),
}));

  const height = Math.max(categories.length * 40, 120);

  return (
    <div style={{ height }} className="w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartCategories}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CC.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: CC.axis }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (Math.abs(v) >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : String(v))}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12, fill: CC.ink }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            cursor={{ fill: CC.cursor }}
            content={<ChartTooltip formatValue={(v) => formatCurrency(v, currency, locale)} />}
          />
          <Bar
            dataKey="amount"
            name={""}
            radius={[0, 4, 4, 0]}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          >
            {categories.map((entry, i) => (
              <Cell key={entry.category} fill={CC.category[i % CC.category.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
