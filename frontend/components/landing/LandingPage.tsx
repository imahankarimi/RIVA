"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Building2,
  Check,
  CreditCard,
  Database,
  Download,
  FileText,
  Globe2,
  HeartPulse,
  Landmark,
  Layers3,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { HeroVisual } from "@/components/landing/HeroVisual";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Shared bits
   -------------------------------------------------------------------------- */

function SectionLabel({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "light";
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.2em]",
        tone === "light" ? "text-warm-white/50" : "text-ink-faint"
      )}
    >
      <span className="h-px w-6 bg-current opacity-50" aria-hidden />
      {children}
    </p>
  );
}

function PrimaryCta({
  href,
  children,
  tone = "default",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-semibold shadow-subtle transition-all duration-200 ease-riva hover:-translate-y-0.5 active:translate-y-0",
        tone === "light"
          ? "bg-warm-white text-deep-ink hover:bg-warm-white/90"
          : "bg-signal-500 text-onSignal hover:bg-signal-600",
        className
      )}
    >
      {children}
      <ArrowRight
        size={15}
        strokeWidth={2.2}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function SecondaryCta({
  href,
  children,
  tone = "default",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-5 text-[14px] font-semibold transition-colors duration-200",
        tone === "light"
          ? "border-warm-white/20 text-warm-white hover:bg-warm-white/10"
          : "border-line text-ink hover:bg-surfaceMuted",
        className
      )}
    >
      {children}
    </Link>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-signal-100 text-signal-600">
        <Check size={12} strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-[13.5px] leading-[1.65] text-ink-soft">{children}</span>
    </li>
  );
}

/* --------------------------------------------------------------------------
   Hero
   -------------------------------------------------------------------------- */

const HERO_POINTS = [
  "One live financial position",
  "AI grounded in your ledger",
  "Reports you can export",
];

