import type { Dictionary } from "./dictionaries/en";

/**
 * Localisation for the free-text `category` / `account` values that the
 * backend derives from a transaction description (see
 * `backend/transaction_recorder.py`, which maps description keywords onto
 * expense buckets like `rent`, `utilities`, `marketing`, `salary`, `supplies`,
 * `software`, `telecom`, `travel`).
 *
 * Rules for this file:
 *   1. Keys must exist in BOTH dictionaries under `labels.categories` /
 *      `labels.accounts`. `npm run typecheck` enforces this, because `fa` is
 *      typed as `Dictionary`.
 *   2. Matching is case-insensitive and falls through to the raw string, so an
 *      unrecognised category still renders as readable text rather than leaking
 *      a dotted i18n key path into the UI.
 *   3. Do not invent categories here. Add one only if the backend can produce
 *      it, otherwise it is dead weight in four dictionary files.
 */
const CATEGORY_KEYS: Record<string, string> = {
  food: "food",
  salary: "salary",
  transport: "transport",
  housing: "housing",
  rent: "rent",
  utilities: "utilities",
  shopping: "shopping",
  marketing: "marketing",
  entertainment: "entertainment",
  health: "health",
  education: "education",
  supplies: "supplies",
  software: "software",
  telecom: "telecom",
  travel: "travel",
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

/**
 * `t()` returns the requested path unchanged when a key is missing, so a
 * translation can never silently render as `labels.categories.rent`. Detect
 * that case and fall back to the readable raw value instead.
 */
function translate(raw: string, key: string, t: (key: string) => string): string {
  const translated = t(key);
  return translated === key ? raw : translated;
}

export function getCategoryLabel(
  category: string,
  t: (key: string) => string
): string {
  const categoryKey = CATEGORY_KEYS[category.toLowerCase()];
  return categoryKey
    ? translate(category, `labels.categories.${categoryKey}`, t)
    : category;
}

export function getAccountLabel(
  account: string,
  t: (key: string) => string
): string {
  const accountKey = ACCOUNT_KEYS[account.toLowerCase()];
  return accountKey
    ? translate(account, `labels.accounts.${accountKey}`, t)
    : account;
}

export function getAccountDisplayName(
  name: string,
  t: (key: string) => string
): string {
  const key = ACCOUNT_KEYS[name.toLowerCase()];
  return key ? translate(name, `labels.accounts.${key}`, t) : name;
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