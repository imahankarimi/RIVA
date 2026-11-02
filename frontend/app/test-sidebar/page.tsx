"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "@/lib/motion/tokens";

/**
 * Development-only test page for Sidebar navigation verification.
 * Tests the active pill, Liquid Glass effects, and layout without auth.
 */

const testNavItems = [
  { href: "/test-sidebar", label: "Overview", icon: LayoutDashboard },
  { href: "/test-sidebar/transactions", label: "Transactions", icon: Receipt },
  { href: "/test-sidebar/reports", label: "Reports", icon: FileText },
  { href: "/test-sidebar/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/test-sidebar/assistant", label: "Assistant", icon: Sparkles },
];

function TestNavLink({ item }: { item: typeof testNavItems[number] }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium",
        "transition-colors duration-150",
        active
          ? "text-sidebar-accent-foreground"
          : "text-ink-soft hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="test-sidebar-active-pill"
          transition={SPRING_SNAPPY}
          className="absolute inset-0 rounded-md bg-sidebar-accent"
        />
      )}

      <Icon
        size={16}
        strokeWidth={2}
        className={cn(
          "relative shrink-0 transition-colors duration-150",
          active ? "text-signal-600" : "text-ink-faint group-hover:text-ink"
        )}
      />

      <span className="relative text-[13px] font-medium">{item.label}</span>
    </Link>
  );
}

export default function TestSidebarPage() {
  return (
    <div className="flex h-screen bg-page">
      <aside className="hidden h-full w-[248px] shrink-0 lg:block">
        <div className="m-2 flex h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-xl bg-sidebar text-sidebar-foreground shadow-subtle ring-1 ring-line/70">
          <div className="flex h-16 shrink-0 items-center px-5">
            <div className="text-lg font-semibold">Test Sidebar</div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
            <section className="mb-4">
              <div className="mb-1 flex h-[18px] overflow-hidden px-3 pt-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Navigation
                </span>
              </div>

              <div className="space-y-0.5">
                {testNavItems.map((item) => (
                  <TestNavLink key={item.href} item={item} />
                ))}
              </div>
            </section>
          </nav>

          <div className="shrink-0 border-t border-line p-3">
            <button className="glass-lens relative mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-sidebar-accent">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold">
                TB
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">Test Business</p>
                <p className="truncate text-[11.5px] text-ink-faint">USD</p>
              </div>
            </button>

            <button className="glass-lens relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-sidebar-accent">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">
                TU
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">Test User</p>
                <p className="truncate text-[11px] text-ink-faint">test@example.com</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-2xl font-semibold">Sidebar Test Page</h1>
          <p className="mb-4 text-ink-soft">
            This page tests Sidebar navigation styling without authentication:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-ink-soft">
            <li>Click navigation items to test selection states and transitions</li>
            <li>Hover navigation items — NO Liquid Glass on nav (only bottom buttons)</li>
            <li>Hover business/profile buttons to see Liquid Glass effect</li>
            <li>Toggle dark mode to verify both themes work correctly</li>
            <li>Check for unwanted dots or visual artifacts</li>
            <li>Verify selected item does NOT protrude beyond alignment</li>
          </ul>
          <div className="mt-8 rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 font-medium">Expected Behavior</h2>
            <ul className="space-y-1 text-sm text-ink-soft">
              <li>✓ Active nav item has filled background pill (bg-sidebar-accent)</li>
              <li>✓ Pill transitions smoothly between items with layoutId</li>
              <li>✓ Icons stay signal-600 when active, faint when inactive</li>
              <li>✓ Liquid Glass on business/profile buttons only (pointer tracking)</li>
              <li>✓ No unwanted dots or selection indicators</li>
              <li>✓ All items aligned consistently (no protrusion)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
