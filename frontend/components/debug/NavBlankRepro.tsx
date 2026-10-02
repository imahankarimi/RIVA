"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { DURATION, EASE, SPRING_SNAPPY } from "@/lib/motion/tokens";

/**
 * Debug repro for the blank-page-on-repeat-navigation bug.
 *
 * THIS IS A TEMPORARY DEBUG SCREEN. Build a fake navigation bar and a tiny
 * set of routes that get keyed by pathname inside an AnimatePresence-wrapped
 * motion.div. Goal: reproduce, in the real RIVA motion stack, the exact
 * symptom "navigating a second/third time → content disappears → refresh
 * fixes it" — with NO backend, NO auth, NO data hooks.
 *
 * If this repro blanks, the bug lives in the animation/lifecycle layer and
 * we fix PageTransition. If it NEVER blanks, the bug lives downstream (a
 * data hook / AuthGate / provider), and we fix that instead.
 */

const DEMO_ROUTES = ["overview", "accounts", "budgets", "analytics", "calendar"] as const;
type DemoRoute = (typeof DEMO_ROUTES)[number];

const LABELS: Record<DemoRoute, string> = {
  overview: "Overview",
  accounts: "Accounts",
  budgets: "Budgets",
  analytics: "Analytics",
  calendar: "Calendar",
};

function innerPage(route: DemoRoute) {
  switch (route) {
    case "overview":
      return (
        <div className="space-y-3">
          <div>Financial Overview — area chart here</div>
          <div className="h-24 rounded-lg bg-muted" />
          <div>Recent Activity</div>
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      );
    case "accounts":
      return (
        <div className="space-y-3">
          <div className="font-semibold">Accounts</div>
          {[["Checking", "1,240.50"], ["Savings", "8,900"], ["Credit", "-340"]].map(([n, v]) => (
            <div key={n} className="flex justify-between rounded-lg border border-line p-3">
              <span>{n}</span>
              <span className="tabular-nums font-medium">{v}</span>
            </div>
          ))}
        </div>
      );
    case "budgets":
      return (
        <div className="space-y-3">
          <div className="font-semibold">Budgets</div>
          <div className="flex gap-3">
            {[["Rent", 82], ["Food", 64], ["Fuel", 41]].map(([n, p]) => (
              <div key={n as string} className="flex-1 rounded-lg border border-line p-2 text-center">
                <div>{n}</div>
                <div className="mt-1 text-lg font-bold tabular-nums">{p}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "analytics":
      return (
        <div className="space-y-3">
          <div className="font-semibold">Analytics</div>
          <div className="h-24 rounded-lg bg-muted" />
          <div className="grid grid-cols-3 gap-3">
            {["Category A", "Category B", "Category C"].map((c) => (
              <div key={c} className="rounded-lg border border-line p-2 text-center text-xs">{c}</div>
            ))}
          </div>
        </div>
      );
    case "calendar":
      return (
        <div className="space-y-3">
          <div className="font-semibold">Calendar</div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={i === 15 ? "rounded-md bg-primary p-1.5 text-primary-foreground" : "p-1.5"}>{i + 1}</div>
            ))}
          </div>
        </div>
      );
  }
}

export function NavBlankRepro() {
  const pathname = usePathname();
  const current = (DEMO_ROUTES.find((r) => pathname.includes(`/${r}`)) ?? "overview") as DemoRoute;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      {/* Fake nav bar */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {DEMO_ROUTES.map((r) => (
          <a
            key={r}
            href={`/${r}`}
            className="shrink-0 rounded-md border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-surfaceMuted hover:text-ink"
          >
            {LABELS[r]}
          </a>
        ))}
      </div>

      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="rounded-xl border border-line bg-surface p-4"
        >
          {innerPage(current)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}