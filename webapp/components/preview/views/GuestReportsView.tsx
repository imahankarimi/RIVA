"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { useI18n } from "@/lib/i18n";
import { PERIOD_OPTIONS, type PeriodMonths } from "@/lib/hooks/useReports";
import {
  GuestBanner,
  PreviewChartCard,
  PreviewTextCard,
} from "@/components/preview/PreviewUI";
import { cn } from "@/lib/utils";

const PERIOD_LABEL_KEY: Record<PeriodMonths, string> = {
  3: "reports.last3Months",
  6: "reports.last6Months",
  12: "reports.last12Months",
};

/** Reports as a guest sees them: the period control and every chart frame are
 *  real; the series behind them are not requested. */
export function GuestReportsView() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<PeriodMonths>(6);

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader title={t("webapp.nav.insights")} description={t("reports.subtitle")} />

      <GuestBanner />

      <div className="space-y-5">
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

        <PreviewChartCard title={t("analytics.financialActivity")} kind="bars" cta />

        <div className="grid gap-4 sm:grid-cols-2">
          <PreviewChartCard title={t("analytics.spendingByCategory")} kind="donut" />
          <PreviewChartCard title={t("analytics.monthVsLast")} kind="bars" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PreviewChartCard title={t("analytics.recurringCharges")} kind="line" />
          <PreviewTextCard title={t("analytics.aiInsights")} lines={4} cta />
        </div>
      </div>
    </div>
  );
}
