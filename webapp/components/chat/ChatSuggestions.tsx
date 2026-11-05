"use client";

import { TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  { key: "expense", icon: TrendingDown },
  { key: "income", icon: TrendingUp },
  { key: "balance", icon: DollarSign },
  { key: "report", icon: FileText },
] as const;

export function ChatSuggestions({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      {SUGGESTIONS.map(({ key, icon: Icon }) => (
        <motion.button
          key={key}
          onClick={() => onPick(t(`assistant.suggestions.${key}`))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3 text-left shadow-sm transition-all hover:border-signal-300 hover:bg-signal-50 hover:shadow-md dark:hover:bg-signal-950/20 sm:gap-3 sm:p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-100 text-signal-600 transition-colors group-hover:bg-signal-200 dark:bg-signal-900/40 dark:text-signal-400 sm:h-10 sm:w-10">
            <Icon size={16} strokeWidth={2} className="sm:hidden" />
            <Icon size={18} strokeWidth={2} className="hidden sm:block" />
          </div>
          <span className="text-[13px] font-medium text-ink-soft transition-colors group-hover:text-ink sm:text-[14px]">
            {t(`assistant.suggestions.${key}`)}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
