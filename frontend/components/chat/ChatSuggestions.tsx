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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SUGGESTIONS.map(({ key, icon: Icon }) => (
        <motion.button
          key={key}
          onClick={() => onPick(t(`assistant.suggestions.${key}`))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:border-signal-300 hover:bg-signal-50 hover:shadow-md dark:hover:bg-signal-950/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-100 text-signal-600 transition-colors group-hover:bg-signal-200 dark:bg-signal-900/40 dark:text-signal-400">
            <Icon size={18} strokeWidth={2} />
          </div>
          <span className="text-[14px] font-medium text-ink-soft transition-colors group-hover:text-ink">
            {t(`assistant.suggestions.${key}`)}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
