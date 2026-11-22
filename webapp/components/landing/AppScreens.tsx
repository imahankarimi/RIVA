"use client";

import {
  BarChart3,
  BatteryFull,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  History,
  Home,
  Landmark,
  LayoutGrid,
  Paperclip,
  Plus,
  Send,
  Signal,
  Sparkle,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
} from "lucide-react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/landing/BrandMark";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   Device frame
   -------------------------------------------------------------------------- */

export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[300px] sm:max-w-[318px]", className)}>
      <div className="landing-device relative rounded-[2.65rem] border border-warm-white/15 bg-deep-ink p-[6px] ring-1 ring-warm-white/5">
        <div className="relative h-[596px] overflow-hidden rounded-[2.25rem] bg-deep-ink text-warm-white">
          <div
            aria-hidden
            className="absolute left-1/2 top-2.5 z-30 h-[21px] w-[84px] -translate-x-1/2 rounded-full bg-black/80 ring-1 ring-warm-white/10"
          />
          <div className="flex h-full flex-col pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-2 text-[8.5px] font-medium text-warm-white/65">
      <span className="font-figures tracking-tight">9:41</span>
      <div className="flex items-center gap-1">
        <Signal size={9} aria-hidden />
        <Wifi size={9} aria-hidden />
        <BatteryFull size={11} aria-hidden />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Shared phone pieces
   -------------------------------------------------------------------------- */

const TABS: ReadonlyArray<{
  id: "home" | "cash" | "assistant" | "reports" | "more";
  label: string;
  icon: typeof Home;
  hero?: boolean;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "cash", label: "Cash", icon: Wallet },
  { id: "assistant", label: "RIVA", icon: Sparkle, hero: true },
  { id: "reports", label: "Insights", icon: BarChart3 },
  { id: "more", label: "More", icon: LayoutGrid },
];

function TabBar({ active }: { active: "home" | "cash" | "assistant" | "reports" | "more" }) {
  return (
    <div className="mt-auto shrink-0 border-t border-warm-white/10 bg-deep-ink px-2 pb-2 pt-1.5">
      <div className="flex items-end justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          if (tab.hero) {
            return (
              <div key={tab.id} className="flex -mt-4 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full shadow-lg ring-4 ring-deep-ink",
                    isActive
                      ? "bg-warm-white text-deep-ink"
                      : "bg-warm-white/90 text-deep-ink"
                  )}
                >
                  <Icon size={15} aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-[7px] font-medium",
                    isActive ? "text-warm-white" : "text-warm-white/40"
                  )}
                >
                  {tab.label}
                </span>
              </div>
            );
          }
          return (
            <div key={tab.id} className="flex flex-col items-center gap-1">
              <Icon
                size={14}
                className={isActive ? "text-warm-white" : "text-warm-white/35"}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[7px] font-medium",
                  isActive ? "text-warm-white" : "text-warm-white/35"
                )}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  trend,
  icon: Icon,
  positive = true,
}: {
  label: string;
  value: string;
  trend: string;
  icon: typeof Wallet;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[7.5px] font-medium uppercase tracking-[0.1em] text-warm-white/40">
          {label}
        </p>
        <Icon size={9} className="text-steel-blue" aria-hidden />
      </div>
      <p className="mt-1 font-figures text-[12.5px] font-semibold tracking-tight text-warm-white">
        {value}
      </p>
      <p
        className={cn(
          "mt-0.5 text-[7.5px] font-medium",
          positive ? "text-moss-500" : "text-rose-500"
        )}
      >
        {trend}
      </p>
    </div>
  );
}

