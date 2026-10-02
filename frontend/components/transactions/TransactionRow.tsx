import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/currency";
import { iconFor } from "@/lib/categoryIcons";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { translateCategory } from "@/lib/i18n/labels";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const { t, locale } = useI18n();
  const Icon = iconFor(tx.icon);
  const positive = tx.amount > 0;

  return (
    <>
      {/* Desktop / tablet row */}
      <div className="hidden items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-surfaceMuted/60 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            positive ? "bg-moss-100 text-moss-700" : "bg-surfaceMuted text-ink-soft"
          )}>
            <Icon size={15} strokeWidth={2} />
          </span>
          <p className="min-w-0 truncate text-[13.5px] font-medium text-ink leading-snug">{tx.description}</p>
        </div>
        <span className="truncate text-[11.5px] text-ink-faint">{translateCategory(tx.category, t)}</span>
        <span className="text-[13px] text-ink-soft">{formatDate(tx.date, locale)}</span>
        <span
          className={cn(
            "font-mono font-figures text-[14px] font-semibold tabular-nums",
            positive ? "text-moss-700" : "text-ink"
          )}
        >
          {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
        </span>
        <Badge tone={tx.status === "posted" ? "success" : "warning"}>
          {tx.status === "posted" ? t("transactions.posted") : t("transactions.pending")}
        </Badge>
      </div>

      {/* Mobile card */}
      <div className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-surfaceMuted/60 sm:hidden">
        <span className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          positive ? "bg-moss-100 text-moss-700" : "bg-surfaceMuted text-ink-soft"
        )}>
          <Icon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ink leading-snug">{tx.description}</p>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {translateCategory(tx.category, t)} · {formatDate(tx.date, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-mono font-figures text-[14px] font-semibold tabular-nums",
            positive ? "text-moss-700" : "text-ink"
          )}>
            {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
          </p>
          <Badge tone={tx.status === "posted" ? "success" : "warning"} className="mt-1">
            {tx.status === "posted" ? t("transactions.posted") : t("transactions.pending")}
          </Badge>
        </div>
      </div>
    </>
  );
}
