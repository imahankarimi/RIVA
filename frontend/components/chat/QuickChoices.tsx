"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickChoices({
  choices,
  onSelect,
  disabled,
  selected,
}: {
  choices: string[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
  /** Once the user has answered, the chosen option — every button then renders as resolved (non-interactive). */
  selected?: string;
}) {
  const resolved = Boolean(selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap gap-2"
    >
      {choices.map((choice) => {
        const isSelected = choice === selected;
        return (
          <button
            key={choice}
            disabled={disabled || resolved}
            onClick={() => onSelect(choice)}
            className={cn(
              "flex min-h-[38px] items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors duration-150",
              isSelected
                ? "border-signal-500 bg-signal-500 text-onSignal"
                : resolved
                  ? "border-line bg-surfaceMuted text-ink-faint opacity-60"
                  : "border-signal-300 bg-signal-50 text-signal-700 hover:bg-signal-100 disabled:opacity-40"
            )}
          >
            {isSelected && <Check size={13} strokeWidth={2.6} />}
            {choice}
          </button>
        );
      })}
    </motion.div>
  );
}
