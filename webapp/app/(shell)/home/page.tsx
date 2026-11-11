"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Sparkle, ChevronRight, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useOverview } from "@/lib/hooks/useOverview";
import { useReports, momTrend } from "@/lib/hooks/useReports";
import { formatCurrency } from "@/lib/currency";
import { StatCard } from "@/components/dashboard/StatCard";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { HealthScoreCard } from "@/components/dashboard/HealthScore";
import { AccountCards } from "@/components/dashboard/AccountCards";
import { MoneyMovement } from "@/components/dashboard/MoneyMovement";
import { ExpenseCategoryChart } from "@/components/reports/ExpenseCategoryChart";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { usePullToRefresh } from "@/lib/mobile-ux";
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function DashboardLoading() {
  const blocks: [string, number][] = [
    ["col-span-12 sm:col-span-6", 6],
    ["col-span-12 sm:col-span-6", 4],
    ["col-span-12 sm:col-span-4", 4],
    ["col-span-12 sm:col-span-4", 4],
    ["col-span-12 sm:col-span-4", 3],
    ["col-span-12", 8],
  ];
  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      {blocks.map(([span, lines], index) => (
        <div key={index} className={span}>
          <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
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

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[18px] bg-surface p-4 shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60 sm:p-5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3.5 h-6 w-24" />
        </div>
      ))}
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

export default function HomePage() {
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
  // Kept separate from the parent ternary so the restored Recent Transactions
  // markup can retain its original loading branch without TS narrowing it away.
  const isLoading = status === "loading";

  // Pull-to-refresh functionality
  const { isRefreshing, pullDistance, pullState, refreshProgress } = usePullToRefresh(
    async () => {
      await refetch();
    },
    status !== "loading"
  );

  function formatMoney(value: number, opts: { signed?: boolean } = {}) {
    return formatCurrency(value, business.currency, locale, opts);
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      {/* Pull-to-refresh indicator — positioned above topbar, never clipped */}
      <div
        className="pointer-events-none fixed left-1/2 top-12 z-[100] -translate-x-1/2"
        style={{
          opacity: pullState === 'idle' && !isRefreshing ? 0 : 1,
          transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.5, 40)}px)`,
          transition: pullState === 'idle' ? 'opacity 0.3s ease-out, transform 0.3s ease-out' : 'none',
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface shadow-lg ring-1 transition-all duration-200",
            pullState === 'ready' && !isRefreshing && "scale-110 ring-signal-500/40",
            pullState === 'pulling' && "ring-line/60",
            (pullState === 'refreshing' || isRefreshing) && "ring-signal-500/40",
          )}
          style={{
            width: 48,
            height: 48,
          }}
        >
          <RefreshCw
            size={20}
            className={cn(
              "transition-all duration-200",
              pullState === 'ready' && !isRefreshing && "text-signal-500",
              pullState === 'pulling' && "text-ink-soft",
              (pullState === 'refreshing' || isRefreshing) && "animate-spin text-signal-500",
            )}
            style={{
              transform: pullState === 'pulling' ? `rotate(${refreshProgress * 180}deg)` : undefined,
            }}
          />
        </div>
      </div>

      <WebappHeader
        title={t("webapp.nav.overview")}
        action={
          <button
            onClick={openAddIncome}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-500 text-onSignal shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 sm:h-[52px] sm:w-[52px]"
            aria-label={t("addIncome.title")}
          >
            <Plus size={24} strokeWidth={2.5} className="sm:h-7 sm:w-7" />
          </button>
        }
      />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState
          title={t("overview.loadErrorTitle")}
          body={error ?? t("overview.loadErrorBody")}
          onRetry={refetch}
          retryLabel={t("common.retry")}
        />
      ) : status === "loading" ? (
        <div className="space-y-6 sm:space-y-7">
          <KpiSkeleton />
          <DashboardLoading />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {/* KPI row with enhanced visual hierarchy */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              <StatCard
                label={t("overview.balance")}
                value={stats.balance}
                format={(v) => formatMoney(v)}
                icon={Wallet}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.04, ease: EASE_OUT }}
            >
              <StatCard
                label={t("overview.revenue")}
                value={stats.revenue}
                format={(v) => formatMoney(v)}
                icon={TrendingUp}
                tone="positive"
                trendPct={momTrend(reports.data.months, "revenue")}
                trendLabel={t("overview.vsLastMonth")}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: EASE_OUT }}
            >
              <StatCard
                label={t("overview.expenses")}
                value={stats.expenses}
                format={(v) => formatMoney(v)}
                icon={TrendingDown}
                tone="negative"
                trendPct={momTrend(reports.data.months, "expenses")}
                trendLabel={t("overview.vsLastMonth")}
                invertTrendColor
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.12, ease: EASE_OUT }}
            >
              <StatCard
                label={t("overview.cashFlow")}
                value={stats.cashFlow}
                format={(v) => formatMoney(v)}
                icon={ArrowLeftRight}
                tone={stats.cashFlow >= 0 ? "positive" : "negative"}
                trendPct={momTrend(reports.data.months, "cashFlow")}
                trendLabel={t("overview.vsLastMonth")}
              />
            </motion.div>
          </div>

          {/* Enhanced widget grid with refined spacing */}
          <div className="grid grid-cols-12 gap-4 sm:gap-5">
            {/* Row 1 — Financial Overview and Health Score */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.16, ease: EASE_OUT }}
              className="col-span-12 sm:col-span-6"
            >
              {reports.isEmpty ? (
                <Card className="min-h-[260px]">
                  <CardContentEmpty title={t("overview.noChartData")} body={t("overview.noChartDataBody")} />
                </Card>
              ) : (
                <FinancialOverview months={reports.data.months} currency={business.currency} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.2, ease: EASE_OUT }}
              className="col-span-12 sm:col-span-6"
            >
              <HealthScoreCard stats={stats} />
            </motion.div>

            {/* Row 2 — Account Cards, Money Movement, Expense Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.24, ease: EASE_OUT }}
              className="col-span-12 sm:col-span-4"
            >
              <AccountCards accounts={accounts} currency={business.currency} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.28, ease: EASE_OUT }}
              className="col-span-12 sm:col-span-4"
            >
              {reports.isEmpty ? (
                <Card className="min-h-[260px]">
                  <CardContentEmpty title={t("overview.noChartData")} />
                </Card>
              ) : (
                <MoneyMovement months={reports.data.months} currency={business.currency} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.32, ease: EASE_OUT }}
              className="col-span-12 sm:col-span-4"
            >
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
            </motion.div>

            {/* Row 3 — Recent Transactions (restored from a08bec3) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.36, ease: EASE_OUT }}
              className="col-span-12"
            >
              {/* Recent transactions — enhanced card design */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-[16px] font-semibold text-ink sm:text-[17px]">
                      {t("overview.recentTransactions")}
                    </h2>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                      Latest activity in your business
                    </p>
                  </div>
                  <Link
                    href="/cash"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold text-signal-500 transition-all hover:bg-signal-50 hover:text-signal-600 active:scale-95"
                  >
                    {t("common.seeAll")}
                    <ChevronRight size={14} strokeWidth={2.5} className="rtl:rotate-180" />
                  </Link>
                </div>

                <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60">
                  {isLoading ? (
                    <div className="divide-y divide-line-soft/60">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3.5 px-4 py-4 sm:px-5">
                          <Skeleton className="h-11 w-11 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {recentTransactions.length > 0 ? (
                        <div className="divide-y divide-line-soft/60">
                          {recentTransactions.map((tx, i) => (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.24, ease: EASE_OUT }}
                              className="group cursor-pointer px-4 py-4 transition-colors active:bg-surfaceMuted/40 sm:px-5 sm:hover:bg-surfaceMuted/30"
                            >
                              <div className="flex items-center gap-3.5">
                                {/* Enhanced icon with better visual weight */}
                                <span
                                  className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-all group-hover:scale-105 sm:h-12 sm:w-12",
                                    tx.amount > 0
                                      ? "bg-moss-100 text-moss-700 ring-moss-200/40"
                                      : "bg-signal-50 text-signal-600 ring-signal-100/40"
                                  )}
                                >
                                  {tx.amount > 0 ? (
                                    <TrendingUp size={18} strokeWidth={2.2} />
                                  ) : (
                                    <TrendingDown size={18} strokeWidth={2.2} />
                                  )}
                                </span>

                                {/* Content with improved spacing */}
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <p className="truncate text-[13.5px] font-medium leading-tight text-ink">
                                    {tx.description}
                                  </p>
                                  <span className="inline-block rounded-lg bg-surfaceMuted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                                    {tx.category}
                                  </span>
                                </div>

                                {/* Amount with enhanced typography */}
                                <div className="text-right">
                                  <p
                                    className={cn(
                                      "font-mono font-figures text-[14px] font-semibold tabular-nums sm:text-[14.5px]",
                                      tx.amount > 0 ? "text-moss-700" : "text-rose-500"
                                    )}
                                  >
                                    {formatMoney(tx.amount, { signed: true })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-12 text-center text-[13px] text-ink-faint">
                          {t("overview.noTransactionsBody")}
                        </p>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </section>
            </motion.div>

            {/* RIVA AI Card — unique to webapp */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.4, ease: EASE_OUT }}
              className="col-span-12"
            >
              <Link
                href="/assistant"
                className="group relative flex min-h-[160px] flex-col items-start gap-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-deep-navy to-deep-navy/95 p-6 shadow-[0_8px_32px_-8px_rgba(16,28,44,0.5),0_1px_2px_rgba(16,28,44,0.1)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_12px_48px_-12px_rgba(16,28,44,0.6),0_2px_4px_rgba(16,28,44,0.15)] active:scale-[0.99] sm:min-h-[180px] sm:p-7"
              >
                {/* Refined gradient overlay */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_-15%,rgba(113,135,155,0.5),transparent_65%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />

                {/* Content */}
                <div className="relative z-10 flex w-full flex-col gap-3.5 sm:gap-4">
                  {/* Eyebrow with enhanced spacing */}
                  <div className="flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-warm-white/75">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm-white/15 backdrop-blur-sm">
                      <Sparkle size={14} strokeWidth={2.5} className="text-steel-blue" />
                    </div>
                    <span>RIVA AI</span>
                  </div>

                  {/* Title with improved typography */}
                  <p className="max-w-lg font-display text-[20px] font-bold leading-[1.3] text-warm-white sm:text-[22px] sm:leading-[1.28]">
                    {t("webapp.home.aiTitle")}
                  </p>

                  {/* Body with enhanced readability */}
                  <p className="max-w-md text-[13px] leading-[1.6] text-warm-white/75 sm:text-[13.5px]">
                    {t("webapp.home.aiBody")}
                  </p>

                  {/* CTA button with better visual weight */}
                  <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-warm-white/20 px-4 py-2.5 text-[12.5px] font-semibold text-warm-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-1 ring-inset ring-warm-white/20 backdrop-blur-sm transition-all duration-200 group-hover:bg-warm-white/25 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] sm:text-[13px]">
                    {t("webapp.nav.assistant")}
                    <ChevronRight size={14} strokeWidth={2.5} className="rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
