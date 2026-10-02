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
    <AnimatedCard delay={delay} className="relative overflow-hidden p-4 sm:p-5">
      {/* Subtle tonal accent at the top edge — ties the KPI to its semantic tone. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent",
          t.bar
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-ink-faint">{label}</span>

        <motion.span
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            t.tile
          )}
        >
          <Icon size={14} strokeWidth={2.2} />
        </motion.span>
      </div>

      <AnimatedNumber
        value={value}
        format={format}
        className={cn(
          "mt-2.5 block font-mono font-figures text-[23px] font-semibold tracking-tight sm:text-[25px]",
          tone === "positive" && "text-moss-700",
          tone === "negative" && "text-rose-700",
          tone === "default" && "text-ink"
        )}
      />

      {hasTrend && (
        <div className="mt-2 flex items-center gap-1 text-[11.5px]">
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.15 }}
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              trendFavorable ? "bg-moss-100/70 text-moss-700" : "bg-rose-100/70 text-rose-700"
            )}
          >
            {trendUp ? <ArrowUpRight size={12} strokeWidth={2.4} /> : <ArrowDownRight size={12} strokeWidth={2.4} />}
            {Math.abs(trendPct as number).toFixed(1)}%
          </motion.span>
          {trendLabel && <span className="text-ink-faint">{trendLabel}</span>}
        </div>
      )}
    </AnimatedCard>
  );
}