function Hero() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36"
    >
      <div aria-hidden className="landing-grid absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] landing-soft-glow"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <motion.div
            className="lg:col-span-6"
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={item}>
              <SectionLabel>AI-Powered Financial Intelligence OS</SectionLabel>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 max-w-[19ch] text-balance font-display text-[36px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[48px] xl:text-[62px]"
            >
              Beyond Accounting.
              <br />
              Into <span className="text-signal-400">Intelligence.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-[560px] text-[15.5px] leading-[1.7] text-ink-soft sm:text-[17px]"
            >
              RIVA transforms business financial data into actionable
              intelligence, helping businesses understand their financial
              position, anticipate risks, and make better decisions.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="#platform">Explore the platform</PrimaryCta>
              <SecondaryCta href="/login">Sign in to RIVA</SecondaryCta>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink-faint"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-signal-400" aria-hidden />
                Double-entry accounting
              </span>
              <span className="hidden h-3 w-px bg-line sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <BrainCircuit size={13} className="text-signal-400" aria-hidden />
                Grounded in your books
              </span>
              <span className="hidden h-3 w-px bg-line sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Check size={13} className="text-signal-400" aria-hidden />
                Human confirmation before writes
              </span>
            </motion.div>
          </motion.div>

          <div className="lg:col-span-6">
            <HeroVisual />
          </div>
        </div>

        <div className="landing-hairline mt-20 lg:mt-28" />
        <div className="grid gap-6 py-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
          {HERO_POINTS.map((point, index) => (
            <div
              key={point}
              className={cn(
                "flex items-baseline gap-3 sm:px-6",
                index === 0 && "sm:pl-0",
                index === HERO_POINTS.length - 1 && "sm:pr-0"
              )}
            >
              <span className="font-figures text-[10px] font-semibold tracking-[0.16em] text-ink-faint">
                0{index + 1}
              </span>
              <p className="text-[13px] font-medium text-ink-soft">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Positioning
   -------------------------------------------------------------------------- */

const PRINCIPLES = [
  {
    number: "01",
    title: "See the whole position",
    body: "Balance, revenue, expenses, and cash flow in one continuous view — across every account you keep.",
  },
  {
    number: "02",
    title: "Understand the movement",
    body: "Month-over-month comparisons, category breakdowns, and recurring charges, explained in plain language.",
  },
  {
    number: "03",
    title: "Act with context",
    body: "Recommendations grounded in your recorded transactions, not generic industry benchmarks.",
  },
];

function Positioning() {
  return (
    <section className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <SectionLabel>The shift</SectionLabel>
              <h2 className="mt-5 max-w-[18ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px] lg:text-[48px]">
                Accounting tells you what happened. RIVA helps you decide what
                happens next.
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-8">
              <p className="text-[15.5px] leading-[1.75] text-ink-soft">
                Your books already contain the signal. RIVA turns it into a
                live, conversational model of the business — so financial
                position, risk, and opportunity are never more than one
                question away.
              </p>
              <div className="mt-8 flex items-center gap-3 text-[11.5px] font-medium text-ink-faint">
                <span className="size-1.5 rounded-full bg-moss-500" />
                Built for founders, operators, and finance teams
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 sm:grid-cols-3 sm:gap-10 lg:mt-20">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.number} delay={index * 0.06}>
              <p className="font-figures text-[10px] font-semibold tracking-[0.16em] text-ink-faint">
                {principle.number}
              </p>
              <h3 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">
                {principle.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-soft">
                {principle.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Financial visibility
   -------------------------------------------------------------------------- */

const OVERVIEW_KPIS = [
  { label: "Balance", value: "$284,920", trend: "+2.4%", tone: "positive" },
  { label: "Revenue", value: "$128,400", trend: "+9.1%", tone: "positive" },
  { label: "Expenses", value: "$42,680", trend: "−12.0%", tone: "positive" },
  { label: "Cash flow", value: "+$18,430", trend: "+6.2%", tone: "positive" },
] as const;

const ACCOUNT_ROWS = [
  { label: "Cash", detail: "Operating account", value: "$42,180", icon: Wallet },
  { label: "Bank", detail: "Primary business", value: "$186,540", icon: Landmark },
  { label: "Card", detail: "Corporate card", value: "−$12,300", icon: CreditCard, negative: true },
  { label: "Income", detail: "Revenue account", value: "$128,400", icon: TrendingUp },
];

function VisibilityPanel() {
  const bars = [
    { month: "Jan", revenue: 58, expense: 40 },
    { month: "Feb", revenue: 72, expense: 48 },
    { month: "Mar", revenue: 64, expense: 44 },
    { month: "Apr", revenue: 88, expense: 58 },
    { month: "May", revenue: 78, expense: 52 },
    { month: "Jun", revenue: 104, expense: 62 },
  ];

  return (
    <div className="relative">
      <div aria-hidden className="landing-soft-glow pointer-events-none absolute -inset-10 opacity-70" />
      <div className="relative rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Financial overview
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink">
              The position, in one place
            </p>
          </div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-medium text-ink-faint">
            Last 6 months
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {OVERVIEW_KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-line-soft bg-surfaceMuted/50 px-3 py-2.5"
            >
              <p className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                {kpi.label}
              </p>
              <p className="mt-1 font-figures text-[15px] font-semibold tracking-tight text-ink">
                {kpi.value}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[9.5px] font-medium text-moss-700">
                <TrendingUp size={10} aria-hidden />
                {kpi.trend}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-line-soft p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-ink">Revenue vs. expenses</p>
            <div className="flex items-center gap-3 text-[9px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-sm bg-signal-500" />
                Revenue
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-sm bg-signal-300" />
                Expenses
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 560 150"
            role="img"
            aria-label="Illustrative six-month revenue and expense bars"
            className="mt-3 h-auto w-full"
          >
            <g className="text-line" stroke="currentColor" strokeWidth="1">
              {[20, 55, 90, 125].map((y) => (
                <line key={y} x1="0" y1={y} x2="560" y2={y} />
              ))}
            </g>
            {bars.map((bar, index) => {
              const x = 18 + index * 90;
              return (
                <g key={bar.month}>
                  <rect
                    x={x}
                    y={125 - bar.revenue}
                    width="18"
                    height={bar.revenue}
                    rx="2"
                    fill="rgb(var(--c-signal-500))"
                    opacity="0.9"
                  />
                  <rect
                    x={x + 24}
                    y={125 - bar.expense}
                    width="18"
                    height={bar.expense}
                    rx="2"
                    fill="rgb(var(--c-signal-300))"
                    opacity="0.8"
                  />
                  <text
                    x={x + 21}
                    y="145"
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    className="text-ink-faint"
                  >
                    {bar.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 divide-y divide-line-soft rounded-lg border border-line-soft">
          {ACCOUNT_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surfaceMuted text-ink-soft">
                  <Icon size={13} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium text-ink">{row.label}</p>
                  <p className="truncate text-[9.5px] text-ink-faint">{row.detail}</p>
                </div>
                <p
                  className={cn(
                    "font-figures text-[11.5px] font-semibold tabular-nums",
                    row.negative ? "text-rose-500" : "text-ink"
                  )}
                >
                  {row.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Visibility() {
  return (
    <section id="visibility" className="relative overflow-hidden border-t border-line py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-5">
          <SectionLabel>Financial visibility</SectionLabel>
          <h2 className="mt-5 max-w-[15ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px]">
            One live view of where the business stands.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.75] text-ink-soft">
            RIVA keeps the numbers connected. Every recorded transaction updates
            your position, your reports, and the context behind every answer.
          </p>
          <ul className="mt-7 space-y-3.5">
            <CheckItem>
              <strong className="font-semibold text-ink">A single financial position.</strong>{" "}
              Cash, bank, card, income, and expense accounts in one view.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">Trends with meaning.</strong>{" "}
              Revenue, expenses, and cash flow compared across the periods that
              matter.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">Drill down to the entry.</strong>{" "}
              Every insight can be traced back to the transactions that produced
              it.
            </CheckItem>
          </ul>
          <div className="mt-8">
            <PrimaryCta href="/login">Open the overview</PrimaryCta>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <VisibilityPanel />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Intelligence engine
   -------------------------------------------------------------------------- */

const PIPELINE = [
  {
    icon: BookOpen,
    title: "Your books",
    body: "Transactions, accounts, and balances held in double-entry form.",
  },
  {
    icon: Database,
    title: "Financial context",
    body: "Period-aware revenue, expenses, cash flow, and reports.",
  },
  {
    icon: BrainCircuit,
    title: "Reasoning",
    body: "A model with tools, not a black box — every query is explicit.",
  },
  {
    icon: MessageSquareText,
    title: "A clear answer",
    body: "Plain language, traceable figures, and the next question to ask.",
  },
] as const;

const ENGINE_CHIPS = [
  "Double-entry ledger",
  "Tool calling",
  "Server-side model",
  "Human confirmation",
];

function Intelligence() {
  return (
    <section
      id="intelligence"
      className="landing-on-navy relative overflow-hidden border-y border-warm-white/10 bg-deep-navy py-20 text-warm-white lg:py-28"
    >
      <div aria-hidden className="landing-panel-grid absolute inset-0 opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 size-[520px] rounded-full bg-signal-400/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <SectionLabel tone="light">The intelligence engine</SectionLabel>
            <h2 className="mt-5 max-w-[14ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-warm-white sm:text-[42px]">
              Grounded in your ledger, not the internet.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-warm-white/70">
              RIVA does not guess. It queries your accounts, transactions, and
              reports through a tool layer, then reasons over the result. Every
              answer is tied to your business&apos;s actual numbers.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {ENGINE_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-warm-white/[0.12] bg-warm-white/5 px-3 py-1.5 text-[10.5px] font-medium text-warm-white/60"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {PIPELINE.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="group rounded-xl border border-warm-white/10 bg-warm-white/[0.035] p-4 transition-colors duration-200 hover:bg-warm-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-8 items-center justify-center rounded-lg border border-warm-white/10 bg-warm-white/5 text-steel-blue">
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="font-figures text-[9.5px] font-semibold tracking-[0.16em] text-warm-white/30">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[13.5px] font-semibold text-warm-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-[1.65] text-warm-white/[0.55]">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-warm-white/10 bg-deep-ink/60 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-steel-blue" aria-hidden />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-warm-white/40">
                  Example exchange
                </p>
              </div>
              <p className="mt-3 text-[13px] font-medium text-warm-white/[0.85]">
                “How did this quarter compare to last?”
              </p>
              <div className="mt-3 border-t border-warm-white/10 pt-3">
                <p className="text-[12.5px] leading-[1.7] text-warm-white/[0.65]">
                  <span className="font-semibold text-steel-blue">RIVA</span>{" "}
                  Revenue is up 14% quarter over quarter, while expenses rose
                  6%. Cash flow improved on stronger collections, and the
                  largest single outflow was the equipment lease.
                </p>
                <p className="mt-2 text-[10px] text-warm-white/[0.35]">
                  Illustrative response generated from sample transactions.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   AI insights
   -------------------------------------------------------------------------- */

const INSIGHTS = [
  {
    icon: TrendingDown,
    title: "Spending trend",
    body: "Spending is 12% lower than last month — the savings are already showing.",
    category: "Expenses",
    trend: "−12%",
    surface: "bg-moss-100 text-moss-700",
    chip: "bg-moss-100 text-moss-700",
  },
  {
    icon: FileText,
    title: "Largest outflow",
    body: "“Equipment lease” was the largest outgoing this period.",
    category: "Operations",
    trend: "—",
    surface: "bg-amber-100 text-amber-700",
    chip: "bg-amber-100 text-amber-700",
  },
  {
    icon: TrendingUp,
    title: "Revenue momentum",
    body: "Revenue is up 9% versus last month — the momentum is real.",
    category: "Revenue",
    trend: "+9%",
    surface: "bg-moss-100 text-moss-700",
    chip: "bg-moss-100 text-moss-700",
  },
  {
    icon: RefreshCw,
    title: "Recurring charges",
    body: "Three vendors recur across multiple months. Review the cadence before it compounds.",
    category: "Recurring",
    trend: "3 found",
    surface: "bg-signal-100 text-signal-600",
    chip: "bg-signal-100 text-signal-600",
  },
] as const;

const SUGGESTIONS = [
  "Log an expense",
  "Log a payment received",
  "What's my balance?",
  "Summarize this month",
];

function AskPanel() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-signal-100 text-signal-600">
            <Sparkles size={13} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] font-semibold text-ink">RIVA AI</p>
            <p className="text-[9.5px] text-ink-faint">Grounded in this workspace</p>
          </div>
        </div>
        <span className="rounded-full border border-line px-2 py-0.5 text-[9.5px] text-ink-faint">
          Illustrative
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="ml-auto max-w-[86%] rounded-xl rounded-br-sm bg-signal-500 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-onSignal">
          What&apos;s my balance, and how did expenses move this month?
        </div>
        <div className="max-w-[92%] rounded-xl rounded-bl-sm bg-surfaceMuted px-3.5 py-3">
          <p className="text-[12.5px] leading-[1.7] text-ink">
            Your balance is{" "}
            <span className="font-figures font-semibold tabular-nums">$284,920</span>.
            Expenses are{" "}
            <span className="font-semibold text-moss-700">12% lower</span> than
            last month, driven by a drop in operations.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["Accounts", "Expenses", "This month"].map((source) => (
              <span
                key={source}
                className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[9px] text-ink-faint"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <span
            key={suggestion}
            className="rounded-full border border-line px-2.5 py-1 text-[10px] font-medium text-ink-soft"
          >
            {suggestion}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[11.5px] text-ink-faint">
          Ask about your finances…
        </p>
        <span className="flex size-6 items-center justify-center rounded-md bg-signal-500 text-onSignal">
          <Send size={11} aria-hidden />
        </span>
      </div>
    </div>
  );
}

function Insights() {
  return (
    <section id="insights" className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <Reveal className="max-w-3xl">
          <SectionLabel>AI-powered insights</SectionLabel>
          <h2 className="mt-5 max-w-[20ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px] lg:text-[46px]">
            Insight you can trace to a transaction.
          </h2>
          <p className="mt-5 max-w-[620px] text-[15px] leading-[1.75] text-ink-soft">
            RIVA reads the movement in your books and surfaces what deserves
            attention — the trend, the driver, and the next question to ask.
          </p>
        </Reveal>

        <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INSIGHTS.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Reveal key={insight.title} delay={index * 0.05}>
                <article className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-signal-300">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        insight.surface
                      )}
                    >
                      <Icon size={14} aria-hidden />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9.5px] font-semibold",
                        insight.chip
                      )}
                    >
                      {insight.trend}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[13.5px] font-semibold text-ink">
                    {insight.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-[1.65] text-ink-soft">
                    {insight.body}
                  </p>
                  <p className="mt-4 border-t border-line-soft pt-2.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                    {insight.category}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <AskPanel />
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-line bg-surfaceMuted/40 p-6 lg:p-7">
              <h3 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
                Ask in plain language.
              </h3>
              <p className="mt-3 text-[13.5px] leading-[1.7] text-ink-soft">
                No report builder, no query language. Ask about a period, a
                category, or a decision — RIVA resolves the numbers and explains
                what it found.
              </p>
              <ul className="mt-5 space-y-3">
                <CheckItem>Answers cite the accounts, expenses, or reports behind them.</CheckItem>
                <CheckItem>Record income or expenses by describing what happened.</CheckItem>
                <CheckItem>Every write is shown as a preview before it reaches the ledger.</CheckItem>
              </ul>
            </div>
          </Reveal>
        </div>

        <p className="mt-6 text-[10.5px] text-ink-faint">
          Illustrative insights generated from sample transaction data.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Decision support
   -------------------------------------------------------------------------- */

const HEALTH_FACTORS = [
  { label: "Profit margin", score: 86 },
  { label: "Spending discipline", score: 74 },
  { label: "Solvency", score: 91 },
  { label: "Cash momentum", score: 78 },
];

const REPORT_TYPES = [
  "Profit & loss",
  "Cash flow",
  "Expense report",
  "Balance sheet",
  "Trial balance",
  "Transaction report",
];

function HealthPanel() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Financial health
          </p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            A four-factor score
          </p>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-medium text-ink-faint">
          Illustrative
        </span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:items-center">
        <div className="relative flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 220 126"
            role="img"
            aria-label="Illustrative financial health score of 82 out of 100"
            className="w-full max-w-[220px]"
          >
            <path
              d="M 28 104 A 82 82 0 0 1 192 104"
              fill="none"
              stroke="rgb(var(--c-line))"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 28 104 A 82 82 0 0 1 192 104"
              fill="none"
              stroke="rgb(var(--c-moss-500))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="257.6"
              strokeDashoffset="46.4"
            />
            <text
              x="110"
              y="88"
              textAnchor="middle"
              fontSize="34"
              fontWeight="600"
              fill="currentColor"
              className="font-figures text-ink"
            >
              82
            </text>
            <text
              x="110"
              y="106"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-moss-700"
            >
              Excellent
            </text>
          </svg>
          <p className="mt-1 text-[10px] text-ink-faint">
            Overall health · last 30 days
          </p>
        </div>

        <div className="space-y-3">
          {HEALTH_FACTORS.map((factor) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11.5px] font-medium text-ink">{factor.label}</p>
                <p className="font-figures text-[10.5px] font-semibold tabular-nums text-ink-soft">
                  {factor.score}
                </p>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surfaceMuted">
                <div
                  className="h-full rounded-full bg-signal-500"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-line-soft pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Period-aware reports
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <span
              key={report}
              className="inline-flex items-center gap-1.5 rounded-md border border-line-soft px-2 py-1.5 text-[10.5px] text-ink-soft"
            >
              <FileText size={11} className="text-signal-400" aria-hidden />
              {report}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionSupport() {
  return (
    <section id="decision" className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-5">
          <SectionLabel>Decision support</SectionLabel>
          <h2 className="mt-5 max-w-[15ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px]">
            From reports to a recommendation you can act on.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.75] text-ink-soft">
            RIVA combines a four-factor financial health score with
            period-aware reports, so you can move from &ldquo;what
            happened&rdquo; to &ldquo;what to do&rdquo; without leaving the
            workspace.
          </p>
          <ul className="mt-7 space-y-3.5">
            <CheckItem>
              <strong className="font-semibold text-ink">Health, explained.</strong>{" "}
              Margin, spending discipline, solvency, and cash momentum each
              carry a score you can drill into.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">Reports on demand.</strong>{" "}
              Profit &amp; loss, cash flow, expense, balance sheet, trial
              balance, and transaction reports.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">Ready to leave the app.</strong>{" "}
              Export transaction data in CSV, JSON, XLSX, PDF, XML, ODS, TXT, or
              ZIP.
            </CheckItem>
          </ul>
          <p className="mt-6 text-[11.5px] leading-relaxed text-ink-faint">
            RIVA reports on the data you record. It does not replace statutory
            accounting or an auditor&apos;s review.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <HealthPanel />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Platform capabilities
   -------------------------------------------------------------------------- */

const CAPABILITIES = [
  {
    icon: MessageSquareText,
    tag: "AI",
    title: "Conversational entry",
    body: "Describe a payment or receipt in plain language. RIVA resolves the accounts and asks before recording.",
  },
  {
    icon: LineChart,
    tag: "Core",
    title: "Live overview",
    body: "Balance, revenue, expenses, and cash flow, kept current from your ledger.",
  },
  {
    icon: BarChart3,
    tag: "Reports",
    title: "Reports & analysis",
    body: "P&L, cash flow, expense, balance sheet, trial balance, and transaction reports.",
  },
  {
    icon: RefreshCw,
    tag: "AI",
    title: "Recurring detection",
    body: "Identify charges that repeat across months and review the cadence before it compounds.",
  },
  {
    icon: HeartPulse,
    tag: "Core",
    title: "Financial health",
    body: "A four-factor score with a drill-down into the numbers driving each factor.",
  },
  {
    icon: Building2,
    tag: "Workspace",
    title: "Multi-business",
    body: "Separate workspaces, each with its own base currency and set of books.",
  },
  {
    icon: Download,
    tag: "Data",
    title: "Export anywhere",
    body: "Take your transaction data out in CSV, JSON, XLSX, PDF, XML, ODS, TXT, or ZIP.",
  },
  {
    icon: Globe2,
    tag: "Access",
    title: "Bilingual by design",
    body: "English and Persian, with full right-to-left support and locale-aware formatting.",
  },
] as const;

function Capabilities() {
  return (
    <section id="platform" className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <SectionLabel>Platform</SectionLabel>
          <h2 className="mt-5 max-w-[20ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px]">
            A complete financial workspace, not a single feature.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.75] text-ink-soft">
            Every capability is built around the same ledger, so the answer you
            get in a conversation matches the report you open next.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-11">
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <div
                  key={capability.title}
                  className="group flex flex-col bg-paper p-5 transition-colors duration-200 hover:bg-surfaceMuted/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface text-signal-400">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      {capability.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[13.5px] font-semibold text-ink">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.65] text-ink-soft">
                    {capability.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Technology
   -------------------------------------------------------------------------- */

const ARCHITECTURE = [
  {
    index: "01",
    name: "Interface",
    tech: "Next.js 14 · TypeScript · Tailwind",
    label: "Client",
  },
  {
    index: "02",
    name: "Service",
    tech: "FastAPI · Pydantic · SQLAlchemy",
    label: "API",
  },
  {
    index: "03",
    name: "Ledger",
    tech: "PostgreSQL · double-entry accounting",
    label: "Data",
  },
  {
    index: "04",
    name: "Intelligence",
    tech: "OpenAI-compatible provider · tool calling",
    label: "AI",
  },
] as const;

const SECURITY_POINTS = [
  { icon: LockKeyhole, label: "JWT sessions with refresh tokens" },
  { icon: ShieldCheck, label: "bcrypt password hashing" },
  { icon: RefreshCw, label: "Rate-limited authentication" },
  { icon: BrainCircuit, label: "Server-side model keys only" },
  { icon: Check, label: "Human confirmation before ledger writes" },
];

function Technology() {
  return (
    <section id="technology" className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-10">
        <Reveal className="lg:col-span-5">
          <SectionLabel>Technology &amp; architecture</SectionLabel>
          <h2 className="mt-5 max-w-[12ch] text-balance font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[42px]">
            Engineered for trust.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.75] text-ink-soft">
            RIVA is built on a conventional, inspectable architecture: a
            Next.js interface, a FastAPI service, and a PostgreSQL ledger. The
            AI layer sits beside the ledger, never in front of it.
          </p>
          <ul className="mt-7 space-y-3">
            {SECURITY_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.label} className="flex items-center gap-2.5">
                  <Icon size={13} className="shrink-0 text-signal-400" aria-hidden />
                  <span className="text-[12.5px] text-ink-soft">{point.label}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="landing-on-navy rounded-2xl border border-warm-white/10 bg-deep-navy p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers3 size={14} className="text-steel-blue" aria-hidden />
                <p className="text-[11px] font-semibold text-warm-white">
                  RIVA architecture
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] text-warm-white/40">
                <span className="size-1.5 rounded-full bg-moss-500" />
                Server-side intelligence
              </span>
            </div>

            <div className="mt-5 space-y-0">
              {ARCHITECTURE.map((layer, index) => (
                <div key={layer.name} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < ARCHITECTURE.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-warm-white/10"
                    />
                  )}
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border border-warm-white/10 bg-warm-white/5 font-figures text-[9.5px] font-semibold text-warm-white/50">
                    {layer.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-warm-white">
                        {layer.name}
                      </p>
                      <span className="rounded-full border border-warm-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-warm-white/40">
                        {layer.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-warm-white/50">{layer.tech}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 border-t border-warm-white/10 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-warm-white/[0.35]">
                  Model calls
                </p>
                <p className="mt-1 text-[11.5px] text-warm-white/70">
                  Server-side only. No API keys in the browser.
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-warm-white/[0.35]">
                  Writes
                </p>
                <p className="mt-1 text-[11.5px] text-warm-white/70">
                  Previewed and confirmed before saving.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Final CTA
   -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <section className="relative border-t border-line py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
        <Reveal>
          <div className="landing-on-navy relative overflow-hidden rounded-2xl border border-warm-white/10 bg-deep-navy px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
            <div aria-hidden className="landing-panel-grid absolute inset-0 opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-signal-400/10 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <SectionLabel tone="light">Start here</SectionLabel>
                <h2 className="mt-5 max-w-[16ch] text-balance font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] text-warm-white sm:text-[46px] lg:text-[54px]">
                  Make the next decision a better one.
                </h2>
                <p className="mt-5 max-w-[560px] text-[14.5px] leading-[1.75] text-warm-white/[0.65]">
                  Bring your books into a workspace that explains itself. Sign
                  in to RIVA or create a new business workspace in minutes.
                </p>
              </div>
              <div className="lg:col-span-4 lg:justify-self-end">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <PrimaryCta href="/login" tone="light">
                    Sign in to RIVA
                  </PrimaryCta>
                  <SecondaryCta href="/login" tone="light">
                    Create your workspace
                  </SecondaryCta>
                </div>
                <p className="mt-4 text-[10.5px] text-warm-white/40">
                  English &amp; Persian · Multi-business · Export-ready
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

export function LandingPage() {
  return (
    <div dir="ltr" className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-signal-500 focus:px-4 focus:py-2.5 focus:text-[13px] focus:font-semibold focus:text-onSignal"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <Positioning />
        <Visibility />
        <Intelligence />
        <Insights />
        <DecisionSupport />
        <Capabilities />
        <Technology />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
