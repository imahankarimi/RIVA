/**
 * DEMO DATA for the Budgets screen.
 *
 * RIVA does not yet have a budget backend. This module powers a realistic
 * preview of the intended final experience. It is explicitly isolated:
 * swap these exports for real API data later without touching the UI.
 *
 * The category names intentionally mirror RIVA's transaction categories
 * (see `translateCategory` in lib/i18n/labels) so the rings can eventually
 * be driven by real expense aggregation.
 */

export interface DemoBudget {
  id: string;
  category: string;
  spent: number;
  budget: number;
  /** RIVA semantic color token class for the ring. */
  color: string;
  iconName: string;
}

export const demoBudgets: DemoBudget[] = [
  { id: "b1", category: "Rent", spent: 1850, budget: 2000, color: "text-signal-500", iconName: "home" },
  { id: "b2", category: "Salaries", spent: 4200, budget: 4500, color: "text-moss-500", iconName: "users" },
  { id: "b3", category: "Supplies", spent: 990, budget: 900, color: "text-amber-500", iconName: "shopping-bag" },
  { id: "b4", category: "Marketing", spent: 640, budget: 1200, color: "text-signal-400", iconName: "megaphone" },
];

export interface DemoSavingsGoal {
  id: string;
  name: string;
  iconName: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  deadline: string;
}

export const demoSavingsGoals: DemoSavingsGoal[] = [
  { id: "g1", name: "Emergency Fund", iconName: "shield", currentAmount: 8400, targetAmount: 12000, monthlyContribution: 800, deadline: "2026-12" },
  { id: "g2", name: "New Equipment", iconName: "car", currentAmount: 3200, targetAmount: 6000, monthlyContribution: 500, deadline: "2026-11" },
];

/** Daily spend across the current month (demo) — format: { day, amount }. */
export function buildDailySpending(monthBudgetTotal: number): { day: number; amount: number }[] {
  const out: { day: number; amount: number }[] = [];
  let running = 0;
  for (let d = 1; d <= 28; d++) {
    // Pseudo-random but deterministic daily spend tapering off.
    const wave = Math.sin(d / 3.2) * 90 + 140 + ((d * 7) % 60);
    const amount = Math.max(0, Math.round(wave));
    running += amount;
    out.push({ day: d, amount });
  }
  return out;
}