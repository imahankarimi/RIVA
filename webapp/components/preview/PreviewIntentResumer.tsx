"use client";

import { useEffect } from "react";
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { usePreview } from "./PreviewProvider";

/**
 * Continues the guest's intended workflow after authentication.
 *
 * The guest never loses their place: the sheet does not navigate, so the route
 * is already preserved. If they were trying to record a transaction, the form
 * is reopened — pre-filled nothing, executed nothing. Every other intent is
 * simply cleared; the destination was the section they were already on.
 */
export function PreviewIntentResumer() {
  const { isAuthenticated, pendingIntent, consumePendingIntent } = usePreview();
  const { openAddIncome } = useAddIncome();

  useEffect(() => {
    if (!isAuthenticated || !pendingIntent) return;
    const intent = consumePendingIntent();
    if (intent?.kind !== "add-transaction") return;

    // Let the authenticated shell finish its first paint before opening a modal
    // on top of it.
    const timer = window.setTimeout(() => openAddIncome(), 350);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, pendingIntent, consumePendingIntent, openAddIncome]);

  return null;
}
