"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronRight,
  Plus,
  Sparkle,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "@/components/preview/PreviewProvider";
import {
  GuestBanner,
  PreviewChartCard,
  PreviewListCard,
  PreviewStat,
} from "@/components/preview/PreviewUI";

/**
 * Overview as a guest sees it: the real dashboard geometry — KPI tiles, chart
 * frames, list headings, the assistant card — with every value replaced by a
 * privacy-safe placeholder. Nothing is fetched; no figure is invented.
 */
export function GuestDashboardView() {
  const { t } = useI18n();
  const { openAuthPrompt } = usePreview();

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader
        title={t("webapp.nav.overview")}
        action={
          <button
            onClick={() =>
              openAuthPrompt({
                reasonKey: "preview.signInToAddTransaction",
                intent: { kind: "add-transaction" },
              })
            }
            className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-500 text-onSignal shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 sm:h-[52px] sm:w-[52px]"
            aria-label={t("addIncome.title")}
          >
            <Plus size={24} strokeWidth={2.5} className="sm:h-7 sm:w-7" />
          </button>
        }
      />

      <GuestBanner />

      <div className="space-y-6 sm:space-y-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
          <PreviewStat label={t("overview.balance")} icon={Wallet} />
          <PreviewStat label={t("overview.revenue")} icon={TrendingUp} tone="positive" />
          <PreviewStat label={t("overview.expenses")} icon={TrendingDown} tone="negative" />
          <PreviewStat label={t("overview.cashFlow")} icon={ArrowLeftRight} />
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          <PreviewChartCard
            title={t("overview.moneyMovement")}
            kind="line"
            className="col-span-12 sm:col-span-6"
            cta
          />
          <PreviewChartCard
            title={t("overview.financialHealth")}
            kind="donut"
            className="col-span-12 sm:col-span-6"
          />
          <PreviewListCard
            className="col-span-12 sm:col-span-4"
            headings={[t("accounts.title"), t("common.amount")]}
            rows={4}
          />
          <PreviewChartCard
            title={t("overview.moneyMovement")}
            kind="bars"
            className="col-span-12 sm:col-span-4"
          />
          <PreviewChartCard
            title={t("overview.expenseBreakdown")}
            kind="donut"
            className="col-span-12 sm:col-span-4"
          />
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold text-ink sm:text-[17px]">
                {t("preview.overviewRecent")}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                {t("preview.overviewRecentBody")}
              </p>
            </div>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold text-ink-faint">
              {t("common.seeAll")}
              <ChevronRight size={14} strokeWidth={2.5} className="rtl:rotate-180" aria-hidden />
            </span>
          </div>
          <PreviewListCard
            headings={[t("common.description"), t("common.category"), t("common.amount")]}
            rows={4}
            cta
          />
        </section>

        <Link
          href="/assistant"
          className="group relative flex min-h-[160px] flex-col items-start gap-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-deep-navy to-deep-navy/95 p-6 shadow-raised transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] sm:min-h-[180px] sm:p-7"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-steel-blue/15 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          />
          <div className="relative z-10 flex w-full flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center gap-2.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-warm-white/75">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm-white/15 backdrop-blur-sm">
                <Sparkle size={14} strokeWidth={2.5} className="text-steel-blue" />
              </div>
              <span>RIVA AI</span>
            </div>
            <p className="max-w-lg font-display text-[20px] font-bold leading-[1.3] text-warm-white sm:text-[22px] sm:leading-[1.28]">
              {t("webapp.home.aiTitle")}
            </p>
            <p className="max-w-md text-[13px] leading-[1.6] text-warm-white/75 sm:text-[13.5px]">
              {t("webapp.home.aiBody")}
            </p>
            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-warm-white/20 px-4 py-2.5 text-[12.5px] font-semibold text-warm-white ring-1 ring-inset ring-warm-white/20 backdrop-blur-sm sm:text-[13px]">
              {t("webapp.nav.assistant")}
              <ChevronRight size={14} strokeWidth={2.5} className="rtl:rotate-180" aria-hidden />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
