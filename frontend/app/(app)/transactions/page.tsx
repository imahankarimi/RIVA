"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, Chip } from "@/components/ui/Card";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { StaggerContainer, StaggerItem } from "@/components/motion/Stagger";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { DATE_RANGES, DATE_RANGE_LABEL_KEY, withinDateRange, type DateRange } from "@/lib/dateRange";
import { ImportExportModal } from "@/components/settings/ImportExportModal";
import { Alert } from "@/components/ui/Alert";
import { FileUp } from "lucide-react";
import { TRANSACTIONS_CHANGED_EVENT } from "@/components/transactions/AddIncomeContext";

export default function TransactionsPage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const { transactions, status, error, usingDemoData, refetch } = useTransactions(business?.id ?? null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [importExportOpen, setImportExportOpen] = useState(false);

  // Listen for transaction changes (from AddIncomeModal or deletions)
  useEffect(() => {
    const handleChange = () => {
      refetch();
    };
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleChange);
  }, [refetch]);

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((tx) => tx.category))),
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || tx.category === category;
      const matchesRange = withinDateRange(tx.date, dateRange);
      return matchesSearch && matchesCategory && matchesRange;
    });
  }, [transactions, search, category, dateRange]);

  const hasActiveFilters = search !== "" || category !== null || dateRange !== "all";
  const clearFilters = () => {
    setSearch("");
    setCategory(null);
    setDateRange("all");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("transactions.title")} subtitle={t("transactions.subtitle")} />

      <div className="relative mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6">
        {/* Subtle ambient gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-signal-50/20 to-transparent dark:from-signal-950/15" />
        {usingDemoData && status !== "loading" && (
          <Alert variant="warning" className="mb-3">{t("common.demoDataNotice")}</Alert>
        )}

        <TransactionFilters
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={category}
          onCategoryChange={setCategory}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {DATE_RANGES.map((r) => (
              <Chip key={r} active={dateRange === r} onClick={() => setDateRange(r)}>
                {t(DATE_RANGE_LABEL_KEY[r])}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {status !== "loading" && status !== "error" && transactions.length > 0 && (
              <div className="flex items-center gap-2.5 text-[12.5px] text-ink-faint">
                <span>{t("transactions.resultCount", { shown: filtered.length, total: transactions.length })}</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="font-medium text-signal-600 hover:text-signal-700">
                    {t("transactions.clearFilters")}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setImportExportOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12.5px] font-medium text-ink-soft hover:border-signal-300 hover:text-signal-700"
            >
              <FileUp size={13} />
              {t("importExport.title")}
            </button>
          </div>
        </div>

        <Card className="relative mt-3 overflow-hidden p-0 transition-all duration-240 hover:shadow-card hover:ring-signal-200/50 dark:hover:ring-signal-800/40">
          {status === "loading" && <LoadingState label={t("common.loading")} />}

          {status === "error" && (
            <ErrorState
              title={t("transactions.loadErrorTitle")}
              body={error ?? t("transactions.loadErrorBody")}
              onRetry={refetch}
              retryLabel={t("common.retry")}
            />
          )}

          {status !== "loading" && status !== "error" && transactions.length === 0 && (
            <EmptyState title={t("transactions.emptyAllTitle")} body={t("transactions.emptyAllBody")} />
          )}

          {status !== "loading" && status !== "error" && transactions.length > 0 && (
            <>
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-4 border-b border-line px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-faint sm:grid">
                <span>{t("common.description")}</span>
                <span>{t("common.category")}</span>
                <span>{t("common.date")}</span>
                <span>{t("common.amount")}</span>
                <span>{t("common.status")}</span>
                <span>{t("common.actions")}</span>
              </div>
              {filtered.length === 0 ? (
                <p className="px-5 py-10 text-center text-[13.5px] text-ink-faint">{t("transactions.empty")}</p>
              ) : (
                <StaggerContainer as="div" className="divide-y divide-line-soft">
                  {filtered.map((tx) => (
                    <StaggerItem key={tx.id} as="div">
                      <TransactionRow tx={tx} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </>
          )}
        </Card>
      </div>

      <ImportExportModal
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        transactions={filtered}
        currency={business.currency}
      />
    </div>
  );
}
