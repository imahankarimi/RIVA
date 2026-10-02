"use client";

import { Sparkle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const KEYS = ["expense", "income", "balance", "report"] as const;

export function ChatSuggestions({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onPick(t(`assistant.suggestions.${key}`))}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[12px] font-medium text-ink-soft transition-colors duration-150 hover:border-signal-300 hover:bg-signal-50 hover:text-signal-700"
        >
          <Sparkle size={12} className="text-signal-500" />
          {t(`assistant.suggestions.${key}`)}
        </button>
      ))}
    </div>
  );
}
