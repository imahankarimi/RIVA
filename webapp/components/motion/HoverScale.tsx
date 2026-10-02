"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { hoverScaleSmall } from "@/lib/motion/tokens";

interface HoverScaleProps extends HTMLMotionProps<"div"> {
  /** Slightly stronger lift for large surfaces like dashboard cards. */
  lift?: boolean;
}

/**
 * Wrap any interactive block (card, row, tile) to get the subtle
 * "zoom in on hover" feel used throughout the app. Scale amounts are
 * intentionally small (1.01–1.02) — see lib/motion/tokens.ts.
 */
export function HoverScale({ lift, children, ...props }: HoverScaleProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate="rest"
      variants={
        lift
          ? {
              rest: { scale: 1, y: 0 },
              hover: { scale: 1.015, y: -2, transition: { type: "spring", stiffness: 300, damping: 26 } },
              tap: { scale: 0.99 },
            }
          : hoverScaleSmall
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
