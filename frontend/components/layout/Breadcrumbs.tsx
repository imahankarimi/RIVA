"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const routeKeys: Record<string, string> = {
  overview: "nav.overview",
  assistant: "nav.assistant",
  transactions: "nav.transactions",
  accounts: "nav.accounts",
  reports: "nav.reports",
  income: "nav.income",
  expenses: "nav.expenses",
  budgets: "nav.budgets",
  goals: "nav.goals",
  debts: "nav.debts",
  subscriptions: "nav.subscriptions",
  calendar: "nav.calendar",
  help: "nav.help",
  settings: "nav.settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t, dir } = useI18n();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const lastSegment = segments[segments.length - 1] ?? "";
  const labelKey = routeKeys[lastSegment];

  const label = labelKey
    ? t(labelKey)
    : lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
      <Link
        href="/overview"
        className="hidden shrink-0 text-ink-faint transition-colors hover:text-ink sm:block"
      >
        {t("nav.overview")}
      </Link>

      <ChevronRight
        size={13}
        className={cn(
          "hidden shrink-0 text-ink-faint sm:block",
          dir === "rtl" && "rotate-180"
        )}
      />

      <span className="truncate font-medium text-ink">{label}</span>
    </div>
  );
}
