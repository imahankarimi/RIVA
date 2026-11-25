"use client";

import type { LucideIcon } from "lucide-react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/glisse";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { usePreview } from "./PreviewProvider";

/**
 * Privacy-safe preview primitives.
 *
 * These deliberately contain no numbers, sample transactions, or generated
 * charts. They reproduce the *structure* of RIVA surfaces (labels, column
 * headings, card geometry) and mask the value area with a controlled blur and
 * a lock affordance. No account data is fetched to render them.
 */

export function LockChip({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surfaceMuted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint ring-1 ring-line/60",
        className
      )}
    >
      <Lock size={10} strokeWidth={2.4} aria-hidden />
      {t("preview.locked")}
    </span>
  );
}

/** Blurs a structural placeholder and places a readable lock message over it.
 *  The blur is applied to the small placeholder block, never the page. */
export function PreviewMask({
  children,
  message,
  reasonKey,
  cta = false,
  className,
  overlayClassName,
}: {
  children: React.ReactNode;
  message?: string;
  reasonKey?: string;
  cta?: boolean;
  className?: string;
  overlayClassName?: string;
}) {
  const { t } = useI18n();
  const { openAuthPrompt } = usePreview();
  const label = message ?? t("preview.lockedValue");

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="pointer-events-none select-none blur-[5px]">
        {children}
      </div>
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-surface/35 via-surface/60 to-surface/85 px-4 text-center",
          overlayClassName
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-ink-soft ring-1 ring-line">
          <Lock size={13} strokeWidth={2.2} aria-hidden />
        </span>
        <p className="text-[12px] font-medium text-ink-soft">{label}</p>
        {cta && (
          <Button
            variant="glass"
            onClick={() => openAuthPrompt({ reasonKey: reasonKey ?? "preview.signInToContinue" })}
            className="mt-0.5 h-8 min-h-0 px-3 text-[11.5px]"
          >
            {t("preview.signIn")}
          </Button>
        )}
      </div>
    </div>
  );
}

/** A KPI tile whose value is locked — the label and icon stay sharp. */
export function PreviewStat({
  label,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
}) {
  const { t } = useI18n();
  const toneClass =
    tone === "positive"
      ? "bg-fin-positive-surface text-fin-positive ring-fin-positive/20"
      : tone === "negative"
        ? "bg-fin-negative-surface text-fin-negative ring-fin-negative/20"
        : "bg-signal-100 text-signal-700 ring-signal-300/25";

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-surface p-4 shadow-subtle ring-1 ring-line/60 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:h-9 sm:w-9",
            toneClass
          )}
        >
          <Icon size={15} strokeWidth={2.3} className="sm:h-4 sm:w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2" aria-hidden>
        <span className="h-6 w-24 rounded-md bg-surfaceMuted blur-[5px] sm:w-28" />
        <Lock size={12} strokeWidth={2.4} className="text-ink-faint" />
      </div>
      <p className="sr-only">{t("preview.lockedValue")}</p>
    </div>
  );
}

const BAR_HEIGHTS = [42, 64, 50, 76, 58, 84] as const;

