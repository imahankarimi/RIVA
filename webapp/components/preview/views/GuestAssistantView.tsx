"use client";

import { MessageCircle, PenLine, Sparkles, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GuestBanner, PreviewLockCard } from "@/components/preview/PreviewUI";

const POINTS = [
  { icon: PenLine, key: "preview.assistantPoint1" },
  { icon: MessageCircle, key: "preview.assistantPoint2" },
  { icon: TrendingUp, key: "preview.assistantPoint3" },
] as const;

/**
 * The assistant is an account-only workflow: there is no meaningful empty
 * chat to preview and no anonymous model access. Guests get the product
 * explanation plus a clear way in — never a fake conversation.
 */
export function GuestAssistantView() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <GuestBanner />

      <div className="flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center gap-6 py-8 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-500 to-signal-600 text-onSignal shadow-raised">
          <Sparkles size={24} strokeWidth={2} aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
            {t("preview.assistantTitle")}
          </h1>
          <p className="mx-auto max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            {t("preview.assistantBody")}
          </p>
        </div>

        <ul className="grid w-full max-w-md gap-2 sm:grid-cols-3">
          {POINTS.map(({ icon: Icon, key }) => (
            <li
              key={key}
              className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-surface px-3 py-2.5 text-start text-[11.5px] font-medium leading-snug text-ink-soft sm:flex-col sm:items-center sm:gap-2 sm:py-3.5 sm:text-center"
            >
              <Icon size={15} strokeWidth={2} className="shrink-0 text-signal-600" aria-hidden />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        <PreviewLockCard
          title={t("preview.assistantTitle")}
          body={t("preview.signInForAssistant")}
          icon={Sparkles}
          reasonKey="preview.signInForAssistant"
          className="w-full max-w-md"
        />
      </div>
    </div>
  );
}
