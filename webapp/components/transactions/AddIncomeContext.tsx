"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePreview } from "@/components/preview/PreviewProvider";
import { AddIncomeModal } from "./AddIncomeModal";

interface AddIncomeContextValue {
  openAddIncome: () => void;
}

const AddIncomeContext = createContext<AddIncomeContextValue | null>(null);

/** Broadcast name for "ledger data changed" — dispatched after a manual save so
 *  every mounted view (Transactions, Income, Expenses, Overview) refetches. */
export const TRANSACTIONS_CHANGED_EVENT = "riva:transactions-changed";

export function AddIncomeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { isGuest, openAuthPrompt } = usePreview();

  // Every "Add transaction" entry point in the app goes through this context.
  // For a guest it becomes an authentication trigger, never a form — there is
  // no account to post against.
  const openAddIncome = useCallback(() => {
    if (isGuest) {
      openAuthPrompt({
        reasonKey: "preview.signInToAddTransaction",
        intent: { kind: "add-transaction" },
      });
      return;
    }
    setOpen(true);
  }, [isGuest, openAuthPrompt]);

  const close = useCallback(() => setOpen(false), []);
  const handleSaved = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRANSACTIONS_CHANGED_EVENT));
  }, []);

  // Session expiry/logout while the form is open must not leave a write form
  // sitting over the guest experience.
  useEffect(() => {
    if (isGuest) setOpen(false);
  }, [isGuest]);

  return (
    <AddIncomeContext.Provider value={{ openAddIncome }}>
      {children}
      {!isGuest && <AddIncomeModal open={open} onClose={close} onSaved={handleSaved} />}
    </AddIncomeContext.Provider>
  );
}

export function useAddIncome() {
  const ctx = useContext(AddIncomeContext);
  if (!ctx) throw new Error("useAddIncome must be used within AddIncomeProvider");
  return ctx;
}
