"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences/PreferencesProvider";
import { formatCurrency } from "@/lib/currency";
import { iconFor } from "@/lib/categoryIcons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ChatAction } from "@/lib/types";

interface TransactionCardProps {
  action: ChatAction;
  status: "pending" | "confirmed" | "cancelled";
  onConfirm?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function TransactionCard({ action, status, onConfirm, onCancel, isSubmitting }: TransactionCardProps) {
  const { t, locale, dir } = useI18n();
  const { showAccountingTermsByDefault } = usePreferences();
  const [showDetails, setShowDetails] = useState(showAccountingTermsByDefault);
  const Icon = iconFor(action.category?.toLowerCase().includes("util") ? "zap" : undefined);
  const DirArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[360px] overflow-hidden rounded-xl border border-line bg-surface shadow-card"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-600">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-soft">{action.category ?? action.intent}</p>
          <p className="truncate text-[15px] font-semibold text-ink">{action.description}</p>
        </div>
        {status === "confirmed" && (
          <motion.span
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-moss-100 text-moss-700"
          >
            <Check size={13} strokeWidth={3} />
          </motion.span>
        )}
        {status === "cancelled" && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surfaceMuted text-ink-faint">
            <X size={13} strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="px-4 pb-3">
        <p className="font-mono font-figures text-[26px] font-semibold leading-none text-ink">
          {formatCurrency(action.amount, action.currency, locale)}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-dashed border-line px-4 py-3 text-[12.5px]">
        <span className="text-ink-faint">{t("common.from")}</span>
        <span className="font-medium text-ink-soft">{action.from_account_label ?? action.debit_account_label}</span>
        <DirArrow size={13} className="shrink-0 text-ink-faint" strokeWidth={2} />
        <span className="text-ink-faint">{t("common.category")}</span>
        <span className="font-medium text-ink-soft">{action.category}</span>
      </div>

      {/* The receipt tear — signature motif tying the AI confirmation to a paper receipt */}
      <div className="receipt-tear" />

      <div className="px-4 py-3">
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-1 text-[12px] font-medium text-ink-faint hover:text-ink-soft"
        >
          {showDetails ? t("assistant.hideAccountingDetails") : t("assistant.accountingDetails")}
          <ChevronDown size={13} className={cn("transition-transform duration-150", showDetails && "rotate-180")} />
        </button>

        {showDetails && (
          <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-md bg-surfaceMuted p-3 text-[12px] animate-fade-up">
            <div>
              <p className="text-ink-faint">{t("assistant.debit")}</p>
              <p className="font-medium text-ink-soft">{action.debit_account_label ?? action.category}</p>
            </div>
            <div>
              <p className="text-ink-faint">{t("assistant.credit")}</p>
              <p className="font-medium text-ink-soft">{action.credit_account_label ?? action.from_account_label}</p>
            </div>
          </div>
        )}

        {status === "pending" && (
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
              {t("assistant.cancelAction")}
            </Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("assistant.confirmAction")}
            </Button>
          </div>
        )}
        <AnimatePresence>
          {status === "confirmed" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-[12.5px] font-medium text-moss-700"
            >
              ✓ {t("assistant.successTitle")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
