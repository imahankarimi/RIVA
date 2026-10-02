import type { Dictionary } from "./dictionaries/en";

const CATEGORY_KEYS: Record<string, string> = {
  food: "food",
  salary: "salary",
  transport: "transport",
  housing: "housing",
  utilities: "utilities",
  shopping: "shopping",
  entertainment: "entertainment",
  health: "health",
  education: "education",
  other: "other",
};

const ACCOUNT_KEYS: Record<string, string> = {
  cash: "cash",
  bank: "bank",
  card: "card",
  income: "income",
  expense: "expense",
  other: "other",
};

export function getCategoryLabel(
  category: string,
  t: (key: string) => string
): string {
  const categoryKey = CATEGORY_KEYS[category.toLowerCase()];
  return categoryKey
    ? t(`labels.categories.${categoryKey}`)
    : category;
}

export function getAccountLabel(
  account: string,
  t: (key: string) => string
): string {
  const accountKey = ACCOUNT_KEYS[account.toLowerCase()];
  return accountKey
    ? t(`labels.accounts.${accountKey}`)
    : account;
}

export function getAccountDisplayName(
  name: string,
  t: (key: string) => string
): string {
  const key = ACCOUNT_KEYS[name.toLowerCase()];
  return key ? t(`labels.accounts.${key}`) : name;
}

export function translateCategory(
  category: string,
  t: (key: string) => string
): string {
  return getCategoryLabel(category, t);
}

export function translateAccountName(
  account: string,
  t: (key: string) => string
): string {
  return getAccountLabel(account, t);
}
