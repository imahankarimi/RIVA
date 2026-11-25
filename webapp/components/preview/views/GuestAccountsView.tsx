"use client";

import { BookOpen, Scale, Wallet } from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { useI18n } from "@/lib/i18n";
import {
  GuestBanner,
  PreviewListCard,
  PreviewStat,
} from "@/components/preview/PreviewUI";

/** Chart of accounts as structure only: categories and totals labels stay,
 *  account names, codes, and balances do not exist for a guest. */
export function GuestAccountsView() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader
        eyebrow={t("nav.accounts")}
        title={t("accounts.title")}
        description={t("accounts.subtitle")}
      />

      <GuestBanner />

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PreviewStat label={t("accounts.assets")} icon={Wallet} />
          <PreviewStat label={t("accounts.liabilities")} icon={Scale} tone="negative" />
          <PreviewStat label={t("accounts.netPosition")} icon={BookOpen} />
        </div>

        <PreviewListCard
          headings={[t("accounts.title"), t("common.category"), t("common.amount")]}
          rows={6}
          cta
        />
      </div>
    </div>
  );
}
