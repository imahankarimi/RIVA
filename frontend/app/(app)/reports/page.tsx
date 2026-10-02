"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { FinancialActivityHeatmap } from "@/components/analytics/FinancialActivityHeatmap";
import { CategoryDonut } from "@/components/analytics/CategoryDonut";
import { MonthComparison } from "@/components/analytics/MonthComparison";
import { RecurringDetector } from "@/components/analytics/RecurringDetector";
import { AiInsights } from "@/components/analytics/AiInsights";
import { Alert } from "@/components/ui/Alert";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateViews";
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

export default function AnalyticsPage() {
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
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("analytics.title")} subtitle={t("analytics.subtitle")} />
      <div className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6">
        {usingDemoData && <Alert variant="warning" className="mb-4">{t("common.demoDataNotice")}</Alert>}
        {status === "loading" && <LoadingState label={t("common.loading")} />}
        {status === "error" && <ErrorState title={t("reports.loadErrorTitle")} body={error ?? t("reports.loadErrorBody")} onRetry={refetch} retryLabel={t("common.retry")} />}

        {status !== "loading" && status !== "error" && isEmpty && (
          <EmptyState title={t("reports.noData")} body={t("reports.noDataBody")} />
        )}

        {status !== "loading" && status !== "error" && !isEmpty && (
          <div className="flex flex-col gap-4">
            {/* Period selector */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-[12px] font-medium text-ink-faint">
                {t("analytics.period")}:
              </span>
              <div className="flex gap-1 rounded-lg bg-surfaceMuted p-1">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all",
                      p === period
                        ? "bg-surface text-ink shadow-subtle"
                        : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {t(PERIOD_LABEL_KEY[p])}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Row 1 — Financial Activity Heatmap */}
            <FinancialActivityHeatmap data={analytics} currency={business.currency} />

            {/* Row 2 — Donut + Month Comparison */}
            <div className="grid gap-4 lg:grid-cols-2">
              <CategoryDonut data={analytics} currency={business.currency} />
              <MonthComparison data={analytics} currency={business.currency} />
            </div>

            {/* Row 3 — Recurring + AI Insights */}
            <div className="grid gap-4 lg:grid-cols-2">
              <RecurringDetector recurring={recurring} currency={business.currency} />
              <AiInsights facts={analytics.insights} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}