import { type LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { cn } from "@/lib/utils";

const toneStyles = {
  default: { tile: "bg-signal-100 text-signal-700", bar: "from-signal-500/40" },
  positive: { tile: "bg-moss-100 text-moss-700", bar: "from-moss-500" },
  negative: { tile: "bg-rose-100 text-rose-700", bar: "from-rose-500" },
} as const;

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  tone = "default",
  trendPct,
  trendLabel,
  /** Set true when an increase is unfavorable (e.g. Expenses) so color follows meaning, not just sign. */
  invertTrendColor = false,
  delay = 0,
}: {
  label: string;
  /** Raw numeric value — animates from its previous value on change. */
  value: number;
  /** Formats the animated number for display (currency/locale-aware). */
  format: (rounded: number) => string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
  /** Optional month-over-month percentage change, e.g. 12.4 or -8.1. */
  trendPct?: number;
  /** Short label under the trend, e.g. "vs last month". */
  trendLabel?: string;
  invertTrendColor?: boolean;
  delay?: number;
}) {
  const hasTrend = typeof trendPct === "number" && Number.isFinite(trendPct);
  const trendUp = hasTrend && (trendPct as number) >= 0;
  const trendFavorable = invertTrendColor ? !trendUp : trendUp;
  const t = toneStyles[tone];

  return (
    <AnimatedCard
      delay={delay}
      className="group relative overflow-hidden rounded-[18px] bg-surface p-4 shadow-[0_1px_3px_rgba(16,28,44,0.04)] ring-1 ring-line/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(16,28,44,0.08)] sm:p-5"
    >
      {/* Subtle tonal accent at the top edge — ties the KPI to its semantic tone */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r to-transparent transition-all duration-300 group-hover:h-[3px] group-hover:opacity-100",
          t.bar,
          "opacity-80"
        )}
      />

      {/* Inner glass reflection on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-[inherit] bg-gradient-to-b from-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/6"
      />

      {/* Hover glow effect */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at 50% 50%, ${
            tone === "positive"
              ? "rgba(62,154,109,0.06)"
              : tone === "negative"
              ? "rgba(181,67,58,0.06)"
              : "rgba(113,135,155,0.04)"
          }, transparent 40%)`,
        }}
      />

      <div className="relative space-y-4">
        {/* Header row — label and icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {label}
          </span>

          <motion.span
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-all duration-300 group-hover:shadow-md sm:h-9 sm:w-9",
              t.tile,
              tone === "positive" && "ring-moss-200/40",
              tone === "negative" && "ring-rose-200/40",
              tone === "default" && "ring-signal-200/40"
            )}
          >
            <Icon size={15} strokeWidth={2.3} className="sm:h-4 sm:w-4" />
          </motion.span>
        </div>

        {/* Value with enhanced typography */}
        <AnimatedNumber
          value={value}
          format={format}
          className={cn(
            "relative block font-mono font-figures text-[20px] font-bold tabular-nums tracking-tight transition-colors duration-300 sm:text-[22px]",
            tone === "positive" && "text-moss-700 dark:text-moss-500",
            tone === "negative" && "text-rose-700 dark:text-rose-500",
            tone === "default" && "text-ink"
          )}
        />

        {/* Trend indicator — always reserve space for consistent heights */}
        <div className="flex min-h-[26px] items-center gap-1.5 text-[11px]">
          {hasTrend && (
            <>
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.18, duration: 0.24 }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold ring-1 ring-inset",
                  trendFavorable
                    ? "bg-moss-100/80 text-moss-700 ring-moss-200/50"
                    : "bg-rose-100/80 text-rose-700 ring-rose-200/50"
                )}
              >
                {trendUp ? (
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.5} />
                )}
                {Math.abs(trendPct as number).toFixed(1)}%
              </motion.span>
              {trendLabel && (
                <span className="text-[10.5px] text-ink-faint">{trendLabel}</span>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}
