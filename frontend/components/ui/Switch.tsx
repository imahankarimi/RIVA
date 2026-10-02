"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "@/lib/motion/tokens";

const TRACK_WIDTH = 44; // px, matches w-11
const THUMB_SIZE = 20; // px, matches h-5 w-5
const TRACK_PADDING = 2; // px, matches inset of 0.5 (top-0.5/start-0.5)

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const { dir } = useI18n();
  const travel = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;
  // In RTL the track is mirrored (thumb rests on the end/right by default),
  // so "on" moves the thumb in the opposite pixel direction.
  const onX = dir === "rtl" ? -travel : travel;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
        checked ? "border-signal-500 bg-signal-500" : "border-line bg-surfaceMuted",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      <motion.span
        className="absolute top-0.5 start-0.5 block h-5 w-5 rounded-full bg-white shadow-card"
        animate={{ x: checked ? onX : 0, scale: checked ? 1 : 0.94 }}
        transition={SPRING_SNAPPY}
      />
    </button>
  );
}
