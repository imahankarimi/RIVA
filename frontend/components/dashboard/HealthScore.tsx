"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  HeartPulseIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  LandmarkIcon,
  ArrowLeftRightIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import type { OverviewStats } from "@/lib/hooks/useOverview";

/**
 * Financial Health — ported from the reference Health Score card:
 * an animated semicircle gauge for an overall score, with a drill-down
 * factor list that swaps to a detail panel on click. The score is derived
 * from RIVA's real account math: revenue, expenses, cash flow and leverage
 * each contribute a factor the user can drill into.
 */

export interface HealthFactor {
  id: string;
  label: string;
  score: number;
  status: "excellent" | "good" | "fair" | "poor";
  description: string;
}

function deriveHealth(stats: OverviewStats): { overall: number; trend: string; trendDelta: number; factors: HealthFactor[] } {
  const { balance, revenue, expenses, cashFlow } = stats;

  const scorePct = (num: number) => Math.max(0, Math.min(100, Math.round(num)));

  // Margin factor: positive cash flow against revenue.
  const margin = revenue > 0 ? (cashFlow / revenue) * 100 : 0;
  const marginScore = scorePct(50 + margin * 0.6);

  // Spending discipline: expenses as a share of revenue (lower is better).
  const spendRatio = revenue > 0 ? expenses / revenue : 1.2;
  const spendScore = scorePct(Math.max(0, (1.2 - spendRatio) * 100) + (spendRatio <= 0.7 ? 20 : 0));

  // Solvency: balance positive and not deeply leveraged.
  const leverageScore = scorePct(balance >= 0 ? 70 + (balance > 0 ? 20 : 0) : 35);

  // Momentum: year runway proxy — average monthly net flow relative to balance.
  const momentumScore = scorePct(cashFlow !== 0 ? Math.abs(cashFlow) > Math.abs(balance) * 0.25 ? 72 : 60 : 55);

  const overall = scorePct(
    marginScore * 0.3 + spendScore * 0.3 + leverageScore * 0.2 + momentumScore * 0.2
  );

  const label = (s: number) =>
    s >= 80 ? "excellent" : s >= 60 ? "good" : s >= 40 ? "fair" : "poor";

  const factors: HealthFactor[] = [
    {
      id: "hf1",
      label: "Profit Margin",
      score: marginScore,
      status: label(marginScore),
      description:
        margin >= 0
          ? `You keep ${margin.toFixed(1)}% of revenue after expenses — ${margin >= 20 ? "a strong margin." : "room to widen with better cost control."}`
          : "Expenses outpace revenue this period, shrinking your margin.",
    },
    {
      id: "hf2",
      label: "Spending Discipline",
      score: spendScore,
      status: label(spendScore),
      description:
        spendRatio <= 0.7
          ? "Expenses are well under revenue — disciplined spend."
          : spendRatio <= 1
            ? "Expenses are creeping toward revenue — watch discretionary costs."
            : "Spending exceeds revenue. Tighten before the trend locks in.",
    },
    {
      id: "hf3",
      label: "Solvency",
      score: leverageScore,
      status: label(leverageScore),
      description:
        balance >= 0
          ? "Assets exceed liabilities on the books — a solvent position."
          : "Liabilities outweigh assets. Rebalancing capital is the priority.",
    },
    {
      id: "hf4",
      label: "Cash Momentum",
      score: momentumScore,
      status: label(momentumScore),
      description:
        cashFlow >= 0
          ? `Positive monthly cash flow adds ${formatDelta(cashFlow)} to the balance each period.`
          : `Negative monthly cash flow drains ${formatDelta(cashFlow)} from the balance each period.`,
    },
  ];

  return { overall, trend: cashFlow >= 0 ? "up" : "down", trendDelta: Math.abs(Math.round((cashFlow / Math.max(revenue, 1)) * 100)), factors };
}

function formatDelta(v: number) {
  return v >= 0 ? `+${v.toLocaleString()}` : v.toLocaleString();
}

const statusColor: Record<HealthFactor["status"], { text: string; bg: string; fill: string }> = {
  excellent: { text: "text-moss-700 dark:text-moss-500", bg: "bg-moss-500/10", fill: "var(--chart-2)" },
  good: { text: "text-signal-700 dark:text-signal-400", bg: "bg-signal-500/10", fill: "var(--color-primary)" },
  fair: { text: "text-amber-700 dark:text-amber-500", bg: "bg-amber-500/10", fill: "var(--chart-4)" },
  poor: { text: "text-rose-700 dark:text-rose-500", bg: "bg-rose-500/10", fill: "var(--chart-5)" },
};

const factorIcons: Record<string, React.ReactNode> = {
  hf1: <PiggyBankIcon className="size-4" />,
  hf2: <TrendingDownIcon className="size-4" />,
  hf3: <LandmarkIcon className="size-4" />,
  hf4: <ArrowLeftRightIcon className="size-4" />,
};

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const raf = useRef<ReturnType<typeof requestAnimationFrame>>(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    }
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return <>{count}</>;
}

