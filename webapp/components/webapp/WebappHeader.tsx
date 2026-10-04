"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

/** Premium page header for RIVA App — sophisticated typography, refined spacing,
 *  and intentional hierarchy. Designed for mobile-first PWA experience. */
export function WebappHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-6 sm:mb-7"
    >
      <div className="flex min-h-[84px] flex-col justify-center gap-3.5 sm:min-h-[92px] sm:gap-4">
        {/* Top row: eyebrow/icon + optional action */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {Icon && (
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-signal-500/[0.08] text-signal-600 sm:h-8 sm:w-8 sm:rounded-xl">
                <Icon size={16} strokeWidth={2.2} className="sm:h-[17px] sm:w-[17px]" />
              </div>
            )}
            {eyebrow && (
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-faint sm:text-[11px]">
                {eyebrow}
              </span>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {/* Title + description with refined typography */}
        <div className="space-y-2 sm:space-y-2.5">
          {title && (
            <h1 className="font-display text-[27px] font-bold leading-[1.15] tracking-[-0.024em] text-ink sm:text-[34px] sm:leading-[1.12]">
              {title}
            </h1>
          )}
          {description && (
            <p className="max-w-[min(100%,40rem)] text-[13px] leading-[1.5] text-ink-soft sm:text-[14px] sm:leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Refined separator with gradient fade */}
      <div className="mt-5 h-px bg-gradient-to-r from-line/50 via-line/25 to-transparent sm:mt-6" />
    </motion.header>
  );
}
