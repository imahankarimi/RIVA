"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { StaggerContainer, StaggerItem } from "@/components/motion/Stagger";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useTransactions } from "@/lib/hooks/useTransactions";

export default function IncomePage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const { transactions, status, error, refetch } = useTransactions(business?.id ?? null);
  const income = useMemo(() => transactions.filter((tx) => tx.amount > 0), [transactions]);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.income")} subtitle={t("income.subtitle")} />
      <div className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6">
        <Card className="overflow-hidden p-0">
          {status === "loading" && <LoadingState label={t("common.loading")} />}
          {status === "error" && (
            <ErrorState
              title={t("transactions.loadErrorTitle")}
              body={error ?? t("transactions.loadErrorBody")}
              onRetry={refetch}
              retryLabel={t("common.retry")}
            />
          )}
          {status !== "loading" && status !== "error" && income.length === 0 && (
            <EmptyState title={t("income.empty")} />
          )}
          {status !== "loading" && status !== "error" && income.length > 0 && (
            <StaggerContainer as="div" className="divide-y divide-line-soft">
              {income.map((tx) => (
                <StaggerItem key={tx.id} as="div">
                  <TransactionRow tx={tx} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
