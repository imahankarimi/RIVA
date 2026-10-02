"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { FinancialActivityHeatmap } from "@/components/analytics/FinancialActivityHeatmap";
import { CategoryDonut } from "@/components/analytics/CategoryDonut";
import { MonthComparison } from "@/components/analytics/MonthComparison";
import { RecurringDetector } from "@/components/analytics/RecurringDetector";
import { AiInsights } from "@/components/analytics/AiInsights";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useReports, PERIOD_OPTIONS, type PeriodMonths } from "@/lib/hooks/useReports";
import { deriveAnalytics, detectRecurring } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PERIOD_LABEL_KEY: Record<PeriodMonths, string> = {
  3: "reports.last3Months",
  6: "reports.last6Months",
  12: "reports.last12Months",
};

export default function ReportsPage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const [period, setPeriod] = useState<PeriodMonths>(6);

  const { data, transactions, status, error, usingDemoData, refetch, isEmpty } =
    useReports(business?.id ?? null, period);

  const windowStart = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - period);
    return d;
  }, [period]);

  const analytics = useMemo(
    () => deriveAnalytics(transactions, windowStart),
    [transactions, windowStart]
  );

  const recurring = useMemo(
    () => detectRecurring(transactions),
    [transactions]
  );

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader
        eyebrow={t("webapp.nav.more")}
        title={t("analytics.title")}
        description={t("analytics.subtitle")}
        icon={BarChart3}
      />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState
          title={t("reports.loadErrorTitle")}
          body={error ?? t("reports.loadErrorBody")}
          onRetry={refetch}
          retryLabel={t("common.retry")}
        />
      ) : isEmpty ? (
        <EmptyState title={t("reports.noData")} body={t("reports.noDataBody")} />
      ) : (
        <div className="space-y-5">
          {/* Period selector */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3"
          >
            <span className="text-[12px] font-medium text-ink-faint">
              {t("analytics.period")}:
            </span>
            <div className="flex gap-1 rounded-md bg-surfaceMuted p-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all sm:text-[12px]",
                    p === period
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  {t(PERIOD_LABEL_KEY[p])}
                </button>
              ))}
            </div>
          </motion.div>

          {status === "loading" ? (
            <div className="space-y-4">
              <div className="h-64 rounded-2xl bg-surface" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-72 rounded-2xl bg-surface" />
                <div className="h-72 rounded-2xl bg-surface" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Row 1 — Financial Activity Heatmap */}
              <FinancialActivityHeatmap data={analytics} currency={business.currency} />

              {/* Row 2 — Donut + Month Comparison */}
              <div className="grid gap-4 sm:grid-cols-2">
                <CategoryDonut data={analytics} currency={business.currency} />
                <MonthComparison data={analytics} currency={business.currency} />
              </div>

              {/* Row 3 — Recurring + AI Insights */}
              <div className="grid gap-4 sm:grid-cols-2">
                <RecurringDetector recurring={recurring} currency={business.currency} />
                <AiInsights facts={analytics.insights} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
