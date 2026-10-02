"use client";

import { useMemo } from "react";
import { useAccounts } from "./useAccounts";
import { useTransactions } from "./useTransactions";

export interface OverviewStats {
  balance: number;
  revenue: number;
  expenses: number;
  cashFlow: number;
}

/**
 * The accounting engine's account balances are the source of truth for
 * these figures — not the AI chat, and not a hand-rolled sum over raw
 * transaction rows, which could double-count or miss adjusting entries.
 * balance = assets − liabilities (what the business actually has).
 * revenue / expenses = the matching account-type totals for the period.
 * cashFlow = revenue − expenses, i.e. net change to equity this period.
 */
export function useOverview(businessId: string | null) {
  const accountsResult = useAccounts(businessId);
  const transactionsResult = useTransactions(businessId);

  const stats: OverviewStats = useMemo(() => {
    const assets = accountsResult.accounts.filter((a) => a.type === "asset");
    const liabilities = accountsResult.accounts.filter((a) => a.type === "liability");
    const revenueAccounts = accountsResult.accounts.filter((a) => a.type === "revenue");
    const expenseAccounts = accountsResult.accounts.filter((a) => a.type === "expense");

    const sum = (list: typeof assets) => list.reduce((total, a) => total + a.balance, 0);

    const balance = sum(assets) - sum(liabilities);
    const revenue = sum(revenueAccounts);
    const expenses = sum(expenseAccounts);

    return { balance, revenue, expenses, cashFlow: revenue - expenses };
  }, [accountsResult.accounts]);

  const status: "loading" | "ready" | "error" =
    accountsResult.status === "error" || transactionsResult.status === "error"
      ? "error"
      : accountsResult.status === "loading" || transactionsResult.status === "loading"
        ? "loading"
        : "ready";

  return {
    stats,
    accounts: accountsResult.accounts,
    recentTransactions: transactionsResult.transactions.slice(0, 5),
    status,
    error: accountsResult.error ?? transactionsResult.error,
    usingDemoData: accountsResult.usingDemoData || transactionsResult.usingDemoData,
    refetch: () => {
      accountsResult.refetch();
      transactionsResult.refetch();
    },
  };
}
