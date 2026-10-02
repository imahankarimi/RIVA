"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { EASE_OUT, staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { WebappHeader } from "@/components/webapp/WebappHeader";

export function ComingSoonPage({
  title,
  icon: Icon,
  descriptionKey,
}: {
  title: string;
  icon: LucideIcon;
  /** Dot-path into i18n dict, e.g. "comingSoon.debtsDesc". Falls back to generic body. */
  descriptionKey?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={title} title={title} />
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-4"
        >
          {/* Badge */}
          <motion.span
            variants={staggerItem}
            className="inline-flex items-center gap-1 rounded-full border border-signal-100 bg-signal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-signal-600"
          >
            {t("comingSoon.plannedTag")}
          </motion.span>

          {/* Icon */}
          <motion.div
            variants={staggerItem}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-line shadow-subtle text-ink-faint"
          >
            <Icon size={28} strokeWidth={1.6} />
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={staggerItem}
            className="font-display text-[20px] font-bold text-ink"
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={staggerItem}
            className="mx-auto max-w-sm text-[14px] leading-6 text-ink-soft"
          >
            {descriptionKey ? t(descriptionKey) : t("comingSoon.body")}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}