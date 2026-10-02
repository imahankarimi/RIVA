"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { TransactionTypeTabs, type TransactionKind } from "@/components/transactions/TransactionTypeTabs";
import { AnimatedAmountInput } from "@/components/transactions/AnimatedAmountInput";
import { NumericKeypad } from "@/components/transactions/NumericKeypad";
import { StatefulButton } from "@/components/transactions/StatefulButton";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { confirmChatAction } from "@/lib/api/chat";
import { CURRENCY_META } from "@/lib/currency";
import { DURATION, EASE_OUT, SPRING_SNAPPY } from "@/lib/motion/tokens";
import type { ChatAction } from "@/lib/types";

const QUICK_AMOUNTS = [1_000_000, 5_000_000, 10_000_000] as const;

export function AddIncomeModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { t, locale, dir } = useI18n();
  const { business } = useBusiness();
  const { accounts } = useAccounts(business?.id ?? null);

  const [kind, setKind] = useState<TransactionKind>("income");
  const [rawAmount, setRawAmount] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const [revenueAccountId, setRevenueAccountId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Set on a submit click that fails validation — drives the per-field inline
  // errors so a missing required field is never a silent no-op.
  const [attempted, setAttempted] = useState(false);

  // Toggled to make the amount hero shake when an invalid submission is
  // attempted. Purely a visual cue — validation itself is unchanged.
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const depositAccounts = useMemo(() => accounts.filter((a) => a.type === "asset"), [accounts]);
  const revenueAccounts = useMemo(() => accounts.filter((a) => a.type === "revenue"), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter((a) => a.type === "expense"), [accounts]);

  const amount = Number(rawAmount.replace(/[,٬]/g, "") || "0");
  const currency = business?.currency ?? "USD";
  const meta = CURRENCY_META[currency];

  // Match formatCurrency semantics: Toman/Rial place a name after the digits,
  // USD/EUR/GBP place a symbol before them — in both English and Persian.
  const currencySymbol = meta.symbol ?? undefined;
  const currencyName = locale === "fa" ? meta.nameFa : meta.name;

  const accent: "rose" | "moss" = kind === "spent" ? "rose" : "moss";

  /** Quick amount buttons sized for RIVA's base currency — nothing is added to
   *  the internal amount value, the user still owns the exact figure. */
  const quickAmounts = useMemo(() => {
    const q = [...QUICK_AMOUNTS];
    return q.map((n) => ({ value: n, label: formatCompact(n, locale) }));
  }, [locale]);

  const reset = () => {
    setRawAmount("");
    setReceivedFrom("");
    setDepositAccountId("");
    setRevenueAccountId("");
    setExpenseAccountId("");
    setPaidFromAccountId("");
    setNote("");
    setReference("");
    setError("");
    setSuccess(false);
    setFeedbackNonce(0);
    setAttempted(false);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const appendQuickAmount = (n: number) => {
    setRawAmount(String(n));
    setError("");
  };

  const title = kind === "spent" ? t("addIncome.spentTitle") : t("addIncome.title");

  // Same validation semantics as before, plus the mode-specific account pair.
  const canSave =
    amount > 0 &&
    !saving &&
    !success &&
    (kind === "income"
      ? !!depositAccountId && !!revenueAccountId
      : !!expenseAccountId && !!paidFromAccountId);

  // Inline, per-field required errors — only surfaced once the user has tried
  // to submit, and cleared as soon as the field holds a valid value.
  const amountInvalid = amount <= 0;
  const incomeDepositInvalid = kind === "income" && !depositAccountId;
  const incomeRevenueInvalid = kind === "income" && !revenueAccountId;
  const spentExpenseInvalid = kind === "spent" && !expenseAccountId;
  const spentPaidFromInvalid = kind === "spent" && !paidFromAccountId;

  const handleSave = async () => {
    if (!business || !canSave) return;
    setSaving(true);
    setError("");
    try {
      const description =
        [receivedFrom.trim(), note.trim()].filter(Boolean).join(" — ") || title;
      const action: ChatAction =
        kind === "income"
          ? {
              intent: "record_revenue",
              amount,
              currency: business.currency,
              description: reference.trim() ? `${description} (${reference.trim()})` : description,
              debit_account_id: depositAccountId,
              credit_account_id: revenueAccountId,
            }
          : {
              intent: "expense",
              amount,
              currency: business.currency,
              description: reference.trim() ? `${description} (${reference.trim()})` : description,
              debit_account_id: expenseAccountId,
              credit_account_id: paidFromAccountId,
            };
      // This goes through the same accounting confirmation endpoint the AI
      // assistant uses — a manual "Add Income/Spent" is still just a normal,
      // validated double-entry transaction, never a frontend-only balance bump.
      const result = await confirmChatAction(business.id, action);
      if (!result.success) {
        setSaving(false);
        setError(t("common.retry"));
        return;
      }
      setSaving(false);
      setSuccess(true);
      onSaved?.();
      saveTimer.current = setTimeout(() => {
        handleClose();
      }, 900);
    } catch {
      setSaving(false);
      setError(t("common.retry"));
    }
  };

  // Manual failure path (smth blockable is empty) — reveal inline errors and
  // nudge the amount hero when the amount itself is the missing field.
  const submitBlocked = () => {
    setAttempted(true);
    if (amountInvalid) setFeedbackNonce((n) => n + 1);
  };

  const saveLabel = kind === "spent" ? t("addIncome.saveSpent") : t("addIncome.saveIncome");
  const successLabel = kind === "spent" ? t("addIncome.successSpent") : t("addIncome.success");

  const keypadAccent = kind === "spent" ? "rose" : "moss";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-sm flex-col overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-raised sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <h2 className="font-display text-[16px] font-bold text-ink">{title}</h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint hover:bg-surfaceMuted hover:text-ink"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Spent / Income toggle */}
              <TransactionTypeTabs
                value={kind}
                onChange={setKind}
                spentLabel={t("addIncome.spent")}
                incomeLabel={t("addIncome.income")}
                ariaLabel={t("addIncome.transactionType")}
              />

              {/* Amount — the visual hero + the keypad that drives it */}
              <div className="flex flex-col gap-2.5">
                <AnimatedAmountInput
                  value={rawAmount}
                  onValueChange={setRawAmount}
                  currencyLabel={currencyName}
                  symbol={currencySymbol}
                  amountLabel={t("common.amount")}
                  dir={dir}
                  locale={locale}
                  feedbackNonce={feedbackNonce}
                  autoFocus
                  accent={accent}
                  error={
                    attempted && amountInvalid
                      ? t("addIncome.amountRequired")
                      : undefined
                  }
                />

                {/* Quick amount controls — secondary to the keypad */}
                <div className="flex gap-2">
                  {quickAmounts.map(({ value, label }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.94 }}
                      transition={SPRING_SNAPPY}
                      onClick={() => appendQuickAmount(value)}
                      className="h-8 flex-1 rounded-md bg-surfaceMuted text-[12.5px] font-medium tabular-nums text-ink-soft transition-colors duration-150 hover:bg-line-soft hover:text-ink"
                    >
                      +{label}
                    </motion.button>
                  ))}
                </div>

                <NumericKeypad
                  onDigit={(d) => {
                    setRawAmount((prev) => (prev.length >= 15 ? prev : prev + d));
                  }}
                  onDot={() => {
                    setRawAmount((prev) => (prev.includes(".") ? prev : prev === "" ? "0." : prev + "."));
                  }}
                  onBackspace={() => {
                    setRawAmount((prev) => prev.slice(0, -1));
                  }}
                  accent={keypadAccent}
                />
              </div>

              {/* Mode-specific account pair */}
              {kind === "income" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="income-from">{t("addIncome.receivedFrom")}</Label>
                    <Input
                      id="income-from"
                      value={receivedFrom}
                      onChange={(e) => setReceivedFrom(e.target.value)}
                      placeholder={t("addIncome.receivedFromPlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="income-reference">{t("addIncome.reference")}</Label>
                    <Input
                      id="income-reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={t("addIncome.referencePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="income-deposit">{t("addIncome.depositAccount")}</Label>
                    <Select
                      value={depositAccountId}
                      onValueChange={setDepositAccountId}
                      placeholder={t("addIncome.selectAccount")}
                      options={depositAccounts.map((a) => ({ value: a.id, label: a.name }))}
                      error={
                        attempted && incomeDepositInvalid
                          ? t("addIncome.selectDepositAccountRequired")
                          : undefined
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="income-rev">{t("addIncome.revenueAccount")}</Label>
                    <Select
                      value={revenueAccountId}
                      onValueChange={setRevenueAccountId}
                      placeholder={t("addIncome.selectAccount")}
                      options={revenueAccounts.map((a) => ({ value: a.id, label: a.name }))}
                      error={
                        attempted && incomeRevenueInvalid
                          ? t("addIncome.selectRevenueAccountRequired")
                          : undefined
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="spent-to">{t("addIncome.paidTo")}</Label>
                    <Input
                      id="spent-to"
                      value={receivedFrom}
                      onChange={(e) => setReceivedFrom(e.target.value)}
                      placeholder={t("addIncome.paidToPlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="spent-reference">{t("addIncome.reference")}</Label>
                    <Input
                      id="spent-reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={t("addIncome.referencePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="spent-expense">{t("addIncome.expenseAccount")}</Label>
                    <Select
                      value={expenseAccountId}
                      onValueChange={setExpenseAccountId}
                      placeholder={t("addIncome.selectAccount")}
                      options={expenseAccounts.map((a) => ({ value: a.id, label: a.name }))}
                      error={
                        attempted && spentExpenseInvalid
                          ? t("addIncome.selectExpenseAccountRequired")
                          : undefined
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="spent-paidfrom">{t("addIncome.paidFrom")}</Label>
                    <Select
                      value={paidFromAccountId}
                      onValueChange={setPaidFromAccountId}
                      placeholder={t("addIncome.selectAccount")}
                      options={depositAccounts.map((a) => ({ value: a.id, label: a.name }))}
                      error={
                        attempted && spentPaidFromInvalid
                          ? t("addIncome.selectPaidFromAccountRequired")
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="income-note">{t("addIncome.note")}</Label>
                <Input
                  id="income-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("addIncome.notePlaceholder")}
                />
              </div>

              {error && !success && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[12.5px] font-medium text-rose-700"
                >
                  {error}
                </motion.p>
              )}

              <StatefulButton
                state={saving ? "loading" : success ? "success" : "idle"}
                idleLabel={saveLabel}
                loadingLabel={t("addIncome.saving")}
                successLabel={successLabel}
                onClick={success ? undefined : canSave ? handleSave : submitBlocked}
                disabled={saving}
                tone={kind === "spent" ? "rose" : "moss"}
                className="mt-1"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Compact, localized quick-amount label — "1M", "5M", "10M" (or Persian digits). */
function formatCompact(n: number, locale: "en" | "fa"): string {
  const suffixes: Array<[number, string]> = [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  for (const [d, s] of suffixes) {
    if (n >= d && n % d === 0) return `${locale === "fa" ? toFa(n / d) : n / d}${s}`;
  }
  return locale === "fa" ? toFa(n) : String(n);
}

function toFa(n: number): string {
  return String(n)
    .split("")
    .map((c) => (/\d/.test(c) ? "۰۱۲۳۴۵۶۷۸۹"[Number(c)] : c))
    .join("");
}