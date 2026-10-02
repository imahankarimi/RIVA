// Central place for motion timing so every animation in the product
// feels like it belongs to the same system. Keep durations short —
// this is an accounting app, not a marketing site.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  fast: 0.12,
  base: 0.18,
  moderate: 0.24,
  slow: 0.32,
};

export const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 32 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 26 } as const;

/** Entrance: fade + rise, the workhorse for cards/messages/panels. */
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.moderate, ease: EASE_OUT } },
};

/** For lists — pass to a parent `motion.ul`/`motion.div` with `initial`/`animate`. */
export const staggerContainer = (staggerMs = 0.05, delayMs = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerMs, delayChildren: delayMs },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/** Subtle "alive" hover used on cards — direction-agnostic, safe for RTL. */
export const hoverLift = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -2, transition: SPRING_SOFT },
  tap: { scale: 0.99 },
};

export const hoverScaleSmall = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: SPRING_SOFT },
  tap: { scale: 0.97 },
};
