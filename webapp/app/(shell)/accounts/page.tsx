"use client";

import { motion } from "framer-motion";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappNotice } from "@/components/webapp/WebappNotice";
import { AccountsGrid } from "@/components/accounts/AccountsGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { useAccounts } from "@/lib/hooks/useAccounts";

function AccountsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[168px]" />
        ))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const { accounts, status, error, usingDemoData, refetch } = useAccounts(business?.id ?? null);

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("nav.accounts")} title={t("accounts.title")} description={t("accounts.subtitle")} />

      <WebappNotice variant={usingDemoData ? "demo" : undefined} />

      {status === "loading" && <AccountsSkeleton />}

      {status === "error" && (
        <ErrorState
          title={t("accounts.loadErrorTitle")}
          body={error ?? t("accounts.loadErrorBody")}
          onRetry={refetch}
          retryLabel={t("common.retry")}
        />
      )}

      {status !== "loading" && status !== "error" && accounts.length === 0 && (
        <EmptyState title={t("accounts.emptyTitle")} body={t("accounts.emptyBody")} />
      )}

      {status !== "loading" && status !== "error" && accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <AccountsGrid accounts={accounts} currency={business.currency} />
        </motion.div>
      )}
    </div>
  );
}