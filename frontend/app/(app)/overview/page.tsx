"use client";

import { ArrowLeftRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/dashboard/StatCard";
import { StaggerContainer, StaggerItem } from "@/components/motion/Stagger";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { ExpenseCategoryChart } from "@/components/reports/ExpenseCategoryChart";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { MoneyMovement } from "@/components/dashboard/MoneyMovement";
import { HealthScoreCard } from "@/components/dashboard/HealthScore";
import { AccountCards } from "@/components/dashboard/AccountCards";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { useI18n } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useOverview } from "@/lib/hooks/useOverview";
import { useReports, momTrend } from "@/lib/hooks/useReports";
import { formatCurrency } from "@/lib/currency";

function DashboardLoading() {
  const blocks: [string, number][] = [
    ["col-span-12 lg:col-span-8", 6],
    ["col-span-12 lg:col-span-4", 4],
    ["col-span-12 lg:col-span-4", 4],
    ["col-span-12 lg:col-span-4", 4],
    ["col-span-12 lg:col-span-4", 3],
    ["col-span-12", 8],
  ];
  return (
    <div className="grid grid-cols-12 gap-4">
      {blocks.map(([span, lines], index) => (
        <div key={index} className={span}>
          <div className="rounded-xl bg-card p-4 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const { user } = useAuth();
  const { openAddIncome } = useAddIncome();

  const {
    stats,
    recentTransactions,
    accounts,
    status,
    error,
    usingDemoData,
    refetch,
  } = useOverview(business?.id ?? null);

  const reports = useReports(business?.id ?? null);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.overview")} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6 xl:max-w-[1400px]">
        <div className="space-y-6">
          {/* Page heading */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-ink-faint">
                {(() => {
                  const h = new Date().getHours();
                  if (h < 12) return t("overview.greetingMorning");
                  if (h < 18) return t("overview.greetingAfternoon");
                  return t("overview.greetingEvening");
                })()}
                , {user?.firstName || business.name}
              </p>
              <h2 className="mt-0.5 font-display text-[21px] font-bold tracking-tight text-ink sm:text-[24px]">
                {t("nav.overview")}
              </h2>
            </div>

            <InteractiveHoverButton
              text={t("overview.logTransaction")}
              type="button"
              onClick={openAddIncome}
            />
          </motion.div>

          {usingDemoData && status !== "loading" && (
            <Alert variant="warning">{t("common.demoDataNotice")}</Alert>
          )}

          {status === "error" ? (
            <ErrorState
              title={t("overview.loadErrorTitle")}
              body={error ?? t("overview.loadErrorBody")}
              onRetry={refetch}
              retryLabel={t("common.retry")}
            />
          ) : status === "loading" ? (
            <DashboardLoading />
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              {/* KPI row — the reference's Financial Overview pill legend sits
                  inside the chart card; keep the RIVA KPI row for the headline
                  numbers these widgets drill into. */}
              <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <StaggerItem>
                  <StatCard
                    label={t("overview.balance")}
                    value={stats.balance}
                    format={(v) => formatCurrency(v, business.currency, locale)}
                    icon={Wallet}
                  />
                </StaggerItem>

                <StaggerItem>
                  <StatCard
                    label={t("overview.revenue")}
                    value={stats.revenue}
                    format={(v) => formatCurrency(v, business.currency, locale)}
                    icon={TrendingUp}
                    tone="positive"
                    trendPct={momTrend(reports.data.months, "revenue")}
                    trendLabel={t("overview.vsLastMonth")}
                  />
                </StaggerItem>

                <StaggerItem>
                  <StatCard
                    label={t("overview.expenses")}
                    value={stats.expenses}
                    format={(v) => formatCurrency(v, business.currency, locale)}
                    icon={TrendingDown}
                    tone="negative"
                    trendPct={momTrend(reports.data.months, "expenses")}
                    trendLabel={t("overview.vsLastMonth")}
                    invertTrendColor
                  />
                </StaggerItem>

                <StaggerItem>
                  <StatCard
                    label={t("overview.cashFlow")}
                    value={stats.cashFlow}
                    format={(v) => formatCurrency(v, business.currency, locale)}
                    icon={ArrowLeftRight}
                    tone={stats.cashFlow >= 0 ? "positive" : "negative"}
                    trendPct={momTrend(reports.data.months, "cashFlow")}
                    trendLabel={t("overview.vsLastMonth")}
                  />
                </StaggerItem>
              </StaggerContainer>

              {/* Widget grid — 12-col grid with balanced row heights:
                  Row 1: FinancialOverview (6) + HealthScoreCard (6)  — both ~350px
                  Row 2: AccountCards (4) + MoneyMovement (4) + ExpenseBreakdown (4) — ~250/350/250
                  Row 3: RecentTransactionsTable (12) */}
              <div className="grid grid-cols-12 gap-4">
                {/* Row 1 — two tall cards, equal split */}
                <div className="col-span-12 lg:col-span-6">
                  {reports.isEmpty ? (
                    <Card className="min-h-[260px]">
                      <CardContentEmpty title={t("overview.noChartData")} body={t("overview.noChartDataBody")} />
                    </Card>
                  ) : (
                    <FinancialOverview months={reports.data.months} currency={business.currency} />
                  )}
                </div>

                <div className="col-span-12 lg:col-span-6">
                  <HealthScoreCard stats={stats} />
                </div>

                {/* Row 2 — three equal columns */}
                <div className="col-span-12 lg:col-span-4">
                  <AccountCards accounts={accounts} currency={business.currency} />
                </div>

                <div className="col-span-12 lg:col-span-4">
                  {reports.isEmpty ? (
                    <Card className="min-h-[260px]">
                      <CardContentEmpty title={t("overview.noChartData")} />
                    </Card>
                  ) : (
                    <MoneyMovement months={reports.data.months} currency={business.currency} />
                  )}
                </div>

                <div className="col-span-12 lg:col-span-4">
                  <Card className="flex h-full flex-col p-0">
                    <CardHeader className="flex flex-row items-center justify-between px-5 pt-4">
                      <CardTitle className="text-[14.5px] font-bold">{t("overview.expenseBreakdown")}</CardTitle>
                      <CardAction>
                        <Link href="/reports">
                          <Button variant="ghost" size="sm" className="h-8 text-xs">
                            {t("common.seeAll")}
                          </Button>
                        </Link>
                      </CardAction>
                    </CardHeader>
                    <div className="flex-1 pr-4 pt-0">
                      {reports.data.categories.length === 0 ? (
                        <EmptyState title={t("overview.noChartData")} />
                      ) : (
                        <ExpenseCategoryChart categories={reports.data.categories.slice(0, 5)} currency={business.currency} />
                      )}
                    </div>
                  </Card>
                </div>

                {/* Row 3 — full-width detail table */}
                <div className="col-span-12">
                  <RecentTransactionsTable transactions={recentTransactions} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CardContentEmpty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[13.5px] font-medium text-ink">{title}</p>
      {body && <p className="max-w-xs text-[12.5px] text-ink-faint">{body}</p>}
    </div>
  );
}