/** Bar-chart frame: grid and card geometry stay visible, values do not. */
export function PreviewChartCard({
  title,
  kind = "bars",
  className,
  cta = false,
}: {
  title: string;
  kind?: "bars" | "donut" | "line";
  className?: string;
  cta?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "relative flex min-h-[240px] flex-col overflow-hidden rounded-[20px] bg-surface p-5 shadow-subtle ring-1 ring-line/60",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[14.5px] font-bold text-ink">{title}</p>
        <LockChip />
      </div>

      <PreviewMask className="mt-4 flex-1" cta={cta} reasonKey="preview.signInForInsights">
        <div className="flex h-full min-h-[170px] flex-col">
          <div className="relative flex-1">
            <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="block border-t border-line/60" />
              ))}
            </div>
            {kind === "donut" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="block h-28 w-28 rounded-full border-[14px] border-surfaceMuted" />
              </div>
            ) : kind === "line" ? (
              <svg
                viewBox="0 0 240 100"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-3/4 w-full"
                aria-hidden
              >
                <path
                  d="M0 82 C30 74 44 52 68 58 S112 30 140 40 S188 18 240 26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-signal-300"
                />
              </svg>
            ) : (
              <div className="absolute inset-x-0 bottom-0 flex h-3/4 items-end gap-2">
                {BAR_HEIGHTS.map((height, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-md bg-surfaceMuted"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PreviewMask>

      <p className="mt-3 text-[11px] text-ink-faint">{t("preview.chartNote")}</p>
    </div>
  );
}

/** Text-led card (insights, summaries). The heading stays sharp; the prose is
 *  replaced by masked lines so nothing readable can be reconstructed. */
export function PreviewTextCard({
  title,
  lines = 3,
  cta = false,
  className,
}: {
  title: string;
  lines?: number;
  cta?: boolean;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "relative flex min-h-[200px] flex-col overflow-hidden rounded-[20px] bg-surface p-5 shadow-subtle ring-1 ring-line/60",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[14.5px] font-bold text-ink">{title}</p>
        <LockChip />
      </div>
      <PreviewMask className="mt-4 flex-1" cta={cta} reasonKey="preview.signInForInsights">
        <div className="space-y-2.5">
          {Array.from({ length: lines }).map((_, i) => (
            <span
              key={i}
              className="block h-3 rounded bg-surfaceMuted"
              style={{ width: `${88 - (i % 3) * 14}%` }}
            />
          ))}
        </div>
      </PreviewMask>
      <p className="mt-3 text-[11px] text-ink-faint">{t("preview.chartNote")}</p>
    </div>
  );
}

/** Table/list frame. Column headings stay readable; row values stay hidden. */
export function PreviewListCard({
  headings,
  rows = 4,
  cta = false,
  className,
}: {
  headings: string[];
  rows?: number;
  cta?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[20px] bg-surface ring-1 ring-line/60", className)}>
      {headings.length > 0 && (
        <div
          className="hidden gap-4 border-b border-line/60 bg-surfaceMuted/30 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint sm:grid"
          style={{ gridTemplateColumns: `minmax(0,2fr) repeat(${headings.length - 1}, minmax(0,1fr))` }}
        >
          {headings.map((heading) => (
            <span key={heading} className={cn(headings.indexOf(heading) > 0 && "text-end")}>
              {heading}
            </span>
          ))}
        </div>
      )}

      <PreviewMask
        cta={cta}
        reasonKey="preview.signInForTransactions"
        overlayClassName="from-surface/20 via-surface/50 to-surface/80"
      >
        <div className="divide-y divide-line-soft/60">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-4 sm:px-5">
              <span className="h-10 w-10 shrink-0 rounded-xl bg-surfaceMuted" />
              <div className="min-w-0 flex-1 space-y-2">
                <span
                  className="block h-3.5 rounded bg-surfaceMuted"
                  style={{ width: `${52 + (i % 3) * 12}%` }}
                />
                <span
                  className="block h-2.5 rounded bg-surfaceMuted/80"
                  style={{ width: `${28 + (i % 2) * 14}%` }}
                />
              </div>
              <span className="h-3.5 w-16 shrink-0 rounded bg-surfaceMuted" />
            </div>
          ))}
        </div>
      </PreviewMask>
    </div>
  );
}

/** Auth-only workflow surface: no ghost data at all, just a clear explanation. */
export function PreviewLockCard({
  title,
  body,
  icon: Icon = Lock,
  reasonKey = "preview.signInToContinue",
  className,
}: {
  title: string;
  body?: string;
  icon?: LucideIcon;
  reasonKey?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const { openAuthPrompt } = usePreview();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[22px] border border-line/70 bg-surface px-5 py-8 text-center shadow-subtle",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surfaceMuted text-ink-soft ring-1 ring-line/70">
        <Icon size={19} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-display text-[15px] font-bold text-ink">{title}</p>
        {body && <p className="mx-auto max-w-[34ch] text-[12.5px] leading-relaxed text-ink-faint">{body}</p>}
      </div>
      <div className="mt-1 flex flex-col items-stretch gap-2 sm:flex-row">
        <Button
          variant="filled"
          onClick={() => openAuthPrompt({ reasonKey })}
          className="h-10 rounded-full px-5 text-[13px]"
        >
          {t("preview.signIn")}
        </Button>
        <Button
          variant="glass"
          onClick={() => openAuthPrompt({ reasonKey, mode: "signup", intent: { kind: "general" } })}
          className="h-10 rounded-full px-5 text-[13px]"
        >
          {t("preview.createAccount")}
        </Button>
      </div>
    </div>
  );
}

/** Small, persistent banner that makes the preview state explicit without
 *  taking over the page. Sign-in is one tap away on every section. */
export function GuestBanner() {
  const { t } = useI18n();
  const { isGuest, openAuthPrompt } = usePreview();
  if (!isGuest) return null;

  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-[16px] border border-line/70 bg-surface px-3.5 py-2.5 shadow-subtle">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-600 ring-1 ring-signal-100">
        <Sparkles size={14} strokeWidth={2.2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-ink">{t("preview.bannerTitle")}</p>
        <p className="truncate text-[11.5px] text-ink-faint">{t("preview.bannerBody")}</p>
      </div>
      <button
        type="button"
        onClick={() => openAuthPrompt({ reasonKey: "preview.signInToContinue" })}
        className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold text-signal-600 transition-colors hover:bg-signal-50"
      >
        {t("preview.signIn")}
      </button>
    </div>
  );
}
