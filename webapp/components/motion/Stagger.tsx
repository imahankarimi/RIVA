"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";

type Tag = "div" | "ul" | "li" | "section";

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerMs?: number;
  delayMs?: number;
  as?: Tag;
}

/** Parent for a group of StaggerItems — stat cards, transaction rows, report cards. */
export function StaggerContainer({
  staggerMs = 0.06,
  delayMs = 0,
  as = "div",
  children,
  ...props
}: StaggerContainerProps) {
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      variants={staggerContainer(staggerMs, delayMs)}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  as?: Tag;
}

export function StaggerItem({
  as = "div",
  className,
  children,
  ...props
}: StaggerItemProps) {
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      variants={staggerItem}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
}