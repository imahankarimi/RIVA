import type { Locale } from "@/lib/i18n";

/**
 * A business has exactly one, permanent base currency chosen at creation.
 * There is no conversion anywhere in the app — every amount is always
 * displayed in this currency, as-is.
 *
 * TOMAN and IRR are deliberately two distinct entries: they're the same
 * real-world currency at a fixed, exact 10:1 ratio, but RIVA AI treats them
 * as genuinely different ledger units (10,000 Toman ≠ 10,000 Rial) rather
 * than silently converting between them.
 */
export type BackendCurrency = "IRR" | "TOMAN" | "USD" | "EUR" | "GBP";

export const SUPPORTED_CURRENCIES: BackendCurrency[] = ["TOMAN", "IRR", "USD", "EUR", "GBP"];

export const CURRENCY_META: Record<BackendCurrency, { flag: string; name: string; nameFa: string; symbol: string | null }> = {
  TOMAN: { flag: "🇮🇷", name: "Iranian Toman", nameFa: "تومان", symbol: null },
  IRR: { flag: "🇮🇷", name: "Iranian Rial", nameFa: "ریال", symbol: null },
  USD: { flag: "🇺🇸", name: "US Dollar", nameFa: "دلار آمریکا", symbol: "$" },
  EUR: { flag: "🇪🇺", name: "Euro", nameFa: "یورو", symbol: "€" },
  GBP: { flag: "🇬🇧", name: "British Pound", nameFa: "پوند انگلیس", symbol: "£" },
};

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/**
 * Format an amount for display in the business's own base currency.
 * No conversion, no unit-switching — the number and currency you pass in
 * are exactly what's shown. The only thing that changes with locale is the
 * *label*: Persian shows the natural Persian currency name (تومان/ریال/...)
 * instead of a raw ISO-style code, English shows the code/symbol.
 *
 * IRR (en):      2,000,000 IRR      IRR (fa):    ۲,۰۰۰,۰۰۰ ریال
 * TOMAN (fa):    ۲,۰۰۰,۰۰۰ تومان    USD:         $2,000.00
 */
export function formatCurrency(
  amount: number,
  currency: BackendCurrency,
  locale: Locale,
  opts: { signed?: boolean } = {}
): string {
  const sign = opts.signed && amount !== 0 ? (amount > 0 ? "+" : "−") : "";
  const magnitude = Math.abs(amount);
  const meta = CURRENCY_META[currency];

  if (currency === "IRR" || currency === "TOMAN") {
    const grouped = Math.round(magnitude).toLocaleString("en-US");
    const digits = locale === "fa" ? toPersianDigits(grouped) : grouped;
    const label = locale === "fa" ? meta.nameFa : currency;
    return `${sign}${digits} ${label}`;
  }

  const symbol = meta.symbol ?? "";
  const grouped = magnitude.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const digits = locale === "fa" ? toPersianDigits(grouped) : grouped;
  return `${sign}${symbol}${digits}`;
}

/** The currency a newly-created business should default to for a given UI locale
 *  (Persian users overwhelmingly speak and think in Toman; English defaults to USD). */
export function defaultCurrencyFor(locale: Locale): BackendCurrency {
  return locale === "fa" ? "TOMAN" : "USD";
}

/** Renders just the number, no symbol/label — for compact chart axes etc. */
export function formatNumber(value: number, locale: Locale): string {
  const grouped = Math.round(value).toLocaleString("en-US");
  return locale === "fa" ? toPersianDigits(grouped) : grouped;
}

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (locale === "fa") {
    return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatMonthShort(iso: string, locale: Locale): string {
  const date = new Date(iso);

  if (locale === "fa") {
    return new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}
