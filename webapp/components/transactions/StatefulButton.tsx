"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion/tokens";

const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;

/**
 * StatefulButton
 *
 * A submit-style button with an explicit state machine: idle → loading →
 * success (transient) → idle again, or idle → loading → error → idle with the
 * content intact. It never blocks the user arbitrarily — the disabled state
 * only covers the loading phase, and an error always returns to an enabled,
 * fully-intact button with the label restored.
 */
export function StatefulButton({
  idleLabel,
  loadingLabel,
  successLabel,
  errorLabel,
  state,
  disabled,
  onClick,
  className,
  type = "button",
  tone = "primary",
}: {
  idleLabel: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  state: "idle" | "loading" | "success" | "error";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  /** Semantic tone for the fill — matches RIVA's income (moss) / spent (rose) accents. */
  tone?: "primary" | "rose" | "moss";
}) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      transition={SPRING_PRESS}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex h-12 w-full items-center justify-center overflow-hidden",
        "rounded-lg text-[15px] font-semibold text-onSignal",
        "shadow-subtle transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500/40 focus-visible:ring-offset-1",
        "disabled:opacity-60 disabled:hover:scale-100",
        tone === "rose"
          ? "bg-rose-500 hover:bg-rose-700"
          : tone === "moss"
            ? "bg-moss-500 hover:bg-moss-700"
            : "bg-primary hover:bg-primary/90",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex items-center gap-2"
          >
            <Check size={16} strokeWidth={2.5} />
            {successLabel}
          </motion.span>
        ) : (
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="flex items-center gap-2"
          >
            {state === "loading" ? (
              <>
                <motion.span
                  aria-hidden
                  className="size-4 rounded-full border-2 border-current border-r-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 0.7 }}
                />
                {loadingLabel}
              </>
            ) : state === "error" ? (
              errorLabel ?? idleLabel
            ) : (
              idleLabel
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}