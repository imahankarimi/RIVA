"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, FileUp, SlidersHorizontal,
} from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { ImportExportModal } from "@/components/settings/ImportExportModal";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function CashPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const { transactions, status, error, usingDemoData, refetch } = useTransactions(business?.id ?? null);
  const { accounts } = useAccounts(business?.id ?? null);
  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState<"all" | "in" | "out">("all");
  const [importExportOpen, setImportExportOpen] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
      const matchesHeading = heading === "all" ? true : heading === "in" ? tx.amount > 0 : tx.amount < 0;
      return matchesSearch && matchesHeading;
    });
  }, [transactions, search, heading]);

  const totals = useMemo(() => {
    const inSum = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    const outSum = transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + -tx.amount, 0);
    return { inSum, outSum };
  }, [transactions]);

  const cashAccount = accounts.find((a) => a.type === "asset");
  const cashBalance = cashAccount?.balance ?? 0;

  const hasLoaded = status !== "loading" && status !== "error";
  const isEmpty = hasLoaded && transactions.length === 0;

  function formatMoney(value: number, opts: { signed?: boolean } = {}) {
    return formatCurrency(value, business.currency, locale, opts);
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("webapp.nav.cash")} title={t("webapp.cash.title")} description={t("webapp.cash.subtitle")} />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "error" ? (
        <ErrorState title={t("transactions.loadErrorTitle")} body={error ?? t("transactions.loadErrorBody")} onRetry={refetch} retryLabel={t("common.retry")} />
      ) : (
        <div className="space-y-5">
          {/* Summary strip — cash balance + net movement (crisp content layer). */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-2xl bg-surface p-3 ring-1 ring-line sm:p-4">
              <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint">
                <Wallet size={10} /> {t("overview.balance")}
              </p>
              <p className="mt-2 font-mono font-figures text-[16px] font-semibold tabular-nums text-ink sm:mt-2.5 sm:text-[18px]">
                {formatMoney(cashBalance)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-3 ring-1 ring-line sm:p-4">
              <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint">
                <ArrowDownToLine size={10} /> {t("webapp.cash.income")}
              </p>
              <p className="mt-2 font-mono font-figures text-[16px] font-semibold tabular-nums text-moss-700 sm:mt-2.5 sm:text-[18px]">
                {formatMoney(totals.inSum)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-3 ring-1 ring-line sm:p-4">
              <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint">
                <ArrowUpFromLine size={10} /> {t("webapp.cash.expense")}
              </p>
              <p className="mt-2 font-mono font-figures text-[16px] font-semibold tabular-nums text-rose-700 sm:mt-2.5 sm:text-[18px]">
                {formatMoney(totals.outSum)}
              </p>
            </div>
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
            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
              {(["all", "in", "out"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setHeading(k)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors duration-150",
                    heading === k ? "bg-signal-500 text-onSignal shadow-subtle" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {k === "all" ? "All" : k === "in" ? <TrendingUp size={13} /> : "Out"}
                </button>
              ))}
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

            {isEmpty && (
              <EmptyState title={t("transactions.emptyAllTitle")} body={t("transactions.emptyAllBody")} />
            )}

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