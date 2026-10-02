"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Sparkle, ChevronRight } from "lucide-react";
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line sm:p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-5 w-24" />
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

  const name = user?.firstName || business?.name || "";

  function formatMoney(value: number, opts: { signed?: boolean } = {}) {
    return formatCurrency(value, business.currency, locale, opts);
  }

  const hash = (name || "guest").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const welcomeKey: string = WELCOME_KEYS[hash % WELCOME_KEYS.length] ?? WELCOME_KEYS[0];

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={greeting()} title={name ? `${t(welcomeKey)}, ${name}` : undefined} description={t("webapp.home.tagline")} />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState title={t("overview.loadErrorTitle")} body={error ?? t("overview.loadErrorBody")} onRetry={refetch} retryLabel={t("common.retry")} />
      ) : (
        <div className="space-y-6">
          {/* KPI row — crisp content layer */}
          {status === "loading" ? (
            <KpiSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <StatCard label={t("overview.balance")} value={stats.balance} format={(v) => formatMoney(v)} icon={Wallet} delay={0} />
              <StatCard label="Revenue" value={stats.revenue} format={(v) => formatMoney(v)} icon={TrendingUp} tone="positive" trendPct={momTrend(reports.data.months, "revenue")} trendLabel="vs last month" delay={0.04} />
              <StatCard label="Expenses" value={stats.expenses} format={(v) => formatMoney(v)} icon={TrendingDown} tone="negative" trendPct={momTrend(reports.data.months, "expenses")} trendLabel="vs last month" invertTrendColor delay={0.08} />
              <StatCard label="Cash flow" value={stats.cashFlow} format={(v) => formatMoney(v)} icon={ArrowLeftRight} tone={stats.cashFlow >= 0 ? "positive" : "negative"} delay={0.12} />
            </div>
          )}

          {/* RIVA AI entry — the emotional peak of the home screen. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <Link
              href="/assistant"
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl bg-deep-navy p-5 text-warm-white shadow-[0_28px_52px_-24px_rgba(16,28,44,0.8)] transition-transform hover:scale-[1.01] sm:p-6"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(80%_60%_at_85%_-10%,rgba(113,135,155,0.6),transparent_60%)]"
              />
              <div className="relative flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-warm-white/80">
                <Sparkle size={12} className="text-steel-blue" />
                RIVA AI
              </div>
              <p className="relative max-w-md font-display text-[18px] font-bold leading-snug sm:text-[20px]">
                {t("webapp.home.aiTitle")}
              </p>
              <p className="relative max-w-md text-[12px] leading-relaxed text-warm-white/70">
                {t("webapp.home.aiBody")}
              </p>
              <span className="relative mt-1 inline-flex items-center gap-1.5 rounded-full bg-warm-white/20 px-3 py-1.5 text-[11px] font-semibold text-warm-white transition-colors group-hover:bg-warm-white/30">
                {t("webapp.nav.assistant")}
                <ChevronRight size={13} className="rtl:rotate-180" />
              </span>
            </Link>
          </motion.div>

          {/* Recent transactions */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-[15px] font-semibold text-ink">{t("overview.recentTransactions")}</h2>
                <p className="mt-0.5 text-[12px] text-ink-faint">Latest activity in your business</p>
              </div>
              <Link
                href="/cash"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal-500 transition-colors hover:text-signal-600"
              >
                {t("common.seeAll")}
                <ChevronRight size={14} className="rtl:rotate-180" />
              </Link>
            </div>
            <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
              {status === "loading" ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
              ) : (
                <AnimatePresence initial={false}>
                  {recentTransactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2, ease: EASE_OUT }}
                      className="group cursor-pointer px-4 py-3.5 transition-colors hover:bg-surfaceMuted/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-medium", tx.amount > 0 ? "bg-moss-100 text-moss-700" : "bg-steel-blue/10 text-steel-blue")}>
                          {tx.amount > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{tx.description}</p>
                          <p className="text-[11px] text-ink-faint">
                            <span className="inline-block rounded bg-surfaceMuted px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                              {tx.category}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-mono font-figures text-[13px] font-semibold tabular-nums", tx.amount > 0 ? "text-moss-700" : "text-ink")}>
                            {formatMoney(tx.amount, { signed: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {status === "ready" && recentTransactions.length === 0 && (
                <p className="px-4 py-10 text-center text-[13px] text-ink-faint">{t("overview.noTransactionsBody")}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}