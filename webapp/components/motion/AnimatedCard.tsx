"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, SPRING_SOFT } from "@/lib/motion/tokens";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Disable the hover lift for cards that aren't clickable/interactive. */
  interactive?: boolean;
}

/**
 * The standard card surface used across dashboard/reports/accounts:
 * fades up on mount, lifts subtly on hover when interactive.
 * Composes with the existing `Card` styling — pass the same className.
 */
export function AnimatedCard({
  className,
  delay = 0,
  interactive = true,
  children,
  ...props
}: AnimatedCardProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: DURATION.moderate, ease: EASE_OUT, delay } },
    hover: { scale: 1.01, y: -1, transition: SPRING_SOFT },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive ? "tap" : undefined}
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-subtle",
        interactive && "hover:shadow-card cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
