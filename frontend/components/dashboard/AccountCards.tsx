"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  Landmark,
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { Account } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";

const TYPE_META: Record<Account["type"], { label: string; icon: typeof Wallet; chip: string }> = {
  asset: { label: "Asset", icon: Landmark, chip: "bg-signal-500/10 text-signal-600" },
  liability: { label: "Liability", icon: CreditCard, chip: "bg-rose-500/10 text-rose-600" },
  equity: { label: "Equity", icon: PiggyBank, chip: "bg-moss-500/10 text-moss-700" },
  revenue: { label: "Revenue", icon: TrendingUp, chip: "bg-moss-500/10 text-moss-700" },
  expense: { label: "Expense", icon: TrendingDown, chip: "bg-amber-500/10 text-amber-700" },
};

function cardVisual(i: number) {
  // Give each RIVA account a distinct, on-brand card treatment.
  const styles = [
    "bg-primary text-primary-foreground",
    "bg-card text-card-foreground ring-1 ring-line",
    "bg-surface text-foreground ring-1 ring-line/60",
  ];
  return styles[i % styles.length];
}

function accountIcon(account: Account) {
  switch (account.type) {
    case "asset":
      return <Landmark className="size-5 opacity-30" />;
    case "liability":
      return <CreditCard className="size-5 opacity-30" />;
    case "expense":
      return <TrendingDown className="size-5 opacity-30" />;
    case "revenue":
      return <TrendingUp className="size-5 opacity-30" />;
    default:
      return <ArrowLeftRight className="size-5 opacity-30" />;
  }
}

/**
 * Account Cards — ported from the reference's stacked-card Account Cards
 * widget. Cards cycle to the front with a spring, each rendered from RIVA's
 * real accounts. Clicking a card cycles the stack; the add flow is a
 * realistic demo state, clearly replaceable with a real "create account" API.
 */
export function AccountCards({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const safe = accounts
    .filter((a) => Number.isFinite(a.balance))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, 5);
  const [order, setOrder] = useState(() => safe.map((_, i) => i));

  const cycle = useCallback(() => {
    setOrder((prev) => {
      const next = [...prev];
      const front = next.pop();
      if (front != null) next.unshift(front);
      return next;
    });
  }, []);

  if (safe.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-surfaceMuted text-ink-faint">
              <Wallet size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[13.5px] font-medium text-ink">{t("overview.noAccounts")}</p>
              <p className="mt-1 max-w-xs text-[12.5px] text-ink-faint">{t("overview.noAccountsBody")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="relative h-[200px]">
          {order.map((cardIdx, stackPos) => {
            const account = safe[cardIdx];
            if (!account) return null;
            const isFront = stackPos === order.length - 1;
            const maxOffset = 48 / Math.max(order.length - 1, 1);
            const style = cardVisual(cardIdx);
            const meta = TYPE_META[account.type];

            return (
              <motion.button
                key={account.id}
                onClick={cycle}
                layout
                animate={{
                  y: stackPos * Math.min(maxOffset, 16),
                  scale: 1 - (order.length - 1 - stackPos) * (0.12 / Math.max(order.length - 1, 1)),
                  zIndex: stackPos,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="absolute inset-x-0 flex h-[152px] cursor-pointer text-left"
              >
                <div className={cn("flex h-[152px] w-full flex-col justify-between rounded-2xl px-5 py-4", style)}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-wide">{account.name}</p>
                      <span
                        className={cn(
                          "mt-1 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium",
                          meta.chip
                        )}
                      >
                        {t(`accounts.${account.type === "asset" ? "assets" : account.type}`)}
                      </span>
                    </div>
                    {accountIcon(account)}
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded-md bg-foreground/10 text-[9px] font-medium tracking-widest opacity-80">
                        •••• {String(Math.abs(account.balance)).slice(0, 1)}●
                      </span>
                    </span>
                    <p className="text-xl font-bold tabular-nums tracking-tight">
                      {formatCurrency(account.balance, currency, locale)}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-3.5" />
            <span>{safe.length} {t("overview.accountSummary").toLowerCase()}</span>
          </div>
          <LinkToAccounts />
        </div>
      </CardContent>
    </Card>
  );
}

function LinkToAccounts() {
  const { t } = useI18n();
  return (
    <Link
      href="/accounts"
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      <Plus className="size-3.5" />
      {t("accounts.addAccount") || "Accounts"}
    </Link>
  );
}