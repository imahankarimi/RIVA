"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Sparkle, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useOverview } from "@/lib/hooks/useOverview";
import { useReports, momTrend } from "@/lib/hooks/useReports";
import { formatCurrency } from "@/lib/currency";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { usePullToRefresh } from "@/lib/mobile-ux";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const WELCOME_KEYS = ["webapp.home.welcome1", "webapp.home.welcome2", "webapp.home.welcome3"] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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

export default function HomePage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const { user } = useAuth();
  const { stats, recentTransactions, status, error, usingDemoData, refetch } = useOverview(
    business?.id ?? null
  );
  const reports = useReports(business?.id ?? null);

  // Pull-to-refresh functionality
  const { containerRef, isRefreshing, pullDistance, refreshProgress } = usePullToRefresh(
    async () => {
      await refetch();
    },
    status !== "loading"
  );

  const name = user?.firstName || business?.name || "";

  function formatMoney(value: number, opts: { signed?: boolean } = {}) {
    return formatCurrency(value, business.currency, locale, opts);
  }

  const hash = (name || "guest").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const welcomeKey: string = WELCOME_KEYS[hash % WELCOME_KEYS.length] ?? WELCOME_KEYS[0];

  return (
    <div
      ref={containerRef as any}
      className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6"
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2"
        style={{
          opacity: isRefreshing ? 1 : Math.min(refreshProgress, 0.8),
          transform: `translateX(-50%) scale(${isRefreshing ? 1 : Math.min(refreshProgress, 1)})`,
          transition: isRefreshing ? 'all 0.2s ease-out' : 'none',
        }}
      >
        <div className={cn(
          "rounded-full bg-surface p-2.5 shadow-lg ring-1 ring-line/60",
          isRefreshing && "animate-spin"
        )}>
          <RefreshCw size={18} className="text-signal-500" />
        </div>
      </div>

      <WebappHeader
        eyebrow={greeting()}
        title={name ? `${t(welcomeKey)}, ${name}` : undefined}
        description={t("webapp.home.tagline")}
      />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState
          title={t("overview.loadErrorTitle")}
          body={error ?? t("overview.loadErrorBody")}
          onRetry={refetch}
          retryLabel={t("common.retry")}
        />
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {/* KPI row — enhanced depth and spacing */}
          {status === "loading" ? (
            <KpiSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
              <StatCard
                label={t("overview.balance")}
                value={stats.balance}
                format={(v) => formatMoney(v)}
                icon={Wallet}
                delay={0}
              />
              <StatCard
                label="Revenue"
                value={stats.revenue}
                format={(v) => formatMoney(v)}
                icon={TrendingUp}
                tone="positive"
                trendPct={momTrend(reports.data.months, "revenue")}
                trendLabel="vs last month"
                delay={0.04}
              />
              <StatCard
                label="Expenses"
                value={stats.expenses}
                format={(v) => formatMoney(v)}
                icon={TrendingDown}
                tone="negative"
                trendPct={momTrend(reports.data.months, "expenses")}
                trendLabel="vs last month"
                invertTrendColor
                delay={0.08}
              />
              <StatCard
                label="Cash flow"
                value={stats.cashFlow}
                format={(v) => formatMoney(v)}
                icon={ArrowLeftRight}
                tone={stats.cashFlow >= 0 ? "positive" : "negative"}
                delay={0.12}
              />
            </div>
          )}

          {/* RIVA AI entry — refined with better depth and hierarchy */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.16, ease: EASE_OUT }}
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
              {status === "loading" ? (
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
                                  tx.amount > 0 ? "text-moss-700" : "text-ink"
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
        </div>
      )}
    </div>
  );
}
