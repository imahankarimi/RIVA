"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StaggerContainer, StaggerItem } from "@/components/motion/Stagger";
import { useI18n } from "@/lib/i18n";
import { translateAccountName } from "@/lib/i18n/labels";
import { useBusiness } from "@/app/providers";
import { formatCurrency } from "@/lib/currency";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import type { Account } from "@/lib/types";

export function AccountGroup({
  title,
  icon: Icon,
  accounts,
  defaultOpen,
  delay = 0,
}: {
  title: string;
  icon: LucideIcon;
  accounts: Account[];
  defaultOpen?: boolean;
  delay?: number;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const maxBalance = Math.max(...accounts.map((a) => Math.abs(a.balance)), 1);

  return (
    <AnimatedCard delay={delay} interactive={false} className="overflow-hidden p-0">
      <motion.button
        whileTap={{ scale: 0.995 }}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-surfaceMuted/60"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surfaceMuted text-ink-soft">
            <Icon size={14} strokeWidth={2} />
          </span>
          <span className="font-display text-[14px] font-bold text-ink">{title}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono font-figures text-[13.5px] font-semibold text-ink-soft">
            {formatCurrency(total, business.currency, locale)}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: DURATION.base, ease: EASE_OUT }}>
            <ChevronDown size={16} className="text-ink-faint" />
          </motion.span>
        </div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            className="overflow-hidden border-t border-line"
          >
            <StaggerContainer as="ul" staggerMs={0.03} className="divide-y divide-line-soft">
              {accounts.map((a) => (
                <StaggerItem key={a.id} as="li" className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="min-w-0 truncate font-medium text-ink">
  {translateAccountName(a.name, t)}
</span>
                    <span className="font-mono font-figures text-[13px] text-ink">
                      {formatCurrency(a.balance, business.currency, locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surfaceMuted">
                    <div
                      className="h-full rounded-full bg-signal-500/60 transition-all duration-500"
                      style={{ width: `${Math.max((Math.abs(a.balance) / maxBalance) * 100, 2)}%` }}
                    />
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedCard>
  );
}
