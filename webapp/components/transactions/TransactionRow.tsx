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
      <div className="hidden items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-surfaceMuted/40 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-medium",
            positive ? "bg-moss-100 text-moss-700" : "bg-steel-blue/10 text-steel-blue"
          )}>
            <Icon size={14} strokeWidth={2} />
          </span>
          <p className="min-w-0 truncate text-[13px] font-medium text-ink leading-snug">{tx.description}</p>
        </div>
        <span className="truncate text-[11px] text-ink-faint">{translateCategory(tx.category, t)}</span>
        <span className="text-[12.5px] text-ink-soft">{formatDate(tx.date, locale)}</span>
        <span
          className={cn(
            "font-mono font-figures text-[13px] font-semibold tabular-nums",
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
      <div className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surfaceMuted/40 sm:hidden">
        <span className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-medium",
          positive ? "bg-moss-100 text-moss-700" : "bg-steel-blue/10 text-steel-blue"
        )}>
          <Icon size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink leading-snug">{tx.description}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            {translateCategory(tx.category, t)} · {formatDate(tx.date, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-mono font-figures text-[13px] font-semibold tabular-nums",
            positive ? "text-moss-700" : "text-ink"
          )}>
            {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
          </p>
          <Badge tone={tx.status === "posted" ? "success" : "warning"} className="mt-0.5">
            {tx.status === "posted" ? t("transactions.posted") : t("transactions.pending")}
          </Badge>
        </div>
      </div>
    </>
  );
}
