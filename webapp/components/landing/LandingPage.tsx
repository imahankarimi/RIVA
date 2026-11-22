"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Check,
  Download,
  FileText,
  Globe2,
  HeartPulse,
  LineChart,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AssistantScreen,
  DashboardPreview,
  HomeScreen,
  PhoneFrame,
  ReportsScreen,
} from "@/components/landing/AppScreens";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Shared bits
   -------------------------------------------------------------------------- */

function SectionLabel({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em]",
        tone === "light" ? "text-warm-white/50" : "text-ink-faint",
        className
      )}
    >
      <span className="h-px w-5 bg-current opacity-50" aria-hidden />
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
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-signal-100 text-signal-600">
        <Check size={12} strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-[13px] leading-[1.65] text-ink-soft">{children}</span>
    </li>
  );
}

function LightCheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-warm-white/10 bg-warm-white/5 text-steel-blue">
        <Check size={12} strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-[12.5px] leading-[1.65] text-warm-white/[0.65]">
        {children}
      </span>
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

const HERO_TRUST = [
  { icon: ShieldCheck, label: "Double-entry ledger" },
  { icon: BrainCircuit, label: "Grounded in your books" },
  { icon: Check, label: "Confirm before writes" },
];

function Hero() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-12 pt-24 sm:pt-28 lg:pb-20 lg:pt-32"
    >
      <div aria-hidden className="landing-grid absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="landing-soft-glow pointer-events-none absolute inset-x-0 top-0 h-[560px]"
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <motion.div
            className="text-center lg:col-span-6 lg:text-left"
            variants={container}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={item}>
              <SectionLabel className="justify-center lg:justify-start">
                AI-Powered Financial Intelligence OS
              </SectionLabel>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-5 text-balance font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[52px] lg:text-[56px] xl:text-[62px]"
            >
              Beyond Accounting.
              <br />
              Into <span className="text-signal-400">Intelligence.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mt-5 max-w-[520px] text-[15px] leading-[1.7] text-ink-soft sm:text-[16.5px] lg:mx-0"
            >
              RIVA transforms business financial data into actionable
              intelligence, helping businesses understand their financial
              position, anticipate risks, and make better decisions.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <PrimaryCta href="/login" className="w-full sm:w-auto">
                Get started
              </PrimaryCta>
              <SecondaryCta href="/login" className="w-full sm:w-auto">
                Sign in
              </SecondaryCta>
            </motion.div>

            <motion.ul
              variants={item}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-ink-faint lg:justify-start"
            >
              {HERO_TRUST.map((point) => {
                const Icon = point.icon;
                return (
                  <li key={point.label} className="inline-flex items-center gap-1.5">
                    <Icon size={13} className="text-signal-400" aria-hidden />
                    {point.label}
                  </li>
                );
              })}
            </motion.ul>
          </motion.div>

          <motion.div
            className="relative lg:col-span-6"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <div
              aria-hidden
              className="landing-hero-glow pointer-events-none absolute inset-0 scale-110 rounded-full blur-2xl"
            />

            <div className="relative mx-auto w-full max-w-[320px]">
              <PhoneFrame>
                <HomeScreen />
              </PhoneFrame>

              <div className="landing-float absolute -left-6 -top-16 hidden rounded-xl border border-line bg-surface/[0.96] p-3 shadow-float backdrop-blur lg:block">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Spending
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-moss-700" aria-hidden />
                  <p className="font-figures text-[13px] font-semibold text-ink">
                    12% lower
                  </p>
                </div>
                <p className="mt-0.5 text-[9px] text-ink-faint">vs last month</p>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              RIVA Web · Live financial overview
            </p>
          </motion.div>
        </div>

        <div className="landing-hairline mt-12 lg:mt-16" />
        <div className="grid gap-4 py-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
          {HERO_POINTS.map((point, index) => (
            <div
              key={point}
              className={cn(
                "flex items-baseline gap-3 sm:px-5",
                index === 0 && "sm:pl-0",
                index === HERO_POINTS.length - 1 && "sm:pr-0"
              )}
            >
              <span className="font-figures text-[9.5px] font-semibold tracking-[0.16em] text-ink-faint">
                0{index + 1}
              </span>
              <p className="text-[12.5px] font-medium text-ink-soft">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Real application preview
   -------------------------------------------------------------------------- */

const SCREENS = [
  {
    title: "Financial overview",
    body: "Balance, revenue, expenses, and cash flow — with a four-factor health score that explains itself.",
    Screen: HomeScreen,
  },
  {
    title: "Conversational entry",
    body: "Describe what happened. RIVA resolves the accounts and shows a preview before anything is recorded.",
    Screen: AssistantScreen,
  },
  {
    title: "Reports & insights",
    body: "Expense breakdowns, period comparisons, and a plain-language read on what moved and why.",
    Screen: ReportsScreen,
  },
];

function Preview() {
  return (
    <section
      id="preview"
      className="relative overflow-hidden border-t border-line py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel className="justify-center">The application</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">
            The whole business, in your pocket.
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-[14.5px] leading-[1.7] text-ink-soft">
            A real look at the RIVA Web interface — home, conversation, and
            reports. Same ledger, same numbers, wherever you open it.
          </p>
        </Reveal>

        <div className="mt-10 lg:mt-14">
          <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0">
            {SCREENS.map((screen) => {
              const Screen = screen.Screen;
              return (
                <li
                  key={screen.title}
                  className="w-[300px] shrink-0 snap-center sm:w-[318px] lg:w-auto"
                >
                  <PhoneFrame>
                    <Screen />
                  </PhoneFrame>
                  <div className="mt-4 px-1">
                    <h3 className="text-[13.5px] font-semibold text-ink">
                      {screen.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-[1.6] text-ink-soft">
                      {screen.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-center text-[10px] uppercase tracking-[0.14em] text-ink-faint lg:hidden">
            Swipe to explore
          </p>
          <p className="mt-4 text-center text-[10.5px] text-ink-faint">
            Interface shown with sample data.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Financial visibility
   -------------------------------------------------------------------------- */

function Visibility() {
  return (
    <section
      id="visibility"
      className="relative overflow-hidden border-t border-line py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-10">
        <Reveal className="lg:col-span-5">
          <SectionLabel>Financial visibility</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">
            One live view of where the business stands.
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-ink-soft">
            RIVA keeps the numbers connected. Every recorded transaction updates
            your position, your reports, and the context behind every answer.
          </p>
          <ul className="mt-6 space-y-3.5">
            <CheckItem>
              <strong className="font-semibold text-ink">
                A single financial position.
              </strong>{" "}
              Cash, bank, card, income, and expense accounts in one view.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">Trends with meaning.</strong>{" "}
              Revenue, expenses, and cash flow compared across the periods that
              matter.
            </CheckItem>
            <CheckItem>
              <strong className="font-semibold text-ink">
                Drill down to the entry.
              </strong>{" "}
              Every insight can be traced back to the transactions that produced
              it.
            </CheckItem>
          </ul>
          <div className="mt-7">
            <PrimaryCta href="/login" className="w-full sm:w-auto">
              Open the overview
            </PrimaryCta>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-7">
          <div className="relative">
            <div
              aria-hidden
              className="landing-soft-glow pointer-events-none absolute -inset-6 opacity-70"
            />
            <div className="relative">
              <DashboardPreview />
            </div>
          </div>
          <p className="mt-3 text-[10.5px] text-ink-faint">
            Illustrative workspace preview with sample data.
          </p>
        </Reveal>
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

function Insights() {
  return (
    <section
      id="insights"
      className="relative border-t border-line py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <SectionLabel>AI-powered insights</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">
            Insight you can trace to a transaction.
          </h2>
          <p className="mt-4 max-w-[560px] text-[14.5px] leading-[1.75] text-ink-soft">
            RIVA reads the movement in your books and surfaces what deserves
            attention — the trend, the driver, and the next question to ask.
          </p>
        </Reveal>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <p className="mt-5 text-[10.5px] text-ink-faint">
          Illustrative insights generated from sample transaction data.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Ask RIVA
   -------------------------------------------------------------------------- */

const SUGGESTIONS = [
  "Log an expense",
  "Log a payment received",
  "What's my balance?",
  "Summarize this month",
];

function AskPanel() {
  return (
    <div className="rounded-2xl border border-warm-white/10 bg-deep-ink/70 p-4 shadow-float sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-warm-white/10 bg-warm-white/5 text-steel-blue">
            <Sparkles size={13} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] font-semibold text-warm-white">RIVA AI</p>
            <p className="text-[9.5px] text-warm-white/[0.4]">
              Grounded in this workspace
            </p>
          </div>
        </div>
        <span className="rounded-full border border-warm-white/10 px-2 py-0.5 text-[9px] text-warm-white/[0.4]">
          Illustrative
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="ml-auto max-w-[88%] rounded-xl rounded-br-sm bg-warm-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-deep-ink sm:max-w-[440px]">
          What&apos;s my balance, and how did expenses move this month?
        </div>
        <div className="max-w-[94%] rounded-xl rounded-bl-sm border border-warm-white/10 bg-warm-white/[0.045] px-3.5 py-3 sm:max-w-[520px]">
          <p className="text-[12.5px] leading-[1.7] text-warm-white/[0.75]">
            Your balance is{" "}
            <span className="font-figures font-semibold text-warm-white">
              $284,920
            </span>
            . Expenses are{" "}
            <span className="font-semibold text-moss-500">12% lower</span> than
            last month, driven by a drop in operations.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["Accounts", "Expenses", "This month"].map((source) => (
              <span
                key={source}
                className="rounded-md border border-warm-white/10 bg-warm-white/[0.04] px-1.5 py-0.5 text-[9px] text-warm-white/[0.45]"
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
            className="rounded-full border border-warm-white/10 px-2.5 py-1 text-[10px] font-medium text-warm-white/[0.55]"
          >
            {suggestion}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-warm-white/10 bg-deep-navy px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[11.5px] text-warm-white/[0.35]">
          Ask about your finances…
        </p>
        <span className="flex size-6 items-center justify-center rounded-md bg-warm-white text-deep-ink">
          <Send size={11} aria-hidden />
        </span>
      </div>
    </div>
  );
}

function Ask() {
  return (
    <section
      id="ask"
      className="landing-on-navy relative overflow-hidden border-y border-warm-white/10 bg-deep-navy py-16 text-warm-white sm:py-20 lg:py-28"
    >
      <div aria-hidden className="landing-panel-grid absolute inset-0 opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full bg-signal-400/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-10">
        <Reveal className="lg:col-span-5">
          <SectionLabel tone="light">Ask RIVA</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-warm-white sm:text-[38px]">
            Ask in plain language. Get an answer tied to your books.
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-warm-white/[0.65]">
            No report builder, no query language. Ask about a period, a
            category, or a decision — RIVA resolves the numbers and explains
            what it found.
          </p>
          <ul className="mt-6 space-y-3">
            <LightCheckItem>
              Answers cite the accounts, expenses, or reports behind them.
            </LightCheckItem>
            <LightCheckItem>
              Record income or expenses by describing what happened.
            </LightCheckItem>
            <LightCheckItem>
              Every write is shown as a preview before it reaches the ledger.
            </LightCheckItem>
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-7">
          <AskPanel />
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
    <section
      id="capabilities"
      className="relative border-t border-line py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <SectionLabel>Capabilities</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">
            A complete financial workspace, not a single feature.
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.75] text-ink-soft">
            Every capability is built around the same ledger, so the answer you
            get in a conversation matches the report you open next.
          </p>
        </Reveal>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Reveal key={capability.title} delay={(index % 4) * 0.04}>
                <div className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surfaceMuted/50">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-paper text-signal-400">
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
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   How it works
   -------------------------------------------------------------------------- */

const STEPS = [
  {
    title: "Create your workspace",
    body: "Sign up with a business name and base currency. RIVA provisions the accounts that sit behind every number.",
  },
  {
    title: "Record what happened",
    body: "Describe a payment or receipt in plain language, or add it manually. Review the preview before it reaches the ledger.",
  },
  {
    title: "Ask, understand, decide",
    body: "Ask about a period or category, open a report, and export the data when you need it outside the app.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-line py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <Reveal className="max-w-2xl">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-4 text-balance font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[38px]">
            From a sentence to a decision in three steps.
          </h2>
        </Reveal>

        <ol className="mt-9 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.06}>
              <li className="relative flex h-full flex-col rounded-xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-signal-100 font-figures text-[11px] font-semibold text-signal-600">
                    0{index + 1}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="hidden text-ink-faint md:block"
                    >
                      <ArrowRight size={14} />
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-ink-soft">
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>

        <p className="mt-6 max-w-[620px] text-[11px] leading-relaxed text-ink-faint">
          RIVA reports on the data you record. It does not replace statutory
          accounting or an auditor&apos;s review.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Final CTA
   -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <section className="relative border-t border-line py-16 sm:py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-10">
        <Reveal>
          <div className="landing-on-navy relative overflow-hidden rounded-2xl border border-warm-white/10 bg-deep-navy px-5 py-12 sm:px-8 lg:px-14 lg:py-16">
            <div aria-hidden className="landing-panel-grid absolute inset-0 opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-signal-400/10 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <SectionLabel tone="light">Start here</SectionLabel>
                <h2 className="mt-4 text-balance font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-warm-white sm:text-[42px] lg:text-[48px]">
                  Make the next decision a better one.
                </h2>
                <p className="mt-4 max-w-[520px] text-[14px] leading-[1.75] text-warm-white/[0.65]">
                  Bring your books into a workspace that explains itself. Sign
                  in to RIVA or create a new business workspace in minutes.
                </p>
              </div>
              <div className="lg:col-span-5 lg:justify-self-end">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <PrimaryCta href="/login" tone="light" className="w-full sm:w-auto">
                    Get started
                  </PrimaryCta>
                  <SecondaryCta href="/login" tone="light" className="w-full sm:w-auto">
                    Sign in
                  </SecondaryCta>
                </div>
                <p className="mt-4 text-[10.5px] text-warm-white/[0.4]">
                  English &amp; Persian · Multi-business · Installable web app
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
    <div dir="ltr" className="min-h-screen overflow-x-hidden bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-signal-500 focus:px-4 focus:py-2.5 focus:text-[13px] focus:font-semibold focus:text-onSignal"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <Preview />
        <Visibility />
        <Insights />
        <Ask />
        <Capabilities />
        <HowItWorks />
        <FinalCta />
      </main>
      <LandingFooter />
      <MobileCtaBar />
    </div>
  );
}
