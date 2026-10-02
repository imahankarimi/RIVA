"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useChartColors } from "@/components/reports/chartColors";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, type BackendCurrency } from "@/lib/currency";
import type { AnalyticsCategory, AnalyticsData } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

const MAX_SLICES = 6;

interface Subslice {
  name: string;
  value: number;
  tx: Transaction | null;
}

function CustomTooltip({
  active,
  payload,
  currency,
  locale,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  currency: BackendCurrency;
  locale: "en" | "fa";
}) {
  if (!active || !payload || !payload[0]) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-md bg-signal-500 px-2.5 py-1.5 text-[12px] font-medium text-onSignal shadow-lg">
      <div className="font-semibold">{name}</div>
      <div className="tabular-nums">{formatCurrency(value, currency, locale)}</div>
    </div>
  );
}

/** Top-N constituent transactions of a category, folding the tail into "Other". */
function subcategorySlices(category: AnalyticsCategory): Subslice[] {
  const sorted = [...category.transactions].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
  );

  if (sorted.length <= MAX_SLICES) {
    return sorted.map((tx) => ({
      name: tx.description,
      value: Math.abs(tx.amount),
      tx,
    }));
  }

  const head = sorted.slice(0, MAX_SLICES - 1);
  const tail = sorted.slice(MAX_SLICES - 1);
  return [
    ...head.map((tx) => ({ name: tx.description, value: Math.abs(tx.amount), tx })),
    {
      name: "Other",
      value: tail.reduce((s, t) => s + Math.abs(t.amount), 0),
      tx: null,
    },
  ];
}

export function CategoryDonut({
  data,
  currency,
}: {
  data: AnalyticsData;
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const CC = useChartColors();
  const [selected, setSelected] = useState<string | null>(null);

  const categories = data.categories.slice(0, 5);
  const activeCategory =
    categories.find((c) => c.name === selected) ?? null;

  const topLevelData = useMemo(
    () =>
      categories.map((c, i) => ({
        name: c.name,
        value: c.amount,
        fill: CC.category[i % CC.category.length],
      })),
    [categories, CC.category]
  );

  const slices = useMemo(
    () => (activeCategory ? subcategorySlices(activeCategory) : []),
    [activeCategory]
  );

  const drillData = useMemo(
    () =>
      slices.map((s, i) => ({
        name: s.name,
        value: s.value,
        fill: CC.category[i % CC.category.length],
      })),
    [slices, CC.category]
  );

  const pieData = selected ? drillData : topLevelData;
  const centerAmount = activeCategory
    ? activeCategory.amount
    : data.totalExpense;
  const centerLabel = activeCategory
    ? t("analytics.categoryTotal")
    : t("analytics.totalSpent");

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-line-soft px-5 py-4">
        <h3 className="font-display text-[14.5px] font-bold text-ink">
          {activeCategory
            ? activeCategory.name
            : t("analytics.spendingByCategory")}
        </h3>
        {activeCategory && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[12px]"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft className="size-3 flip-rtl" />
            {t("analytics.backToAll")}
          </Button>
        )}
      </div>

      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected ?? "all"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-auto aspect-square h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={110}
                strokeWidth={2}
                stroke="var(--color-card)"
                paddingAngle={2}
                onClick={(entry, index) => {
                  if (!selected) setSelected(String(entry.name));
                }}
                className={selected ? "" : "cursor-pointer"}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip currency={currency} locale={locale} />}
              />
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink font-display text-[22px] font-bold tabular-nums"
              >
                {formatCurrency(centerAmount, currency, locale)}
              </text>
              <text
                x="50%"
                y="57%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink-faint text-[12px]"
              >
                {centerLabel}
              </text>
            </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        {/* Legend / drill-down list */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          {(activeCategory ? slices : categories).map((row, i) => {
            const fill = CC.category[i % CC.category.length];
            const value = "value" in row ? row.value : row.amount;
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: fill }}
                />
                <span className="truncate text-ink-soft">{row.name}</span>
                <span className="ml-auto font-mono font-figures font-medium text-ink">
                  {formatCurrency(value, currency, locale)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}