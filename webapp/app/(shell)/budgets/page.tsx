"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { BudgetRings } from "@/components/budgets/BudgetRings";
import { SavingsGoals } from "@/components/budgets/SavingsGoals";
import { SpendingCalendar } from "@/components/budgets/SpendingCalendar";
import { MonthProjection } from "@/components/budgets/MonthProjection";
import { Alert } from "@/components/ui/Alert";
import { PiggyBank } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { demoBudgets, demoSavingsGoals, buildDailySpending } from "@/components/budgets/demoData";

export default function BudgetsPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();

  const dailySpending = useMemo(() => buildDailySpending(9000), []);

  const monthLabel = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("nav.budgets")} title={t("nav.budgets")} description={t("budgets.monthlyBudgets")} icon={PiggyBank} />

      <WebappNotice variant="info" />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4"
      >
        <Alert variant="warning">{t("budgets.demoNotice")}</Alert>

        <BudgetRings budgets={demoBudgets} currency={business.currency} />
        <SavingsGoals goals={demoSavingsGoals} currency={business.currency} />

        <div className="grid gap-4 lg:grid-cols-2">
          <SpendingCalendar dailySpending={dailySpending} currency={business.currency} monthLabel={monthLabel} />
          <MonthProjection
            budgets={demoBudgets}
            dailySpending={dailySpending}
            currency={business.currency}
          />
        </div>
      </motion.div>
    </div>
  );
}