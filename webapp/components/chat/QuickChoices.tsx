"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/glisse";

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
          <Button
            key={choice}
            variant="glass"
            disabled={disabled || resolved}
            onClick={() => onSelect(choice)}
            className={cn(
              "min-h-[38px] rounded-full border px-4 text-[13px]",
              isSelected
                ? "border-signal-500 bg-signal-500 text-onSignal"
                : resolved
                  ? "border-line bg-surfaceMuted text-ink-faint opacity-60"
                  : "border-signal-300 bg-signal-50 text-signal-700 hover:bg-signal-100"
            )}
            icon={isSelected ? <Check size={13} strokeWidth={2.6} /> : undefined}
          >
            {choice}
          </Button>
        );
      })}
    </motion.div>
  );
}
