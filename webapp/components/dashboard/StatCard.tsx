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
    <AnimatedCard delay={delay} className="group relative overflow-hidden p-3.5 transition-all duration-240 hover:shadow-card hover:-translate-y-0.5 sm:p-4">
      {/* Subtle tonal accent at the top edge — ties the KPI to its semantic tone. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r to-transparent transition-all duration-300 group-hover:opacity-100 group-hover:h-[2.5px]",
          t.bar,
          "opacity-75"
        )}
      />

      {/* Inner glass reflection on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[inherit] bg-gradient-to-b from-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/8"
      />

      {/* Hover glow effect */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${
            tone === 'positive' ? 'rgba(62,154,109,0.08)' :
            tone === 'negative' ? 'rgba(181,67,58,0.08)' :
            'rgba(113,135,155,0.06)'
          }, transparent 40%)`
        }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>

        <motion.span
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md",
            t.tile
          )}
        >
          <Icon size={13} strokeWidth={2.3} />
        </motion.span>
      </div>

      <AnimatedNumber
        value={value}
        format={format}
        className={cn(
          "relative mt-3 block font-mono font-figures text-[16px] font-semibold tracking-tight transition-colors duration-300 sm:text-[18px]",
          tone === "positive" && "text-moss-700 dark:text-moss-500",
          tone === "negative" && "text-rose-700 dark:text-rose-500",
          tone === "default" && "text-ink"
        )}
      />

      {/* Always reserve space for trend to maintain consistent card heights across all metrics */}
      <div className="mt-2 flex min-h-[24px] items-center gap-1 text-[10.5px]">
        {hasTrend && (
          <>
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.15 }}
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                trendFavorable ? "bg-moss-100/70 text-moss-700" : "bg-rose-100/70 text-rose-700"
              )}
            >
              {trendUp ? <ArrowUpRight size={11} strokeWidth={2.5} /> : <ArrowDownRight size={11} strokeWidth={2.5} />}
              {Math.abs(trendPct as number).toFixed(1)}%
            </motion.span>
            {trendLabel && <span className="text-ink-faint">{trendLabel}</span>}
          </>
        )}
      </div>
    </AnimatedCard>
  );
}