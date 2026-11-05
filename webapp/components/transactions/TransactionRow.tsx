import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/currency";
import { iconFor } from "@/lib/categoryIcons";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { translateCategory } from "@/lib/i18n/labels";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const { t, locale } = useI18n();
  const Icon = iconFor(tx.icon);
  const positive = tx.amount > 0;

  return (
    <>
      {/* Desktop / tablet row — refined spacing and hierarchy */}
      <div className="hidden items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-surfaceMuted/30 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-transform hover:scale-105",
              positive
                ? "bg-moss-100 text-moss-700 ring-moss-200/40"
                : "bg-signal-50 text-signal-600 ring-signal-100/40"
            )}
          >
            <Icon size={16} strokeWidth={2.2} />
          </span>
          <p className="min-w-0 truncate text-[13.5px] font-medium leading-snug text-ink">
            {tx.description}
          </p>
        </div>
        <span className="truncate text-[11.5px] text-ink-faint">
          {translateCategory(tx.category, t)}
        </span>
        <span className="text-[12.5px] text-ink-soft">{formatDate(tx.date, locale)}</span>
        <span
          className={cn(
            "font-mono font-figures text-[13.5px] font-semibold tabular-nums",
            positive ? "text-fin-positive" : "text-fin-negative"
          )}
        >
          {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
        </span>
        <Badge tone={tx.status === "posted" ? "success" : "warning"}>
          {tx.status === "posted" ? t("transactions.posted") : t("transactions.pending")}
        </Badge>
        <DeleteTransactionButton transactionId={tx.id} description={tx.description} />
      </div>

      {/* Mobile card — significantly enhanced UX */}
      <div className="group flex min-h-[72px] cursor-pointer items-center gap-3.5 px-4 py-4 transition-all duration-150 active:bg-surfaceMuted/40 sm:hidden">
        {/* Enhanced icon with better visual weight */}
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-all group-active:scale-95",
            positive
              ? "bg-moss-100 text-moss-700 ring-moss-200/40"
              : "bg-signal-50 text-signal-600 ring-signal-100/40"
          )}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>

        {/* Content with improved spacing and hierarchy */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-[14px] font-medium leading-tight text-ink">
            {tx.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-lg bg-surfaceMuted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
              {translateCategory(tx.category, t)}
            </span>
            <span className="text-[11px] text-ink-faint">
              {formatDate(tx.date, locale)}
            </span>
          </div>
        </div>

        {/* Amount and status — enhanced visual hierarchy */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p
            className={cn(
              "font-mono font-figures text-[14.5px] font-semibold tabular-nums",
              positive ? "text-fin-positive" : "text-fin-negative"
            )}
          >
            {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
          </p>
          <Badge
            tone={tx.status === "posted" ? "success" : "warning"}
            className="text-[10px]"
          >
            {tx.status === "posted" ? t("transactions.posted") : t("transactions.pending")}
          </Badge>
        </div>

        {/* Delete button - positioned for easy thumb access */}
        <div className="shrink-0">
          <DeleteTransactionButton transactionId={tx.id} description={tx.description} />
        </div>
      </div>
    </>
  );
}
