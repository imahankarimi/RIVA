import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { StaggerContainer, StaggerItem } from "@/components/motion/Stagger";
import { EmptyState } from "@/components/ui/StateViews";
import { formatCurrency, formatDate } from "@/lib/currency";
import { iconFor } from "@/lib/categoryIcons";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { translateCategory } from "@/lib/i18n/labels";

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const { locale, t } = useI18n();

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between px-5 pt-4">
        <h3 className="font-display text-[14.5px] font-bold text-ink">{t("overview.recentTransactions")}</h3>
        <Link href="/transactions" className="text-[12.5px] font-medium text-signal-600 hover:text-signal-700">
          {t("common.seeAll")}
        </Link>
      </div>
      {transactions.length === 0 ? (
        <EmptyState title={t("overview.noTransactions")} body={t("overview.noTransactionsBody")} />
      ) : (
        <StaggerContainer as="ul" className="mt-2 divide-y divide-line-soft" staggerMs={0.04}>
          {transactions.map((tx) => {
            const Icon = iconFor(tx.icon);
            const positive = tx.amount > 0;
            return (
              <StaggerItem key={tx.id} as="li">
                <div className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surfaceMuted/60">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surfaceMuted text-ink-soft">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{tx.description}</p>
                    <p className="text-[12px] text-ink-faint">
                      {translateCategory(tx.category, t)} · {formatDate(tx.date, locale)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono font-figures text-[13.5px] font-semibold",
                      positive ? "text-moss-700" : "text-ink"
                    )}
                  >
                    {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </Card>
  );
}
