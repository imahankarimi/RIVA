"use client";

import { Delete } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/**
 * SPRING_PRESS borrowed from the reference motion system. Stiff + tightly
 * damped so a keypress reads as a confident mechanical tap, not a jelly
 * wiggle — the feel of a native financial keypad.
 */
const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;

/**
 * NumericKeypad
 *
 * Real mount for exact amounts. Every key is a real `<button>` with a
 * per-key tactile press (`whileTap` spring scale). The ⌫ key is neutral ink;
 * digit keys take RIVA's `rose`/`moss` accent only at hover/focus when the
 * keypad is the active surface, hinting at the current transaction type.
 * It drives the same raw amount string the form owns — no separate state.
 */
export function NumericKeypad({
  onDigit,
  onDot,
  onBackspace,
  accent = "signal",
  disabled = false,
}: {
  onDigit: (d: string) => void;
  onDot: () => void;
  onBackspace: () => void;
  /** Accent tint on hover for the digit keys. */
  accent?: "signal" | "rose" | "moss";
  disabled?: boolean;
}) {
  const accentHover =
    accent === "rose"
      ? "hover:bg-rose-100 hover:text-rose-700"
      : accent === "moss"
        ? "hover:bg-moss-100 hover:text-moss-700"
        : "hover:bg-line-soft hover:text-ink";

  return (
    <div className={cn("grid grid-cols-3 gap-2", disabled && "pointer-events-none opacity-45")}>
      {KEYS.map((key) => {
        const isBack = key === "back";
        return (
          <motion.button
            key={key}
            type="button"
            whileTap={disabled ? undefined : { scale: 0.94 }}
            transition={{ scale: SPRING_PRESS }}
            onClick={() => {
              if (isBack) onBackspace();
              else if (key === ".") onDot();
              else onDigit(key);
            }}
            aria-label={
              isBack ? "Backspace" : key === "." ? "Decimal point" : `Digit ${key}`
            }
            className={cn(
              "flex h-12 select-none items-center justify-center rounded-lg",
              "bg-surfaceMuted text-[17px] font-medium tabular-nums text-ink",
              "transition-colors duration-100 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-signal-500/40",
              isBack ? "text-ink-soft hover:bg-line-soft hover:text-ink" : accentHover
            )}
          >
            {isBack ? <Delete size={17} /> : key}
          </motion.button>
        );
      })}
    </div>
  );
}