const GAUGE_W = 180;
const GAUGE_H = 110;
const ARC_R = 70;
const ARC_CX = GAUGE_W / 2;
const ARC_CY = 95;
const STROKE = 12;
const HALF_CIRC = Math.PI * ARC_R;

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = { x: cx + r * Math.cos((startAngle * Math.PI) / 180), y: cy + r * Math.sin((startAngle * Math.PI) / 180) };
  const end = { x: cx + r * Math.cos((endAngle * Math.PI) / 180), y: cy + r * Math.sin((endAngle * Math.PI) / 180) };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function ScoreGauge({ score }: { score: number }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const from = score >= 60 ? (isDark ? "#58B585" : "#3E9A6D") : score >= 40 ? (isDark ? "#D9A04C" : "#C68A2E") : (isDark ? "#D6645A" : "#B5433A");
  const to = from;
  const gradientId = "health-gauge-grad";
  const glowId = "health-gauge-glow";
  const trackPath = describeArc(ARC_CX, ARC_CY, ARC_R, -180, 0);
  const scoreDash = (score / 100) * HALF_CIRC;
  const scoreGap = HALF_CIRC - scoreDash;

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute top-0 h-[90px] w-[160px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(ellipse, ${from}26 0%, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width={GAUGE_W} height={GAUGE_H} viewBox={`0 0 ${GAUGE_W} ${GAUGE_H}`} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={from} stopOpacity={0.25} />
            <stop offset="50%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={trackPath} fill="none" stroke="var(--color-muted, hsl(var(--muted)))" strokeWidth={STROKE} strokeLinecap="round" opacity={0.2} />
        <motion.path
          d={trackPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${HALF_CIRC}`}
          initial={{ strokeDashoffset: HALF_CIRC }}
          animate={{ strokeDashoffset: scoreGap }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          filter={`url(#${glowId})`}
        />
        <text x={ARC_CX - ARC_R - 2} y={ARC_CY + 14} textAnchor="middle" className="fill-muted-foreground/40 text-[9px] tabular-nums">0</text>
        <text x={ARC_CX} y={ARC_CY - ARC_R - 6} textAnchor="middle" className="fill-muted-foreground/40 text-[9px] tabular-nums">50</text>
        <text x={ARC_CX + ARC_R + 2} y={ARC_CY + 14} textAnchor="middle" className="fill-muted-foreground/40 text-[9px] tabular-nums">100</text>
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight">
          <AnimatedCounter target={score} />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function scoreLabel(score: number) {
  return score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";
}

function FactorDetail({ factor, onClose }: { factor: HealthFactor; onClose: () => void }) {
  const cfg = statusColor[factor.status];
  const RING_R = 22;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex size-9 items-center justify-center rounded-xl", cfg.bg, cfg.text)}>
            {factorIcons[factor.id]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{factor.label}</p>
            <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium", cfg.bg, cfg.text)}>
              {factor.status}
            </span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
          <XIcon className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-line bg-muted/30 p-3">
        <svg width="54" height="54" viewBox="0 0 54 54" className="shrink-0">
          <circle cx="27" cy="27" r={RING_R} fill="none" stroke="var(--color-muted, hsl(var(--muted)))" strokeWidth="5" opacity={0.3} />
          <motion.circle
            cx="27"
            cy="27"
            r={RING_R}
            fill="none"
            stroke={cfg.fill}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            initial={{ strokeDashoffset: RING_C }}
            animate={{ strokeDashoffset: RING_C - (factor.score / 100) * RING_C }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            transform="rotate(-90 27 27)"
          />
          <text x="27" y="27" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[11px] font-bold tabular-nums">
            {factor.score}
          </text>
        </svg>
        <p className="text-xs leading-relaxed text-muted-foreground">{factor.description}</p>
      </div>
    </motion.div>
  );
}

export function HealthScoreCard({ stats }: { stats: OverviewStats }) {
  const { t } = useI18n();
  const { overall, trend, trendDelta, factors } = deriveHealth(stats);
  const [selectedFactor, setSelectedFactor] = useState<HealthFactor | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <HeartPulseIcon className="size-4 text-primary" />
          {t("overview.financialHealth")}
        </CardTitle>
        <CardAction>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              trend === "up" ? "bg-moss-100/70 text-moss-700" : "bg-rose-100/70 text-rose-700"
            )}
          >
            {trend === "up" ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
            {trendDelta > 0 && "+"}{trendDelta} pts
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <ScoreGauge score={overall} />

          <div className="w-full">
            <AnimatePresence mode="wait">
              {selectedFactor ? (
                <FactorDetail key={selectedFactor.id} factor={selectedFactor} onClose={() => setSelectedFactor(null)} />
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                  {factors.map((factor, i) => {
                    const cfg = statusColor[factor.status];
                    return (
                      <motion.button
                        key={factor.id}
                        type="button"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.06 }}
                        onClick={() => setSelectedFactor(factor)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", cfg.bg, cfg.text)}>
                          {factorIcons[factor.id]}
                        </div>
                        <span className="flex-1 truncate text-xs font-medium text-foreground">{factor.label}</span>
                        <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: cfg.fill }}
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.score}%` }}
                            transition={{ duration: 0.7, delay: 0.8 + i * 0.06 }}
                          />
                        </div>
                        <span className="w-6 text-right text-[11px] font-semibold tabular-nums">{factor.score}</span>
                        <ChevronRightIcon className="size-3 text-muted-foreground rtl:rotate-180" />
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}