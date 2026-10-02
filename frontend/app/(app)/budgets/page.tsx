"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { BudgetRings } from "@/components/budgets/BudgetRings";
import { SavingsGoals } from "@/components/budgets/SavingsGoals";
import { SpendingCalendar } from "@/components/budgets/SpendingCalendar";
import { MonthProjection } from "@/components/budgets/MonthProjection";
import { Alert } from "@/components/ui/Alert";
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
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.budgets")} subtitle={t("budgets.monthlyBudgets")} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6 xl:max-w-[1400px]">
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
      </main>
    </div>
  );
}