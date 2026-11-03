"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING_INDICATOR = { type: "spring", stiffness: 420, damping: 40, mass: 0.5 } as const;

export type TransactionKind = "spent" | "income";

/**
 * TransactionTypeTabs
 *
 * Segmented Spent/Income control. The active indicator is a single
 * `layoutId` shared motion element, so it travels continuously between the
 * two labels with a spring instead of disappearing/reappearing. Colors follow
 * RIVA's semantic tokens: spent uses rose (danger), income uses moss
 * (success). The active fill is a solid token fill with `onSignal` foreground
 * — the same pattern RIVA uses for `bg-primary`, so it themes correctly in
 * light and dark without hardcoded colors.
 */
export function TransactionTypeTabs({
  value,
  onChange,
  spentLabel,
  incomeLabel,
  ariaLabel,
}: {
  value: TransactionKind;
  onChange: (value: TransactionKind) => void;
  spentLabel: string;
  incomeLabel: string;
  /** Accessible name for the group, e.g. "Transaction type" / "نوع تراکنش". */
  ariaLabel?: string;
}) {
  const options: Array<{ key: TransactionKind; label: string; fill: string }> = [
    { key: "spent", label: spentLabel, fill: "bg-rose-500" },
    { key: "income", label: incomeLabel, fill: "bg-moss-500" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative grid grid-cols-2 items-stretch rounded-lg bg-surfaceMuted p-1"
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative z-10 flex h-9 items-center justify-center rounded-md text-[13.5px] font-medium",
              "transition-colors duration-150 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-signal-500/40 focus-visible:ring-offset-1",
              active ? "text-onSignal" : "text-ink-soft hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId="transaction-type-indicator"
                role="presentation"
                className={cn("pointer-events-none absolute inset-0 rounded-md", opt.fill)}
                transition={SPRING_INDICATOR}
              />
            )}
            <span className={cn("relative z-10 transition-colors duration-150", active && "font-semibold")}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}