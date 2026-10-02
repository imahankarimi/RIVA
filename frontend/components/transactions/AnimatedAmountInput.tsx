"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion/tokens";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const FA_DIGIT_RE = /[۰-۹]/;

const toLatinDigit = (c: string) => String(FA_DIGITS.indexOf(c));

/** Characters treated as non-digit (group separators + decimal point). */
const SEP_RE = /[,،٬.]/;

/** Slow, soft spring for the amount re-sizing as digits are added/removed. */
const SPRING_SIZE = { type: "spring", stiffness: 360, damping: 32, mass: 0.6 } as const;

/**
 * AnimatedAmountInput
 *
 * The real, fully-accessible `<input>` is the single source of truth. It sits
 * invisibly over the container and keeps every native behavior — focus,
 * keyboard, paste, tab order, touch number-pad, screen readers. A decorative
 * digit layer renders *the same value* behind it, grouped like currency and
 * animated per character: each digit blooms in as it's typed and dissolves as
 * it's removed, so the amount behaves like a precision odometer rather than
 * retyped text.
 *
 * The digit layer is always laid out left-to-right (nums are read LTR even in
 * Persian); the currency label rides beside it, flipping sides with the
 * ambient direction, matching how RIVA's formatCurrency places the label
 * after the number.
 *
 * Nothing here changes the raw `value` string or any accounting semantics —
 * the parent decides how to interpret it. Persian digits typed into the field
 * are normalized to Latin so `Number(value)` stays reliable.
 */
export function AnimatedAmountInput({
  value,
  onValueChange,
  currencyLabel,
  symbol,
  dir = "ltr",
  locale = "en",
  maxLength = 15,
  feedbackNonce = 0,
  autoFocus = false,
  amountLabel = "Amount",
  accent = "signal",
  error,
}: {
  value: string;
  onValueChange: (v: string) => void;
  /** Natural-language currency label (e.g. "Toman" / "تومان") shown beside the digits. */
  currencyLabel: string;
  /** Currency symbol (e.g. "$") shown before the digits for symbol-first currencies. */
  symbol?: string;
  /** Localized label for the field, e.g. "Amount" / "مبلغ" (used as the input's accessible name). */
  amountLabel?: string;
  dir?: "ltr" | "rtl";
  locale?: "en" | "fa";
  maxLength?: number;
  /** Increment to trigger the subtle invalid-value shake. */
  feedbackNonce?: number;
  autoFocus?: boolean;
  /** Semantic accent tint for the focused border (spent=rose, income=moss). */
  accent?: "signal" | "rose" | "moss";
  /** Inline validation message shown beneath the field. */
  error?: string;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const showLayer = focused || touched || value !== "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Accept Latin and Persian digits plus any group separator; normalize
    // digits to Latin so the parent's Number(value) parsing is never surprised.
    const normalized = e.target.value.replace(FA_DIGIT_RE, toLatinDigit);
    if (!/^[0-9.,٬]*$/.test(normalized)) return;
    setTouched(true);
    onValueChange(normalized);
  }

  const { chars, empty, size } = useMemo(() => {
    const [intRaw, fracRaw] = value.split(".");
    const int = (intRaw ?? "").replace(/[^\d]/g, "");
    const frac = value.includes(".") ? "." + (fracRaw ?? "") : "";

    if (!int && !frac) {
      return { chars: ["0"], empty: true, size: 34 };
    }

    const grouped: string[] = [];
    const digits = [...int];
    while (digits.length > 3) {
      grouped.unshift(digits.splice(digits.length - 3).join(""));
    }
    if (digits.length) grouped.unshift(digits.join(""));
    const joined = grouped.join(",") + frac;

    const localized = locale === "fa" ? joined.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!) : joined;
    const chars = [...localized];
    const len = chars.length;

    let fontSize = 34;
    if (len > 12) fontSize = 22;
    else if (len > 9) fontSize = 26;
    else if (len > 7) fontSize = 30;

    return { chars, empty: false, size: fontSize };
  }, [value, locale]);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        dir={dir}
        className={cn(
          "relative h-24 w-full overflow-hidden rounded-xl border border-line-soft",
          "bg-surface transition-[border-color] duration-200",
          error
            ? "border-rose-500/70"
            : focused &&
                (accent === "rose"
                  ? "border-rose-500/60"
                  : accent === "moss"
                    ? "border-moss-500/60"
                    : "border-signal-400/60")
        )}
      >
      <AnimatedDigits
        chars={chars}
        dir={dir}
        show={showLayer}
        empty={empty}
        currencyLabel={currencyLabel}
        symbol={symbol}
        fontSize={size}
        feedbackNonce={feedbackNonce}
        reduceMotion={!!reduceMotion}
      />

      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={`${amountLabel}${currencyLabel ? `, ${currencyLabel}` : ""}`}
        aria-invalid={!!error}
        autoFocus={autoFocus}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[0px] text-transparent caret-transparent outline-none"
      />
      </div>

      {error && (
        <p
          id="amount-error"
          className="text-[11.5px] font-medium leading-tight text-rose-700 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function AnimatedDigits({
  chars,
  dir,
  show,
  empty,
  currencyLabel,
  symbol,
  fontSize,
  feedbackNonce,
  reduceMotion,
}: {
  chars: string[];
  dir: "ltr" | "rtl";
  show: boolean;
  empty: boolean;
  currencyLabel: string;
  symbol?: string;
  fontSize: number;
  feedbackNonce: number;
  reduceMotion: boolean;
}) {
  const shakeControls = useAnimationControls();

  useEffect(() => {
    if (feedbackNonce === 0) return;
    void shakeControls.start({
      x: [0, -6, 6, -4, 4, -2, 2, 0],
      transition: { duration: 0.38, ease: "easeInOut" },
    });
  }, [feedbackNonce, shakeControls]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <motion.div animate={shakeControls} style={{ x: 0 }} className="relative">
        <motion.span
          animate={{ fontSize }}
          transition={SPRING_SIZE}
          className={cn(
            "inline-flex items-baseline whitespace-nowrap font-mono font-bold leading-none tabular-nums text-ink",
            (empty || !show) && "text-ink-faint",
            empty && "opacity-60"
          )}
        >
          <span dir="ltr" className="inline-flex items-baseline">
            {symbol && (
              <span className="mx-[0.08em] select-none text-ink-faint">{symbol}</span>
            )}
            <AnimatePresence initial={false} mode="popLayout">
              {chars.map((c, i) => {
                const isDigit = !SEP_RE.test(c);
                return (
                  <motion.span
                    key={`${c}-${i}`}
                    layout="position"
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(4px)" }
                    }
                    animate={{
                      opacity: show ? 1 : 0.55,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, y: -14, filter: "blur(4px)" }
                    }
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className={cn(
                      "tabular-nums",
                      isDigit ? "mx-[0.04em]" : "mx-[0.13em] text-ink-faint"
                    )}
                  >
                    {c}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </span>
          {currencyLabel && !symbol && (
            <span
              className={cn(
                "select-none whitespace-nowrap font-mono text-[13px] font-medium text-ink-faint",
                dir === "rtl" ? "mr-2 order-first" : "ml-2"
              )}
            >
              {currencyLabel}
            </span>
          )}
        </motion.span>
      </motion.div>
    </div>
  );
}