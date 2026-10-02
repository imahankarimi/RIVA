"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, AlertTriangle } from "lucide-react";
import { SUPPORTED_CURRENCIES, CURRENCY_META, type BackendCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

export function CurrencySelect({
  value,
  onChange,
  label,
}: {
  value: BackendCurrency;
  onChange: (currency: BackendCurrency) => void;
  label: string;
}) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const meta = CURRENCY_META[value];
  const nameFor = (c: BackendCurrency) => (locale === "fa" ? CURRENCY_META[c].nameFa : CURRENCY_META[c].name);

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          className="flex h-11 w-full items-center justify-between rounded-md border border-line bg-surface px-3 text-[14px] text-ink outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-100"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>{meta.flag}</span>
            <span>
              {nameFor(value)} ({value})
            </span>
          </span>
          <ChevronDown size={15} className={cn("text-ink-faint transition-transform duration-150", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="absolute start-0 end-0 top-12 z-30 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-raised"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-start text-[13.5px] transition-colors duration-150 hover:bg-surfaceMuted",
                    c === value ? "text-signal-700" : "text-ink-soft"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{CURRENCY_META[c].flag}</span>
                    {nameFor(c)} ({c})
                  </span>
                  {c === value && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CurrencyLockWarning({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md bg-amber-100 px-3.5 py-3 text-amber-700">
      <span aria-hidden className="mt-px shrink-0">
        <AlertTriangle size={15} strokeWidth={2} />
      </span>
      <p className="text-[12.5px] leading-5">
        <span className="font-semibold">{title}</span>
        <br />
        {body}
      </p>
    </div>
  );
}
