"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, DURATION, EASE_OUT } from "@/lib/motion/tokens";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "variants"> {
  delay?: number;
}

/** Fades + rises content into place. Use for panels, sections, one-off blocks. */
export function FadeIn({ delay = 0, children, ...props }: FadeInProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: DURATION.moderate, ease: EASE_OUT, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
