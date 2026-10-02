"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowLeftRight,
  Check,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { Account } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";

/**
 * Accounts Grid — ported from the reference Accounts screen structure:
 * total summary chips, type filter tabs, and a responsive account-card
 * grid with a "link a new account" demo tile. Fed by RIVA's real chart of
 * accounts; the add flow is a realistic demo, isolated so it can be
 * swapped for a create-account API later.
 */

const TYPE_META: Record<Account["type"], { labelKey: string; icon: React.ComponentType<{ className?: string }>; accent: string; tile: string }> = {
  asset: { labelKey: "accounts.assets", icon: Landmark, accent: "bg-signal-500", tile: "bg-signal-100 text-signal-700" },
  liability: { labelKey: "accounts.liabilities", icon: CreditCard, accent: "bg-rose-500", tile: "bg-rose-100 text-rose-700" },
  equity: { labelKey: "accounts.equity", icon: PiggyBank, accent: "bg-moss-500", tile: "bg-moss-100 text-moss-700" },
  revenue: { labelKey: "accounts.revenue", icon: TrendingUp, accent: "bg-moss-500", tile: "bg-moss-100 text-moss-700" },
  expense: { labelKey: "accounts.expenses", icon: TrendingDown, accent: "bg-amber-500", tile: "bg-amber-100 text-amber-700" },
};

function summaryStats(accounts: Account[]) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const positive = accounts.filter((a) => a.balance >= 0).length;
  return { total, positive };
}

const FILTERS: Array<{ value: Account["type"] | "all"; labelKey: string }> = [
  { value: "all", labelKey: "accounts.allTypes" },
  { value: "asset", labelKey: "accounts.assets" },
  { value: "liability", labelKey: "accounts.liabilities" },
  { value: "equity", labelKey: "accounts.equity" },
  { value: "revenue", labelKey: "accounts.revenue" },
  { value: "expense", labelKey: "accounts.expenses" },
];

type AddStep = "idle" | "form" | "loading" | "success";

export function AccountsGrid({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: BackendCurrency;
}) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Account["type"] | "all">("all");
  const [step, setStep] = useState<AddStep>("idle");
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<Account["type"]>("asset");
  const [added, setAdded] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? accounts : accounts.filter((a) => a.type === filter)),
    [accounts, filter]
  );

  const stats = useMemo(() => summaryStats(accounts), [accounts]);

  function handleConnect() {
    if (!draftName) return;
    setStep("loading");
    setTimeout(() => {
      setAdded(true);
      setStep("success");
      setTimeout(() => {
        setStep("idle");
        setDraftName("");
        setAdded(false);
      }, 1800);
    }, 1300);
  }

  const isPositive = stats.total >= 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Wallet className="size-4" />}
          color="text-primary"
          bg="bg-primary/10"
          label={t("accounts.totalBalance")}
          value={formatCurrency(stats.total, currency, locale)}
        />
        <StatTile
          icon={isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          color={isPositive ? "text-moss-700" : "text-rose-700"}
          bg={isPositive ? "bg-moss-500/10" : "bg-rose-500/10"}
          label={t("accounts.netPosition")}
          value={formatCurrency(stats.total, currency, locale)}
        />
        <StatTile
          icon={<ArrowLeftRight className="size-4" />}
          color="text-muted-foreground"
          bg="bg-muted"
          label={t("accounts.linkedCount")}
          value={String(accounts.length)}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surfaceMuted text-ink-faint">
                <Wallet size={20} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-ink">{t("accounts.noMatch")}</p>
                <p className="mt-1 max-w-xs text-[12.5px] text-ink-faint">{t("accounts.noMatchBody")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((account, i) => {
            const meta = TYPE_META[account.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-card p-4 ring-1 ring-line transition-shadow hover:shadow-card"
              >
                <div className={cn("absolute inset-y-0 start-0 w-1", meta.accent)} />

                <div className="ps-4">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex size-8 items-center justify-center rounded-full", meta.tile)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{t(meta.labelKey)}</span>
                  </div>

                  <p className="mt-3 truncate text-sm font-semibold text-foreground">{account.name}</p>

                  <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-foreground">
                    {formatCurrency(account.balance, currency, locale)}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        account.balance >= 0 ? "bg-moss-100 text-moss-700" : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {formatCurrency(account.balance, currency, locale, { signed: true })}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{account.id.slice(0, 9)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Link new account (demo) */}
          <Card
            className={cn(
              "flex min-h-[180px] items-center justify-center border-2 border-dashed ring-0 transition-colors",
              step === "idle" && "cursor-pointer hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            <CardContent className="flex w-full flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {step === "idle" && (
                  <motion.button
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setStep("form")}
                    className="flex flex-col items-center gap-2 text-muted-foreground"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-5" />
                    </div>
                    <span className="text-sm font-medium">{t("accounts.linkNew")}</span>
                  </motion.button>
                )}

                {step === "form" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex w-full flex-col gap-3"
                  >
                    <Input
                      placeholder={t("accounts.accountNamePlaceholder")}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {(["asset", "liability", "equity", "expense"] as const).map((type) => {
                        const meta = TYPE_META[type];
                        return (
                          <button
                            key={type}
                            onClick={() => setDraftType(type)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              draftType === type
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {t(meta.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                    <Button className="h-9 gap-2 text-xs" onClick={handleConnect}>
                      <Plus className="size-3.5" />
                      {t("accounts.addAccount")}
                    </Button>
                  </motion.div>
                )}

                {step === "loading" && (
                  <motion.div key="loading" className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin" />
                    <p className="text-sm">{t("accounts.connecting")}</p>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="size-10 text-moss-500" />
                    </motion.div>
                    <p className="text-sm font-semibold">{t("accounts.connected")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  color,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-line">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", bg)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}