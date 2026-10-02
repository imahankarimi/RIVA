"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getBusinessTransactions,
  type BackendTransaction,
} from "@/lib/api/transactions";
import { ApiError } from "@/lib/api/client";
import { demoTransactions } from "@/lib/mock/demoData";
import { TRANSACTIONS_CHANGED_EVENT } from "@/components/transactions/AddIncomeContext";
import type { Transaction } from "@/lib/types";

interface UseTransactionsResult {
  transactions: Transaction[];
  status: "loading" | "ready" | "empty" | "error";
  error: string | null;
  usingDemoData: boolean;
  refetch: () => void;
}

function normalizeTransaction(tx: BackendTransaction): Transaction {
  return {
    id: tx.id,
    description: tx.description,
    category: tx.category,
    date: tx.date,
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
  };
}

/** Only a genuinely unreachable backend (no server to answer at all) falls back to
 *  demo data. A real response — even an error one — must never be silently masked. */
function isBackendUnreachable(err: unknown): boolean {
  return !(err instanceof ApiError);
}

export function useTransactions(businessId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] =
    useState<UseTransactionsResult["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  // Refresh when a manual Add Transaction save succeeds elsewhere in the app,
  // so an already-open list shows the new row without a full navigation.
  useEffect(() => {
    const onChange = () => refetch();
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, onChange);
  }, [refetch]);

  useEffect(() => {
    if (!businessId) {
      setTransactions([]);
      setStatus("empty");
      setError(null);
      setUsingDemoData(false);
      return;
    }

    let cancelled = false;

    setStatus("loading");
    setError(null);

    getBusinessTransactions(businessId)
      .then((data) => {
        if (cancelled) return;

        const normalized = data.map(normalizeTransaction);

        setTransactions(normalized);
        setUsingDemoData(false);
        setStatus(normalized.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (cancelled) return;

        if (isBackendUnreachable(err)) {
          setTransactions(demoTransactions);
          setUsingDemoData(true);
          setStatus("ready");
        } else {
          setTransactions([]);
          setUsingDemoData(false);
          setError(
            err instanceof Error ? err.message : "Unknown error"
          );
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, version]);

  return {
    transactions,
    status,
    error,
    usingDemoData,
    refetch,
  } satisfies UseTransactionsResult;
}
