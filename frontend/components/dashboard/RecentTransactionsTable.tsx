"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/currency";
import { iconFor } from "@/lib/categoryIcons";
import { translateCategory } from "@/lib/i18n/labels";
import { EmptyState } from "@/components/ui/StateViews";
import type { Transaction } from "@/lib/types";

/**
 * Recent Transactions — ported from the reference's Recent Transactions
 * table: grid layout with merchant cell, transaction-id/date columns, and
 * an on-brand category chip. Rows fade in, reveal a `More` action on hover.
 */

const CATEGORY_TONES = [
  "bg-signal-100 text-signal-700",
  "bg-moss-100 text-moss-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function categoryTone(category: string) {
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_TONES[h % CATEGORY_TONES.length];
}

export function RecentTransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const { t, locale } = useI18n();
  const rows = transactions.slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">{t("overview.recentTransactions")}</CardTitle>
        <CardAction>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              {t("common.seeAll")}
              <ChevronRight className="size-3 rtl:rotate-180" />
            </Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title={t("overview.noTransactions")} body={t("overview.noTransactionsBody")} />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px] space-y-1">
              <div className="grid grid-cols-[1fr_140px_110px_120px_32px] gap-4 border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>{t("overview.merchant")}</span>
                <span className="hidden sm:inline">{t("common.date")}</span>
                <span className="text-right">{t("common.amount")}</span>
                <span className="hidden md:inline">{t("common.id")}</span>
                <span />
              </div>

              {rows.map((tx) => {
                const Icon = iconFor(tx.icon);
                const positive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="group grid grid-cols-[1fr_140px_110px_120px_32px] items-center gap-4 rounded-lg py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surfaceMuted text-ink-soft">
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-medium",
                            categoryTone(tx.category)
                          )}
                        >
                          {translateCategory(tx.category, t)}
                        </span>
                      </div>
                    </div>

                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatDate(tx.date, locale)}
                    </span>

                    <span
                      className={cn(
                        "text-right text-sm font-semibold tabular-nums",
                        positive ? "text-moss-700 dark:text-moss-500" : "text-foreground"
                      )}
                    >
                      {formatCurrency(tx.amount, tx.currency, locale, { signed: true })}
                    </span>

                    <span className="hidden truncate font-mono text-xs text-muted-foreground md:inline">
                      {tx.id.slice(0, 10)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={t("common.more")}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}