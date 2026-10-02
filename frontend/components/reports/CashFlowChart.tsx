"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatMonthShort } from "@/lib/currency";
import { ChartTooltip } from "./ChartTooltip";
import { useChartColors } from "./chartColors";
import type { MonthPoint } from "@/lib/hooks/useReports";
import type { BackendCurrency } from "@/lib/currency";

export function CashFlowChart({ months, currency }: { months: MonthPoint[]; currency: BackendCurrency }) {
  const { t, locale } = useI18n();
  const CC = useChartColors();

  const data = months.map((m) => ({
    label: formatMonthShort(m.key, locale),
    cashFlow: m.cashFlow,
  }));

  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CC.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CC.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<ChartTooltip formatValue={(v) => formatCurrency(v, currency, locale)} />} />
          <Area
            type="monotone"
            dataKey="cashFlow"
            name={t("reports.cashFlow")}
            stroke={CC.primary}
            strokeWidth={2}
            fill="url(#cashFlowFill)"
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
