import type { Account, Business, Transaction } from "@/lib/types";

// Clearly-labeled placeholder data so Overview/Transactions/Accounts/Reports
// have something believable to render before the backend endpoints are wired
// up in a given environment. Swap for real API calls — the shapes match
// what /api/businesses/{id}/accounts and a future /api/transactions return.

export const demoBusinesses: Business[] = [
  { id: "biz_1", name: "Aria Coffee Roasters", currency: "IRR" },
  { id: "biz_2", name: "Northlight Studio", currency: "USD" },
];

export const demoAccounts: Account[] = [
  { id: "a1", name: "Bank", type: "asset", balance: 84_500_000 },
  { id: "a2", name: "Cash box", type: "asset", balance: 3_200_000 },
  { id: "a3", name: "Accounts receivable", type: "asset", balance: 12_000_000 },
  { id: "l1", name: "Accounts payable", type: "liability", balance: 6_400_000 },
  { id: "l2", name: "Loans payable", type: "liability", balance: 20_000_000 },
  { id: "e1", name: "Owner's equity", type: "equity", balance: 60_000_000 },
  { id: "r1", name: "Sales revenue", type: "revenue", balance: 41_200_000 },
  { id: "r2", name: "Service revenue", type: "revenue", balance: 9_800_000 },
  { id: "x1", name: "Utilities expense", type: "expense", balance: 3_100_000 },
  { id: "x2", name: "Rent expense", type: "expense", balance: 18_000_000 },
  { id: "x3", name: "Marketing expense", type: "expense", balance: 5_400_000 },
  { id: "x4", name: "Supplies expense", type: "expense", balance: 2_250_000 },
];

export const demoTransactions: Transaction[] = [
  {
    id: "t1",
    description: "Electricity",
    category: "Utilities",
    date: new Date().toISOString(),
    amount: -2_000_000,
    currency: "IRR",
    status: "posted",
    icon: "zap",
  },
  {
    id: "t2",
    description: "Customer payment — Sepehr Textiles",
    category: "Sales",
    date: new Date(Date.now() - 86_400_000).toISOString(),
    amount: 14_500_000,
    currency: "IRR",
    status: "posted",
    icon: "arrow-down-left",
  },
  {
    id: "t3",
    description: "Rent",
    category: "Rent",
    date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    amount: -18_000_000,
    currency: "IRR",
    status: "posted",
    icon: "home",
  },
  {
    id: "t4",
    description: "Instagram ads",
    category: "Marketing",
    date: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    amount: -1_450_000,
    currency: "IRR",
    status: "posted",
    icon: "megaphone",
  },
  {
    id: "t5",
    description: "Packaging supplies",
    category: "Supplies",
    date: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    amount: -820_000,
    currency: "IRR",
    status: "posted",
    icon: "package",
  },
  {
    id: "t6",
    description: "Customer payment — Mina Ahani",
    category: "Sales",
    date: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    amount: 6_200_000,
    currency: "IRR",
    status: "pending",
    icon: "arrow-down-left",
  },
];

export const demoOverview = {
  balance: 87_700_000,
  revenue: 51_000_000,
  expenses: 24_750_000,
  cashFlow: 26_250_000,
};
