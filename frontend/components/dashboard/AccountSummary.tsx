import { Wallet, Landmark, CreditCard, PiggyBank, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/StateViews";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";

const TYPE_LABEL_KEY: Record<Account["type"], string> = {
  asset: "accounts.assets",
  liability: "accounts.liabilities",
  equity: "accounts.equity",
  revenue: "accounts.revenue",
  expense: "accounts.expenses",
};

const TYPE_ICON: Record<Account["type"], typeof Wallet> = {
  asset: Wallet,
  liability: CreditCard,
  equity: Landmark,
  revenue: TrendingDown,
  expense: PiggyBank,
};

const TYPE_TONE: Record<Account["type"], string> = {
  asset: "bg-signal-100 text-signal-600",
  liability: "bg-rose-100 text-rose-600",
  equity: "bg-signal-50 text-signal-500",
  revenue: "bg-moss-100 text-moss-600",
  expense: "bg-amber-100 text-amber-600",
};

/** Top accounts by absolute balance, each with a proportional bar against the largest one shown. */
export function AccountSummary({ accounts, currency }: { accounts: Account[]; currency: BackendCurrency }) {
  const { t, locale } = useI18n();

  const safe = accounts.map((a) => ({ ...a, balance: Number.isFinite(a.balance) ? a.balance : 0 }));
  const top = [...safe].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5);
  const max = Math.max(...top.map((a) => Math.abs(a.balance)), 1);

  return (
    <Card className="p-5">
      <h3 className="font-display text-[14.5px] font-bold text-ink">{t("overview.accountSummary")}</h3>

      {top.length === 0 ? (
        <EmptyState title={t("overview.noAccounts")} />
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {top.map((account, i) => {
            const AccIcon = TYPE_ICON[account.type] || Wallet;
            const pct = Math.max((Math.abs(account.balance) / max) * 100, 3);
            return (
              <li key={account.id}>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", TYPE_TONE[account.type])}>
                    <AccIcon size={13} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{account.name}</span>
                  <span className="shrink-0 font-mono font-figures text-[12.5px] font-semibold text-ink-soft">
                    {formatCurrency(account.balance, currency, locale)}
                  </span>
                </div>
                <div className="mt-1.5 ml-9.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surfaceMuted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 * i }}
                      className="h-full rounded-full bg-signal-500/70"
                    />
                  </div>
                  <span className="shrink-0 text-[10.5px] uppercase tracking-wide text-ink-faint">
                    {t(TYPE_LABEL_KEY[account.type])}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
