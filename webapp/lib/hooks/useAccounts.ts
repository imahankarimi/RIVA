"use client";

import { useCallback, useEffect, useState } from "react";
import { getBusinessAccounts } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api/client";
import { demoAccounts } from "@/lib/mock/demoData";
import type { Account } from "@/lib/types";

interface UseAccountsResult {
  accounts: Account[];
  status: "loading" | "ready" | "empty" | "error";
  error: string | null;
  usingDemoData: boolean;
  refetch: () => void;
}

/** Only a genuinely unreachable backend (no server to answer at all) falls back to
 *  demo data. A real response — even an error one — must never be silently masked. */
function isBackendUnreachable(err: unknown): boolean {
  return !(err instanceof ApiError);
}

export function useAccounts(businessId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [status, setStatus] = useState<UseAccountsResult["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);

    getBusinessAccounts(businessId)
      .then((data) => {
        if (cancelled) return;
        setAccounts(data);
        setUsingDemoData(false);
        setStatus(data.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (isBackendUnreachable(err)) {
          setAccounts(demoAccounts);
          setUsingDemoData(true);
          setStatus("ready");
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, version]);

  

  return { accounts, status, error, usingDemoData, refetch } satisfies UseAccountsResult;
}
