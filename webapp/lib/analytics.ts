import type { Transaction } from "@/lib/types";

// ─── Categories with a real subcategory drill-down ────────────────────────
// RIVA stores every transaction against a single category, so a category's
// "subcategories" are its constituent transactions. Each row carries the
// merchant/description + date so the donut legend can explain where the
// money went, the way the reference's subcategory list does.

export interface AnalyticsCategory {
  name: string;
  /** Total spent on this category in the window (positive, absolute). */
  amount: number;
  transactions: Transaction[];
}

export interface DayActivity {
  /** Date in ISO format (YYYY-MM-DD). */
  date: string;
  /** Total activity (income + expense absolute values). */
  total: number;
  /** Income amount. */
  income: number;
  /** Expense amount (absolute). */
  expense: number;
  /** Count of all transactions on this day. */
  transactionCount: number;
}

export interface AnalyticsData {
  all: Transaction[];
  /** Spend (absolute) per day across the window, any amount (0 skipped). */
  spendByDay: Map<string, number>;
  /** Daily financial activity with income/expense breakdown and transaction counts. */
  dailyActivity: Map<string, DayActivity>;
  /** Date range of the window. */
  rangeStart: string;
  rangeEnd: string;
  /** Non-empty breakdown used by the donut + its drill-down. */
  categories: AnalyticsCategory[];
  /** Total expense (absolute) across the window — the donut center. */
  totalExpense: number;
  /** True when there are no expense transactions at all in the window. */
  zeroSpend: boolean;
  /** This period's expense per month (for month-comparison). */
  expenseByMonth: Map<string, number>;
  revenueByMonth: Map<string, number>;
  /** Computed insight facts derived from the window's real transactions. */
  insights: InsightFact[];
}

/** Output of the recurring detector. */
export interface Recurring {
  /** A transaction likely repeated monthly. */
  item: Transaction;
  /** How many distinct months it appears in. */
  occurrences: number;
  /** Month keys it appears in, sorted. */
  months: string[];
}

export interface InsightFact {
  id: string;
  text: string;
  trend: "up" | "down" | "neutral";
  percentChange: number | null;
  category: string;
}

function monthKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isoDay(d: Date): string {
  const s = d.toISOString();
  const idx = s.indexOf("T");
  return s.slice(0, idx === -1 ? s.length : idx);
}

function computeInsights(allTx: Transaction[], expenseByMonth: Map<string, number>, revenueByMonth: Map<string, number>): InsightFact[] {
  const facts: InsightFact[] = [];

  // Latest month where we have expenses, compared against the month before.
  const monthKeys = Array.from(expenseByMonth.keys());
  if (monthKeys.length >= 2) {
    const latestKey = monthKeys[monthKeys.length - 1]!;
    const prevKey = monthKeys[monthKeys.length - 2]!;
    const latest = expenseByMonth.get(latestKey) ?? 0;
    const prev = expenseByMonth.get(prevKey) ?? 0;
    if (prev > 0 && latest > 0) {
      const pct = Math.round(((latest - prev) / prev) * 100);
      facts.push({
        id: "expense-trend",
        text:
          pct > 0
            ? `Spending this month is ${pct}% higher than last month — the top driver is where to look next.`
            : `Spending this month is ${Math.abs(pct)}% lower than last month — the savings are already showing.`,
        trend: pct > 0 ? "up" : "down",
        percentChange: Math.abs(pct),
        category: "Expenses",
      });
    }
  }

  // Biggest single expense transaction in the window.
  const biggestExpense = [...allTx].filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount)[0];
  if (biggestExpense) {
    facts.push({
      id: "largest-outflow",
      text: `“${biggestExpense.description}” was the largest outgoing this period.`,
      trend: "neutral",
      percentChange: null,
      category: biggestExpense.category,
    });
  }

  // Favorite revenue source — most repeated positive transaction.
  const income = allTx.filter((t) => t.amount > 0);
  const incomeCount = new Map<string, { count: number; tx: Transaction }>();
  for (const tx of income) {
    const key = `${tx.description.trim().toLowerCase()}|${tx.category}`;
    const existing = incomeCount.get(key);
    if (existing) existing.count += 1;
    else incomeCount.set(key, { count: 1, tx });
  }
  const topIncome = [...incomeCount.entries()].sort((a, b) => b[1].count - a[1].count)[0];
  if (topIncome && topIncome[1].count > 1) {
    facts.push({
      id: "repeat-income",
      text: `${topIncome[1].tx.description} appeared ${topIncome[1].count} times — a steady revenue source worth protecting.`,
      trend: "neutral",
      percentChange: null,
      category: topIncome[1].tx.category,
    });
  }

  // Month-over-month revenue momentum.
  if (revenueByMonth.size >= 2) {
    const keys = Array.from(revenueByMonth.keys());
    const latest = revenueByMonth.get(keys[keys.length - 1]!) ?? 0;
    const prev = revenueByMonth.get(keys[keys.length - 2]!) ?? 0;
    if (prev > 0 && latest > 0) {
      const pct = Math.round(((latest - prev) / prev) * 100);
      facts.push({
        id: "revenue-momentum",
        text:
          pct > 0
            ? `Revenue is up ${pct}% versus last month — the momentum is real.`
            : `Revenue is down ${Math.abs(pct)}% versus last month.`,
        trend: pct >= 0 ? "up" : "down",
        percentChange: Math.abs(pct),
        category: "Revenue",
      });
    }
  }

  return facts;
}