function MiniGauge({ score }: { score: number }) {
  const length = Math.PI * 20;
  const dash = (score / 100) * length;

  return (
    <svg
      width="52"
      height="30"
      viewBox="0 0 52 30"
      role="img"
      aria-label={`Financial health ${score} out of 100`}
      className="shrink-0"
    >
      <path
        d="M 6 26 A 20 20 0 0 1 46 26"
        fill="none"
        stroke="rgb(247 247 243 / 0.12)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 6 26 A 20 20 0 0 1 46 26"
        fill="none"
        stroke="rgb(var(--c-moss-500))"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${length}`}
      />
      <text
        x="26"
        y="24"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="rgb(247 247 243)"
      >
        {score}
      </text>
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Home
   -------------------------------------------------------------------------- */

const HOME_TRANSACTIONS = [
  { name: "Client payment", category: "Revenue", amount: "+$12,400", positive: true, icon: TrendingUp },
  { name: "Electricity", category: "Utilities", amount: "−$150", positive: false, icon: TrendingDown },
  { name: "Equipment lease", category: "Operations", amount: "−$2,300", positive: false, icon: CreditCard },
] as const;

export function HomeScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pt-1.5">
        <BrandMark tone="light" width={48} />
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-full border border-warm-white/10 bg-deep-navy">
            <Bell size={10} className="text-warm-white/60" aria-hidden />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-warm-white/10 text-[7.5px] font-semibold text-warm-white">
            S
          </span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <p className="text-[8px] font-medium uppercase tracking-[0.14em] text-warm-white/40">
          Good morning
        </p>
        {/* Not a heading: this is a decorative in-device screen title that
            duplicates the visible caption outside the frame, and a heading
            here would jump from the page h1 straight to h3. */}
        <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.025em] text-warm-white">
          Financial overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pt-2.5">
        <KpiTile label="Balance" value="$284,920" trend="+2.4% MoM" icon={Wallet} />
        <KpiTile label="Revenue" value="$128,400" trend="+9.1% MoM" icon={TrendingUp} />
        <KpiTile label="Expenses" value="$42,680" trend="−12.0% MoM" icon={TrendingDown} />
        <KpiTile label="Cash flow" value="+$18,430" trend="+6.2% MoM" icon={Landmark} />
      </div>

      <div className="mx-4 mt-2 flex items-center gap-2.5 rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
        <MiniGauge score={82} />
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-medium uppercase tracking-[0.1em] text-warm-white/40">
            Financial health
          </p>
          <p className="mt-0.5 text-[10.5px] font-semibold text-warm-white">Excellent</p>
          <p className="text-[7.5px] text-warm-white/35">Four-factor score</p>
        </div>
        <ChevronRight size={11} className="text-warm-white/30" aria-hidden />
      </div>

      <div className="mx-4 mt-2 overflow-hidden rounded-xl border border-warm-white/10 bg-deep-navy">
        <div className="flex items-center justify-between px-3 pt-2.5">
          <p className="text-[9px] font-semibold text-warm-white">Recent activity</p>
          <p className="text-[7.5px] font-medium text-steel-blue">See all</p>
        </div>
        <div className="mt-1 divide-y divide-warm-white/5">
          {HOME_TRANSACTIONS.map((tx) => {
            const Icon = tx.icon;
            return (
              <div key={tx.name} className="flex items-center gap-2 px-3 py-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md",
                    tx.positive
                      ? "bg-moss-100 text-moss-700"
                      : "bg-warm-white/5 text-warm-white/50"
                  )}
                >
                  <Icon size={10} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-medium text-warm-white">
                    {tx.name}
                  </p>
                  <p className="text-[7.5px] text-warm-white/35">{tx.category}</p>
                </div>
                <p
                  className={cn(
                    "font-figures text-[9px] font-semibold",
                    tx.positive ? "text-moss-500" : "text-rose-500"
                  )}
                >
                  {tx.amount}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-2 flex items-center gap-2.5 rounded-xl border border-warm-white/10 bg-gradient-to-br from-warm-white/10 to-warm-white/[0.03] p-2.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-warm-white/10 text-steel-blue">
          <Sparkle size={12} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[7.5px] font-semibold uppercase tracking-[0.12em] text-warm-white/40">
            RIVA AI
          </p>
          <p className="mt-0.5 text-[9.5px] font-medium text-warm-white">
            Ask about your business
          </p>
        </div>
        <ChevronRight size={11} className="text-warm-white/30" aria-hidden />
      </div>

      <TabBar active="home" />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Assistant
   -------------------------------------------------------------------------- */

export function AssistantScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pt-1.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-warm-white/10 text-steel-blue">
            <Sparkle size={13} aria-hidden />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold text-warm-white">RIVA AI</p>
            <p className="text-[7.5px] text-warm-white/35">Grounded in your books</p>
          </div>
        </div>
        <span className="flex size-6 items-center justify-center rounded-md border border-warm-white/10 text-warm-white/50">
          <History size={11} aria-hidden />
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden px-3 pt-3">
        <div className="max-w-[90%] rounded-xl rounded-bl-sm border border-warm-white/10 bg-deep-navy p-2.5">
          <p className="text-[9.5px] leading-[1.55] text-warm-white/75">
            Tell me what happened — I&apos;ll handle the accounting.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-full border border-warm-white/10 px-1.5 py-0.5 text-[7px] text-warm-white/50">
              Log an expense
            </span>
            <span className="rounded-full border border-warm-white/10 px-1.5 py-0.5 text-[7px] text-warm-white/50">
              What&apos;s my balance?
            </span>
          </div>
        </div>

        <div className="ml-auto max-w-[88%] rounded-xl rounded-br-sm bg-warm-white px-2.5 py-2 text-[9.5px] leading-[1.5] text-deep-ink">
          I paid €150 for electricity from the business account.
        </div>

        <div className="rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[7.5px] font-semibold uppercase tracking-[0.12em] text-warm-white/40">
              Transaction preview
            </p>
            <span className="flex size-4 items-center justify-center rounded-full bg-moss-100 text-moss-700">
              <Check size={8} aria-hidden />
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-warm-white/5 text-warm-white/60">
              <FileText size={11} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-medium text-warm-white">Electricity</p>
              <p className="text-[7.5px] text-warm-white/35">Utilities · From Bank · Today</p>
            </div>
            <p className="font-figures text-[10px] font-semibold text-rose-500">−€150.00</p>
          </div>
          <div className="mt-2 flex gap-1.5 border-t border-dashed border-warm-white/10 pt-2">
            <span className="flex h-6 flex-1 items-center justify-center rounded-md bg-warm-white text-[8px] font-semibold text-deep-ink">
              Record transaction
            </span>
            <span className="flex h-6 items-center justify-center rounded-md border border-warm-white/15 px-2.5 text-[8px] font-medium text-warm-white/60">
              Cancel
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-warm-white/10 p-2.5">
        <div className="flex items-center gap-1.5 rounded-lg border border-warm-white/10 bg-deep-navy px-2.5 py-2">
          <Paperclip size={10} className="text-warm-white/35" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-[8.5px] text-warm-white/35">
            Ask about your finances…
          </p>
          <span className="flex size-5 items-center justify-center rounded-md bg-warm-white text-deep-ink">
            <Send size={9} aria-hidden />
          </span>
        </div>
      </div>

      <TabBar active="assistant" />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Reports
   -------------------------------------------------------------------------- */

const REPORT_LEGEND = [
  { label: "Operations", value: "38%", color: "rgb(var(--c-chart-1))" },
  { label: "Payroll", value: "26%", color: "rgb(var(--c-chart-2))" },
  { label: "Software", value: "18%", color: "rgb(var(--c-chart-3))" },
  { label: "Utilities", value: "12%", color: "rgb(var(--c-chart-4))" },
  { label: "Other", value: "6%", color: "rgb(var(--c-chart-5))" },
] as const;

export function ReportsScreen() {
  const circumference = 2 * Math.PI * 42;
  const segments = [0.38, 0.26, 0.18, 0.12, 0.06];
  let offset = 0;

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pt-1.5">
        <div>
          <p className="text-[8px] font-medium uppercase tracking-[0.14em] text-warm-white/40">
            Analytics
          </p>
          <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-warm-white">
            Reports
          </p>
        </div>
        <span className="rounded-full border border-warm-white/10 px-2 py-0.5 text-[7.5px] text-warm-white/50">
          Last 6 months
        </span>
      </div>

      <div className="mx-4 mt-3 rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[8px] uppercase tracking-[0.1em] text-warm-white/40">
            Total expenses
          </p>
          <span className="rounded-full bg-moss-100 px-1.5 py-0.5 text-[7px] font-semibold text-moss-700">
            −12%
          </span>
        </div>
        <p className="mt-0.5 font-figures text-[17px] font-semibold tracking-tight text-warm-white">
          $42,680
        </p>
        <p className="text-[7.5px] text-warm-white/35">vs last month</p>
      </div>

      <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
        <div className="relative size-[96px] shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="rgb(247 247 243 / 0.06)"
              strokeWidth="12"
            />
            {REPORT_LEGEND.map((item, index) => {
              const dash = circumference * segments[index]!;
              const circle = (
                <circle
                  key={item.label}
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-figures text-[12px] font-semibold text-warm-white">$42.7k</p>
            <p className="text-[6.5px] uppercase tracking-[0.1em] text-warm-white/35">
              Expenses
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {REPORT_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[7.5px] text-warm-white/55">
                {item.label}
              </span>
              <span className="font-figures text-[7.5px] font-medium text-warm-white/70">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-2 rounded-xl border border-warm-white/10 bg-deep-navy p-2.5">
        <div className="flex items-center gap-1.5">
          <BrainCircuit size={10} className="text-steel-blue" aria-hidden />
          <p className="text-[7.5px] font-semibold uppercase tracking-[0.12em] text-warm-white/40">
            RIVA insight
          </p>
        </div>
        <p className="mt-1 text-[9px] leading-[1.5] text-warm-white/70">
          Spending is 12% lower than last month — the savings are already
          showing.
        </p>
      </div>

      <TabBar active="reports" />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Wide desktop dashboard preview
   -------------------------------------------------------------------------- */

const DASHBOARD_KPIS = [
  { label: "Balance", value: "$284,920", trend: "+2.4%" },
  { label: "Revenue", value: "$128,400", trend: "+9.1%" },
  { label: "Expenses", value: "$42,680", trend: "−12.0%" },
  { label: "Cash flow", value: "+$18,430", trend: "+6.2%" },
] as const;

export function DashboardPreview() {
  return (
    <div className="landing-on-navy overflow-hidden rounded-2xl border border-warm-white/10 bg-deep-navy shadow-float">
      <div className="flex items-center gap-2 border-b border-warm-white/10 px-3 py-2">
        <div className="flex gap-1">
          <span className="size-1.5 rounded-full bg-rose-500/70" />
          <span className="size-1.5 rounded-full bg-amber-500/70" />
          <span className="size-1.5 rounded-full bg-moss-500/70" />
        </div>
        <div className="mx-auto flex h-5 min-w-0 max-w-[220px] flex-1 items-center justify-center rounded-md border border-warm-white/10 bg-warm-white/5 px-2 text-[7.5px] text-warm-white/35">
          app.riva / overview
        </div>
        <span className="inline-flex items-center gap-1 text-[7px] text-warm-white/35">
          <span className="size-1 rounded-full bg-moss-500" />
          Live
        </span>
      </div>

      <div className="flex">
        <div className="hidden w-11 shrink-0 flex-col items-center gap-3 border-r border-warm-white/10 py-3 sm:flex">
          {[Home, Wallet, BarChart3, BrainCircuit, LayoutGrid].map((Icon, index) => (
            <span
              key={index}
              className={cn(
                "flex size-6 items-center justify-center rounded-md",
                index === 0
                  ? "bg-warm-white text-deep-ink"
                  : "text-warm-white/35"
              )}
            >
              <Icon size={11} aria-hidden />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[7.5px] uppercase tracking-[0.14em] text-warm-white/35">
                Workspace
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-warm-white">
                Financial overview
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-warm-white px-2 py-1 text-[8px] font-semibold text-deep-ink">
              <Plus size={9} aria-hidden />
              Add transaction
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {DASHBOARD_KPIS.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border border-warm-white/10 bg-warm-white/[0.035] p-2.5"
              >
                <p className="text-[7px] uppercase tracking-[0.1em] text-warm-white/35">
                  {kpi.label}
                </p>
                <p className="mt-1 font-figures text-[11.5px] font-semibold text-warm-white">
                  {kpi.value}
                </p>
                <p className="text-[7px] font-medium text-moss-500">{kpi.trend}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            <div className="rounded-lg border border-warm-white/10 bg-warm-white/[0.025] p-2.5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-medium text-warm-white/70">
                  Revenue vs. expenses
                </p>
                <p className="text-[7px] text-warm-white/30">Last 6 months</p>
              </div>
              <svg
                viewBox="0 0 420 120"
                role="img"
                aria-label="Illustrative six-month revenue and expense trend"
                className="mt-2 h-auto w-full"
              >
                <g className="text-warm-white/[0.08]" stroke="currentColor" strokeWidth="1">
                  {[20, 50, 80, 110].map((y) => (
                    <line key={y} x1="0" y1={y} x2="420" y2={y} />
                  ))}
                </g>
                <path
                  d="M0 96 C 30 90, 50 76, 78 82 S 130 62, 160 70 S 212 48, 242 56 S 294 36, 324 44 S 380 22, 420 28"
                  fill="none"
                  stroke="rgb(var(--c-moss-500))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0 108 C 34 104, 56 98, 84 100 S 136 90, 166 94 S 218 84, 248 88 S 300 78, 330 82 S 386 72, 420 76"
                  fill="none"
                  stroke="rgb(var(--c-signal-400))"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="rounded-lg border border-warm-white/10 bg-warm-white/[0.025] p-2.5">
              <p className="text-[8px] font-medium text-warm-white/70">
                Financial health
              </p>
              <div className="mt-2 flex items-center gap-2">
                <MiniGauge score={82} />
                <div>
                  <p className="text-[9px] font-semibold text-warm-white">Excellent</p>
                  <p className="text-[7px] text-warm-white/35">4 factors</p>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {[
                  ["Profit margin", 86],
                  ["Spending discipline", 74],
                  ["Solvency", 91],
                ].map(([label, score]) => (
                  <div key={label as string}>
                    <div className="flex items-center justify-between">
                      <p className="text-[6.5px] text-warm-white/45">{label}</p>
                      <p className="font-figures text-[6.5px] text-warm-white/60">{score}</p>
                    </div>
                    <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-warm-white/10">
                      <div
                        className="h-full rounded-full bg-moss-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-lg border border-warm-white/10">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <p className="text-[8px] font-medium text-warm-white/70">
                Recent activity
              </p>
              <p className="text-[7px] text-steel-blue">See all</p>
            </div>
            <div className="divide-y divide-warm-white/5">
              {HOME_TRANSACTIONS.map((tx) => {
                const Icon = tx.icon;
                return (
                  <div key={tx.name} className="flex items-center gap-2 px-2.5 py-1.5">
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md",
                        tx.positive
                          ? "bg-moss-100 text-moss-700"
                          : "bg-warm-white/5 text-warm-white/45"
                      )}
                    >
                      <Icon size={9} aria-hidden />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[8px] text-warm-white/75">
                      {tx.name}
                    </p>
                    <p className="text-[7px] text-warm-white/30">{tx.category}</p>
                    <p
                      className={cn(
                        "font-figures text-[8px] font-semibold",
                        tx.positive ? "text-moss-500" : "text-rose-500"
                      )}
                    >
                      {tx.amount}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
