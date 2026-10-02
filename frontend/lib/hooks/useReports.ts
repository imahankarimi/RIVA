"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "./useTransactions";
import type { Transaction } from "@/lib/types";

export interface MonthPoint {
  key: string; // "2026-03"
  monthIndex: number; // 0-11, for locale-aware month labels
  revenue: number;
  expenses: number;
  cashFlow: number;
  count: number;
}

export interface CategoryPoint {
  category: string;
  amount: number;
}

export interface ReportsInsights {
  /** Largest single category's share of total expenses in the window, e.g. 0.42. Undefined with no expenses. */
  topCategoryShare?: { category: string; share: number };
  /** Largest single transaction (by absolute amount) in the window. */
  largestTransaction?: Transaction;
}

export interface ReportsData {
  months: MonthPoint[];
  categories: CategoryPoint[];
  transactionCount: number;
  avgTransaction: number;
  insights: ReportsInsights;
}

export const PERIOD_OPTIONS = [3, 6, 12] as const;
export type PeriodMonths = (typeof PERIOD_OPTIONS)[number];

function monthKey(iso: string): { key: string; monthIndex: number } {
  const d = new Date(iso);
  return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, monthIndex: d.getMonth() };
}

function buildEmptyMonths(windowMonths: number): MonthPoint[] {
  const now = new Date();
  const out: MonthPoint[] = [];
  for (let i = windowMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      monthIndex: d.getMonth(),
      revenue: 0,
      expenses: 0,
      cashFlow: 0,
      count: 0,
    });
  }
  return out;
}

function deriveReports(transactions: Transaction[], windowMonths: number): ReportsData {
  const months = buildEmptyMonths(windowMonths);
  const byKey = new Map(months.map((m) => [m.key, m]));

  // Scope every derived figure (categories, counts, insights) to transactions
  // that actually fall inside the selected window — matching what the
  // monthly chart shows, rather than silently mixing in all-time data.
  const inWindow = transactions.filter((tx) => byKey.has(monthKey(tx.date).key));

  const categoryTotals = new Map<string, number>();
  let totalAbs = 0;
  let totalExpenses = 0;
  let largestTransaction: Transaction | undefined;

  for (const tx of inWindow) {
    const bucket = byKey.get(monthKey(tx.date).key)!;
    if (tx.amount >= 0) bucket.revenue += tx.amount;
    else bucket.expenses += Math.abs(tx.amount);
    bucket.count += 1;

    if (tx.amount < 0) {
      const amount = Math.abs(tx.amount);
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + amount);
      totalExpenses += amount;
    }

    totalAbs += Math.abs(tx.amount);

    if (!largestTransaction || Math.abs(tx.amount) > Math.abs(largestTransaction.amount)) {
      largestTransaction = tx;
    }
  }

  for (const m of months) m.cashFlow = m.revenue - m.expenses;

  const categories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const topCategoryShare =
    categories.length > 0 && totalExpenses > 0
      ? { category: categories[0]!.category, share: categories[0]!.amount / totalExpenses }
      : undefined;

  return {
    months,
    categories,
    transactionCount: inWindow.length,
    avgTransaction: inWindow.length ? totalAbs / inWindow.length : 0,
    insights: { topCategoryShare, largestTransaction },
  };
}

export function useReports(businessId: string | null, windowMonths: PeriodMonths = 6) {
  const { transactions, status, error, usingDemoData, refetch } = useTransactions(businessId);

  const data = useMemo(() => deriveReports(transactions, windowMonths), [transactions, windowMonths]);

  return {
    data,
    transactions,
    status,
    error,
    usingDemoData,
    refetch,
    isEmpty: status !== "loading" && status !== "error" && data.transactionCount === 0,
  };
}

/**
 * % change of the latest complete period vs the one before it.
 * Returns undefined until there's a prior period to compare against.
 */
export function momTrend(months: { revenue: number; expenses: number; cashFlow: number }[], key: "revenue" | "expenses" | "cashFlow") {
  if (months.length < 2) return undefined;
  const curr = months[months.length - 1];
  const prev = months[months.length - 2];
  if (!curr || !prev || prev[key] === 0) return undefined;
  return ((curr[key] - prev[key]) / Math.abs(prev[key])) * 100;
}
