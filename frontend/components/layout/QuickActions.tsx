"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, PiggyBank } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAddIncome } from "@/components/transactions/AddIncomeContext";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

export function QuickActions({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const { openAddIncome } = useAddIncome();

  const itemClass = cn(
    "group flex h-8 items-center gap-2.5 rounded-md px-3 text-[12.5px] font-medium",
    "text-ink-soft transition-colors duration-150",
    "hover:bg-surfaceMuted hover:text-ink",
    collapsed && "justify-center px-0"
  );

  return (
    <div className="px-3 pb-2">
      <div className="mb-1 flex h-[18px] overflow-hidden px-3">
        <motion.span
          initial={{
            display: collapsed ? "none" : "inline-block",
            opacity: collapsed ? 0 : 1,
          }}
          animate={{
            display: collapsed ? "none" : "inline-block",
            opacity: collapsed ? 0 : 1,
          }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
          className="whitespace-pre !p-0 !m-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint"
        >
          {t("sidebar.quickActions")}
        </motion.span>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openAddIncome();
          }}
          title={collapsed ? t("sidebar.addTransaction") : undefined}
          className={cn(itemClass, "w-full text-start")}
        >
          <Plus
            size={15}
            strokeWidth={2.2}
            className="shrink-0 text-signal-600"
          />
          <motion.span
            initial={{
              display: collapsed ? "none" : "inline-block",
              opacity: collapsed ? 0 : 1,
            }}
            animate={{
              display: collapsed ? "none" : "inline-block",
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="whitespace-pre !p-0 !m-0 text-[12.5px]"
          >
            {t("sidebar.addTransaction")}
          </motion.span>
        </button>

        <Link
          href="/budgets"
          onClick={onNavigate}
          title={collapsed ? t("sidebar.createBudget") : undefined}
          className={itemClass}
        >
          <PiggyBank
            size={15}
            strokeWidth={2.2}
            className="shrink-0 text-amber-700"
          />
          <motion.span
            initial={{
              display: collapsed ? "none" : "inline-block",
              opacity: collapsed ? 0 : 1,
            }}
            animate={{
              display: collapsed ? "none" : "inline-block",
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="whitespace-pre !p-0 !m-0 text-[12.5px]"
          >
            {t("sidebar.createBudget")}
          </motion.span>
        </Link>
      </div>
    </div>
  );
}