"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CashView = "cash" | "income" | "expenses";

const VIEWS: Array<{ id: CashView; label: string; icon: typeof Wallet; href: string }> = [
  { id: "cash", label: "All Transactions", icon: Wallet, href: "/cash" },
  { id: "income", label: "Income", icon: TrendingUp, href: "/income" },
  { id: "expenses", label: "Expenses", icon: TrendingDown, href: "/expenses" },
];

export function CashSubnav({ active }: { active: CashView }) {
  return (
    <div className="mb-5 flex gap-1 rounded-lg border border-line bg-surface p-1">
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = active === view.id;
        return (
          <Link
            key={view.id}
            href={view.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors sm:flex-none",
              isActive
                ? "bg-signal-500 text-onSignal shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Icon size={14} strokeWidth={isActive ? 2.2 : 2} />
            <span className="hidden sm:inline">{view.label}</span>
            <span className="sm:hidden">
              {view.id === "cash" ? "All" : view.id === "income" ? "In" : "Out"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