export function deriveAnalytics(transactions: Transaction[], windowStart: Date): AnalyticsData {
  const rangeStart = isoDay(new Date(windowStart));
  const rangeEnd = isoDay(new Date());
  const now = new Date();

  // Single pass over the window so every derived surface (daily spend,
  // category breakdown, month comparison, insights) reads the same slice.
  const inWindow = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d >= windowStart && d <= now;
  });

  const spendByDay = new Map<string, number>();
  const dailyActivity = new Map<string, DayActivity>();
  const expenseByMonth = new Map<string, number>();
  const revenueByMonth = new Map<string, number>();

  for (const tx of inWindow) {
    const day = isoDay(new Date(tx.date));
    const mk = monthKeyOf(tx.date);

    // Track daily activity with income/expense breakdown
    let activity = dailyActivity.get(day);
    if (!activity) {
      activity = { date: day, total: 0, income: 0, expense: 0, transactionCount: 0 };
      dailyActivity.set(day, activity);
    }

    activity.transactionCount += 1;

    if (tx.amount < 0) {
      const abs = Math.abs(tx.amount);
      spendByDay.set(day, (spendByDay.get(day) ?? 0) + abs);
      activity.expense += abs;
      activity.total += abs;
      expenseByMonth.set(mk, (expenseByMonth.get(mk) ?? 0) + abs);
    } else {
      activity.income += tx.amount;
      activity.total += tx.amount;
      revenueByMonth.set(mk, (revenueByMonth.get(mk) ?? 0) + tx.amount);
    }
  }

  // Categories: sum outflows, keep the constituent transactions for drill-down.
  const byCategory = new Map<string, Transaction[]>();
  let totalExpense = 0;
  for (const tx of inWindow) {
    if (tx.amount >= 0) continue;
    const abs = Math.abs(tx.amount);
    totalExpense += abs;
    const list = byCategory.get(tx.category);
    if (list) list.push(tx);
    else byCategory.set(tx.category, [tx]);
  }

  const categories: AnalyticsCategory[] = Array.from(byCategory.entries())
    .map(([name, txs]) => ({
      name,
      amount: txs.reduce((s, t) => s + Math.abs(t.amount), 0),
      transactions: txs.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const zeroSpend = totalExpense === 0;
  return {
    all: inWindow,
    spendByDay,
    dailyActivity,
    rangeStart,
    rangeEnd,
    categories,
    totalExpense,
    zeroSpend,
    expenseByMonth,
    revenueByMonth,
    insights: computeInsights(inWindow, expenseByMonth, revenueByMonth),
  };
}

/**
 * Recurring-period detection: a transaction whose description + category +
 * currency recur in ≥2 distinct months, roughly one month apart. Kept to
 * real transactions seen in the window — nothing fabricated. Frequency is
 * inferred, so a label like "monthly" is honest: it's the observed cadence,
 * not a stored subscription status.
 */
export function detectRecurring(allTx: Transaction[]): Recurring[] {
  const groups = new Map<string, Transaction[]>();

  for (const tx of allTx) {
    if (tx.amount >= 0) continue;
    const key = `${tx.description.trim().toLowerCase()}|${tx.category}|${tx.currency}`;
    const list = groups.get(key);
    if (list) {
      // Only unique (id) transactions accumulate — the same object may
      // appear multiple times across a single fetch.
      if (!list.some((e) => e.id === tx.id)) list.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }

  const out: Recurring[] = [];

  for (const [key, list] of groups) {
    if (list.length < 2) continue;

    // Distinct months present.
    const months = Array.from(new Set(list.map((t) => monthKeyOf(t.date)))).sort();

    // Reduce noise: skip the obvious one-off "rent" spikes that land in two
    // adjacent months but nowhere else — genuinely monthly charges recur at
    // many distinct months, not just a boundary pair.
    const adjacentOnly = (() => {
      if (months.length !== 2) return false;
      const first = months[0];
      const second = months[1];
      if (!first || !second) return false;
      const ay = Number(first.split("-")[0]);
      const am = Number(first.split("-")[1]);
      const by = Number(second.split("-")[0]);
      const bm = Number(second.split("-")[1]);
      return by * 12 + bm - (ay * 12 + am) === 1;
    })();

    if (adjacentOnly) continue;

    const item = list.reduce((min, t) => (t.date < min.date ? t : min), list[0]!);
    out.push({
      item,
      occurrences: months.length,
      months,
    });
  }

  return out.sort((a, b) => b.occurrences - a.occurrences).slice(0, 6);
}

export function monthLabelOf(monthKey: string, locale: "en" | "fa"): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y!, m! - 1, 1);
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short", year: locale === "fa" ? undefined : "numeric" }).format(d);
}