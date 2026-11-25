"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Plus, Wallet } from "lucide-react";
import { Button, SearchField, SegmentedControl } from "@/components/glisse";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "@/components/preview/PreviewProvider";
import {
  GuestBanner,
  PreviewListCard,
  PreviewStat,
} from "@/components/preview/PreviewUI";

type Mode = "all" | "income" | "expense";

const HEADINGS_KEYS = [
  "common.description",
  "common.category",
  "common.date",
  "common.amount",
  "common.status",
] as const;

/**
 * Cash / Income / Expenses as a guest sees them. The real toolbar and list
 * frame stay usable for exploring the interface; every monetary figure and
 * every row value is replaced by the locked preview treatment.
 */
export function GuestTransactionsView({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  const { openAuthPrompt } = usePreview();
  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState<"all" | "in" | "out">("all");

  const title =
    mode === "income"
      ? t("nav.income")
      : mode === "expense"
        ? t("nav.expenses")
        : t("webapp.nav.cash");

  const description =
    mode === "income"
      ? t("income.subtitle")
      : mode === "expense"
        ? t("expenses.subtitle")
        : t("webapp.cash.subtitle");

  const askAuth = () =>
    openAuthPrompt({
      reasonKey: "preview.signInForTransactions",
      intent: { kind: "general" },
    });

  const headings = HEADINGS_KEYS.map((key) => t(key));

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader
        eyebrow={mode === "all" ? undefined : t("webapp.nav.cash")}
        title={title}
        description={description}
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
        <div className={mode === "all" ? "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" : "grid grid-cols-1 gap-3"}>
          {mode !== "income" && (
            <PreviewStat
              label={mode === "expense" ? t("webapp.cash.expense") : t("overview.balance")}
              icon={mode === "expense" ? ArrowUpFromLine : Wallet}
              tone={mode === "expense" ? "negative" : "default"}
            />
          )}
          {mode !== "expense" && (
            <PreviewStat
              label={t("webapp.cash.income")}
              icon={ArrowDownToLine}
              tone="positive"
            />
          )}
          {mode === "all" && (
            <PreviewStat
              label={t("webapp.cash.expense")}
              icon={ArrowUpFromLine}
              tone="negative"
            />
          )}
        </div>

        <div className="space-y-3">
          <SearchField
            value={search}
            onValueChange={setSearch}
            placeholder={t("webapp.cash.searchPlaceholder")}
            className="w-full max-w-none"
          />

          {mode === "all" ? (
            <div className="grid grid-cols-[3fr_2fr] items-center gap-3">
              <SegmentedControl
                className="cash-filter-segmented"
                items={[
                  { value: "all", label: t("common.all") },
                  { value: "in", label: t("webapp.cash.income") },
                  { value: "out", label: t("webapp.cash.expense") },
                ]}
                value={heading}
                onValueChange={(v) => setHeading(v as "all" | "in" | "out")}
              />
              <div className="cash-import-export-slot">
                <Button
                  variant="glass"
                  onClick={askAuth}
                  className="w-full min-h-0"
                  aria-label={t("importExport.title")}
                >
                  {t("importExport.import")} / {t("importExport.export")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="glass" onClick={askAuth} className="min-h-0">
                {t("importExport.title")}
              </Button>
            </div>
          )}
        </div>

        <PreviewListCard headings={headings} rows={5} cta />
      </div>
    </div>
  );
}
