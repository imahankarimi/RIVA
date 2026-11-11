"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Plus,
} from "lucide-react";
import { SearchField, SegmentedControl, Button } from "@/components/glisse";
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
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { formatCurrency } from "@/lib/currency";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function CashPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const { openAddIncome } = useAddIncome();
  const { transactions, status, error, usingDemoData, refetch } = useTransactions(business?.id ?? null);
  const { accounts } = useAccounts(business?.id ?? null);
  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState<"all" | "in" | "out">("all");
  const [importExportMode, setImportExportMode] = useState<"import" | "export">("import");
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
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader
        title={t("webapp.nav.cash")}
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
          title={t("transactions.loadErrorTitle")}
          body={error ?? t("transactions.loadErrorBody")}
          onRetry={refetch}
          retryLabel={t("common.retry")}
        />
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {/* Summary strip — enhanced visual hierarchy and spacing */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {/* Balance card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-surface to-surface/80 p-5 shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60 transition-all hover:shadow-[0_4px_12px_rgba(16,28,44,0.08)] sm:p-6"
            >
              {/* Subtle gradient overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-signal-500/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-100/40">
                    <Wallet size={16} strokeWidth={2.2} className="text-signal-600" />
                  </div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {t("overview.balance")}
                  </p>
                </div>
                <p className="font-figures text-[20px] font-semibold tabular-nums text-ink sm:text-[22px]">
                  {formatMoney(cashBalance)}
                </p>
              </div>
            </motion.div>

            {/* Income card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.04, ease: EASE_OUT }}
              className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-surface to-surface/80 p-5 shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60 transition-all hover:shadow-[0_4px_12px_rgba(16,28,44,0.08)] sm:p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-moss-500/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss-100">
                    <ArrowDownToLine size={16} strokeWidth={2.2} className="text-moss-700" />
                  </div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {t("webapp.cash.income")}
                  </p>
                </div>
                <p className="font-figures text-[20px] font-semibold tabular-nums text-moss-700 sm:text-[22px]">
                  {formatMoney(totals.inSum)}
                </p>
              </div>
            </motion.div>

            {/* Expense card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: EASE_OUT }}
              className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-surface to-surface/80 p-5 shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60 transition-all hover:shadow-[0_4px_12px_rgba(16,28,44,0.08)] sm:p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="relative z-10 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                    <ArrowUpFromLine size={16} strokeWidth={2.2} className="text-rose-700" />
                  </div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {t("webapp.cash.expense")}
                  </p>
                </div>
                <p className="font-figures text-[20px] font-semibold tabular-nums text-rose-700 sm:text-[22px]">
                  {formatMoney(totals.outSum)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Toolbar — enhanced mobile UX with better touch targets */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12, ease: EASE_OUT }}
            className="space-y-3"
          >
            {/* Row 1: Search field — full width */}
            <SearchField
              value={search}
              onValueChange={setSearch}
              placeholder={t("webapp.cash.searchPlaceholder")}
              className="w-full max-w-none"
            />

            {/* Row 2: shared filter control on the start side, shared import/export control on the end side */}
            <div className="grid grid-cols-[3fr_2fr] items-center gap-3">
              {/* LEFT (LTR) / START (RTL): All / Income / Expenses control */}
              <SegmentedControl
                className="cash-filter-segmented"
                items={[
                  { value: "all", label: t("common.all") },
                  { value: "in", label: t("webapp.cash.income") },
                  { value: "out", label: t("webapp.cash.expense") },
                ]}
                value={heading}
                onValueChange={(v) => setHeading(v as "all" | "in" | "out")}
              />

              {/* RIGHT (LTR) / END (RTL): single Glisse Button for Import / Export */}
              <div className="cash-import-export-slot">
                <Button
                  variant="glass"
                  onClick={() => setImportExportOpen(true)}
                  className="w-full min-h-0"
                  aria-label={t("importExport.title")}
                >
                  {t("importExport.import")} / {t("importExport.export")}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Transaction list — enhanced visual design */}
          <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60">
            {status === "loading" && (
              <div className="divide-y divide-line-soft/60">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3.5 px-4 py-4.5 sm:px-5">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-44" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            )}

            {isEmpty && (
              <div className="py-12">
                <EmptyState
                  title={t("transactions.emptyAllTitle")}
                  body={t("transactions.emptyAllBody")}
                />
              </div>
            )}

            {hasLoaded && !isEmpty && (
              <div>
                {/* Desktop header — hidden on mobile */}
                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-line/60 bg-surfaceMuted/30 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint sm:grid">
                  <span>{t("common.description")}</span>
                  <span>{t("common.category")}</span>
                  <span>{t("common.date")}</span>
                  <span className="text-right">{t("common.amount")}</span>
                  <span className="text-right">{t("common.status")}</span>
                </div>

                {filtered.length === 0 ? (
                  <p className="px-4 py-12 text-center text-[13px] text-ink-faint">
                    {t("transactions.empty")}
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    <div className="divide-y divide-line-soft/60">
                      {filtered.map((tx, i) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(i * 0.03, 0.2),
                            duration: 0.22,
                            ease: EASE_OUT,
                          }}
                          className="transition-colors active:bg-surfaceMuted/30 sm:hover:bg-surfaceMuted/20"
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
        initialTab={importExportMode}
      />
    </div>
  );
}
