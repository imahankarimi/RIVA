"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";

/**
 * Animates a numeric value from its previous value to a new one and calls
 * `format` on every tick so callers can render currency/locale-aware text
 * (formatCurrency, formatNumber, etc.) instead of a raw number.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.6,
  className,
}: {
  value: number;
  format: (rounded: number) => string;
  duration?: number;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(() => format(0));
  const prev = useRef(0);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(format(Math.round(latest)));
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    prev.current = value;
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}
