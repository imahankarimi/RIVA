"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, TrendingUp, FileUp, SlidersHorizontal } from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { CashSubnav } from "@/components/webapp/CashSubnav";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { ImportExportModal } from "@/components/settings/ImportExportModal";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function IncomePage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const { transactions, status, error, usingDemoData, refetch } = useTransactions(business?.id ?? null);
  const [search, setSearch] = useState("");
  const [importExportOpen, setImportExportOpen] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
      const isIncome = tx.amount > 0;
      return matchesSearch && isIncome;
    });
  }, [transactions, search]);

  const totalIncome = useMemo(() => {
    return transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const hasLoaded = status !== "loading" && status !== "error";
  const isEmpty = hasLoaded && filtered.length === 0;

  function formatMoney(value: number, opts: { signed?: boolean } = {}) {
    return formatCurrency(value, business.currency, locale, opts);
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("webapp.nav.cash")} title="Income" description="Track all incoming funds to your business" />

      <CashSubnav active="income" />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState title={t("transactions.loadErrorTitle")} body={error ?? t("transactions.loadErrorBody")} onRetry={refetch} retryLabel={t("common.retry")} />
      ) : (
        <div className="space-y-5">
          {/* Total income card */}
          <div className="rounded-2xl bg-surface p-4 ring-1 ring-line sm:p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <TrendingUp size={11} /> Total Income
            </p>
            <p className="mt-3 font-mono font-figures text-[22px] font-semibold tabular-nums text-moss-700 sm:text-[24px]">
              {formatMoney(totalIncome)}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 focus-within:border-signal-300 focus-within:ring-1 focus-within:ring-signal-100">
              <Search size={14} className="shrink-0 text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("webapp.cash.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
            <button
              onClick={() => setImportExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surfaceMuted/60 hover:text-ink"
            >
              <FileUp size={13} /> {t("importExport.title")}
            </button>
            <button
              aria-label={t("common.filter")}
              className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-3 py-2.5 text-ink-soft transition-colors hover:bg-surfaceMuted/60 hover:text-ink"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {/* Transaction list */}
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            {status === "loading" && (
              <div className="divide-y divide-line-soft">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-44" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            )}

            {isEmpty && <EmptyState title="No income transactions" body="Income will appear here when you add transactions." />}

            {hasLoaded && !isEmpty && (
              <div>
                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint sm:grid">
                  <span>{t("common.description")}</span>
                  <span>{t("common.category")}</span>
                  <span>{t("common.date")}</span>
                  <span className="text-right">{t("common.amount")}</span>
                  <span className="text-right">{t("common.status")}</span>
                </div>

                {filtered.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[13px] text-ink-faint">{t("transactions.empty")}</p>
                ) : (
                  <AnimatePresence initial={false}>
                    <div className="divide-y divide-line-soft">
                      {filtered.map((tx, i) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.18, ease: EASE_OUT }}
                        >
                          <TransactionRow tx={tx} />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ImportExportModal
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        transactions={filtered}
        currency={business.currency}
      />
    </div>
  );
}
