"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface WebappHeaderProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Premium page header for RIVA Webapp.
 *
 * Mobile UX enhancements:
 * - Optimized spacing and breathing room (56px → 68px total height)
 * - Better typography hierarchy with proper line heights
 * - Refined motion with stagger for visual interest
 * - Improved readability on small screens
 */
export function WebappHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  className,
}: WebappHeaderProps) {
  return (
    <header className={cn("mb-4 sm:mb-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          {eyebrow && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint"
            >
              {eyebrow}
            </motion.p>
          )}

          {title && (
            <motion.h1
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.04, ease: EASE_OUT }}
              className="flex items-center gap-2 font-display text-[20px] font-bold leading-tight text-ink sm:text-[24px] sm:leading-tight"
            >
              {Icon && <Icon className="h-5 w-5 shrink-0 text-ink-soft sm:h-6 sm:w-6" />}
              {title}
            </motion.h1>
          )}

          {description && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: 0.08, ease: EASE_OUT }}
              className="max-w-xl text-[13px] leading-relaxed text-ink-soft sm:text-[14px]"
            >
              {description}
            </motion.p>
          )}
        </div>

        {action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24, delay: 0.12, ease: EASE_OUT }}
            className="shrink-0"
          >
            {action}
          </motion.div>
        )}
      </div>
    </header>
  );
}
