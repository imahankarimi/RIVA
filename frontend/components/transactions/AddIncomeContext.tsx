"use client";

import { createContext, useCallback, useContext, useState } from "react";
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

  const openAddIncome = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const handleSaved = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRANSACTIONS_CHANGED_EVENT));
  }, []);

  return (
    <AddIncomeContext.Provider value={{ openAddIncome }}>
      {children}
      <AddIncomeModal open={open} onClose={close} onSaved={handleSaved} />
    </AddIncomeContext.Provider>
  );
}

export function useAddIncome() {
  const ctx = useContext(AddIncomeContext);
  if (!ctx) throw new Error("useAddIncome must be used within AddIncomeProvider");
  return ctx;
}
