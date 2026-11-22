"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  BrainCircuit,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useRef } from "react";

const REVENUE_PATH =
  "M0 156 C 26 148, 46 132, 72 138 S 116 120, 146 127 S 194 104, 222 111 S 270 92, 298 98 S 346 72, 374 83 S 422 61, 450 67 S 506 44, 532 50";
const EXPENSE_PATH =
  "M0 182 C 30 178, 48 170, 76 172 S 124 158, 152 164 S 200 150, 228 154 S 276 140, 304 146 S 352 132, 380 138 S 428 122, 456 128 S 512 114, 532 118";
const REVENUE_AREA = `${REVENUE_PATH} L 532 220 L 0 220 Z`;
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const KPIS = [
  { label: "Balance", value: "$284,920", trend: "+2.4%", positive: true },
  { label: "Revenue", value: "$128,400", trend: "+9.1%", positive: true },
  { label: "Cash flow", value: "+$18,430", trend: "+6.2%", positive: true },
];

export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 640], [0, -18]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
      {/* Atmosphere behind the product panel */}
      <div
        aria-hidden
        className="landing-hero-glow pointer-events-none absolute -inset-16 rounded-full opacity-80 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-6 hidden size-56 rounded-full border border-line/60 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 top-12 hidden size-40 rounded-full border border-line/40 lg:block"
      />

      <motion.div
        style={reduceMotion ? undefined : { y }}
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative"
      >
        <div className="landing-on-navy relative overflow-hidden rounded-2xl border border-warm-white/10 bg-deep-navy shadow-float ring-1 ring-inset ring-warm-white/5">
          <div aria-hidden className="landing-panel-grid absolute inset-0 opacity-60" />

          <div className="relative p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg border border-warm-white/10 bg-warm-white/5">
                  <BrainCircuit size={15} className="text-steel-blue" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-warm-white/[0.45]">
                    RIVA intelligence
                  </p>
                  <p className="text-[12px] font-medium text-warm-white/80">
                    Financial overview
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-white/10 bg-warm-white/5 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-warm-white/50">
                <span className="size-1.5 rounded-full bg-moss-500" />
                Product preview
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg border border-warm-white/[0.08] bg-warm-white/[0.035] px-2.5 py-2.5"
                >
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-warm-white/40">
                    {kpi.label}
                  </p>
                  <p className="mt-1 font-figures text-[15px] font-semibold tracking-tight text-warm-white sm:text-[17px]">
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9.5px] font-medium text-moss-500">
                    <TrendingDown
                      size={10}
                      className="-rotate-90"
                      aria-hidden
                    />
                    {kpi.trend}
                    <span className="font-normal text-warm-white/[0.35]">MoM</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-warm-white/[0.08] bg-warm-white/[0.025] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-warm-white/80">
                    Revenue vs. expenses
                  </p>
                  <p className="text-[9.5px] text-warm-white/[0.35]">
                    Last 12 months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-warm-white/50">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-px w-4 bg-moss-500" />
                    Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-px w-4 bg-steel-blue" />
                    Expenses
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 532 220"
                role="img"
                aria-label="Illustrative twelve-month revenue and expense trend"
                className="mt-2 h-auto w-full"
              >
                <defs>
                  <linearGradient id="riva-hero-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(var(--c-moss-500))"
                      stopOpacity="0.2"
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(var(--c-moss-500))"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <g className="text-warm-white/[0.08]" stroke="currentColor" strokeWidth="1">
                  {[36, 76, 116, 156, 196].map((line) => (
                    <line key={line} x1="0" y1={line} x2="532" y2={line} />
                  ))}
                </g>

                <motion.path
                  d={REVENUE_AREA}
                  fill="url(#riva-hero-revenue-fill)"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                />
                <motion.path
                  d={REVENUE_PATH}
                  fill="none"
                  stroke="rgb(var(--c-moss-500))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
                />
                <motion.path
                  d={EXPENSE_PATH}
                  fill="none"
                  stroke="rgb(var(--c-signal-400))"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                />

                <g className="text-warm-white/30" fill="currentColor" fontSize="9">
                  {MONTHS.map((month, index) => (
                    <text
                      key={`${month}-${index}`}
                      x={10 + index * 46.5}
                      y="216"
                    >
                      {month}
                    </text>
                  ))}
                </g>
              </svg>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-warm-white/[0.08] bg-warm-white/[0.035] px-3 py-2.5">
              <Sparkles size={13} className="shrink-0 text-steel-blue" />
              <p className="min-w-0 flex-1 truncate text-[11px] text-warm-white/[0.55]">
                Ask RIVA about this month…
              </p>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-warm-white/10 text-warm-white/70">
                <ArrowUpRight size={12} />
              </span>
            </div>
          </div>
        </div>

        {/* Floating insight — in flow on phones, overlapping on desktop */}
        <div className="landing-float relative mt-3 w-full rounded-xl border border-line bg-warm-white p-3.5 text-deep-ink shadow-float sm:absolute sm:-bottom-16 sm:-left-6 sm:mt-0 sm:w-[272px] lg:-left-10">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-moss-100 text-moss-700">
              <TrendingDown size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-deep-ink/[0.45]">
                RIVA insight
              </p>
              <p className="mt-1 text-[12px] font-medium leading-snug text-deep-ink">
                Spending is 12% lower than last month — the savings are already showing.
              </p>
              <p className="mt-1.5 text-[9.5px] text-deep-ink/[0.45]">
                Expense trend · derived from your transactions
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
