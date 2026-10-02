"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
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
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("accounts.title")} subtitle={t("accounts.subtitle")} />

      <div className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 xl:max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {usingDemoData && status !== "loading" && (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-[12px] font-medium text-amber-700">
              {t("common.demoDataNotice")}
            </p>
          )}

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
            <AccountsGrid accounts={accounts} currency={business.currency} />
          )}
        </motion.div>
      </div>
    </div>
  );
}