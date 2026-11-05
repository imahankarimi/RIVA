"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { deleteTransaction } from "@/lib/api/transactions";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { TRANSACTIONS_CHANGED_EVENT } from "./AddIncomeContext";

interface DeleteTransactionButtonProps {
  transactionId: string;
  description: string;
}

export function DeleteTransactionButton({ transactionId, description }: DeleteTransactionButtonProps) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteTransaction(transactionId);

      // Notify all views to refetch
      window.dispatchEvent(new CustomEvent(TRANSACTIONS_CHANGED_EVENT));

      // Close dialog
      setConfirmOpen(false);
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : t("common.retry"));
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/20"
        aria-label={t("transactions.delete")}
      >
        <Trash2 size={14} />
      </button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
              onClick={() => !deleting && setConfirmOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="relative z-10 w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-raised"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-[15px] font-semibold text-ink">
                {t("transactions.deleteConfirmTitle")}
              </h3>

              <p className="mt-2 text-[13px] text-ink-soft leading-relaxed">
                {t("transactions.deleteConfirmMessage")}
              </p>

              <p className="mt-2 truncate rounded-md bg-surfaceMuted px-3 py-2 text-[12.5px] font-medium text-ink">
                {description}
              </p>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-[12px] font-medium text-rose-700"
                >
                  {error}
                </motion.p>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="h-9 rounded-md px-4 text-[13px] font-medium text-ink-soft transition-colors duration-150 hover:bg-surfaceMuted hover:text-ink disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-9 rounded-md bg-rose-600 px-4 text-[13px] font-medium text-white shadow-subtle transition-all duration-150 hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? t("transactions.deleting") : t("transactions.delete")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
