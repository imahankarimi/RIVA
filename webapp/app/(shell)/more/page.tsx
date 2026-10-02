"use client";

import { useState } from "react";
import { LayoutGrid, LogOut, Settings2, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { WebappSettingsModal } from "@/components/webapp/WebappSettingsModal";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/app/providers";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  primaryNavItems,
  insightNavItems,
  planningNavItems,
  supportNavItems,
} from "@/components/webapp/nav-items";

export default function MorePage() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  const sections = [
    { label: t("sidebar.workspace"), items: primaryNavItems },
    { label: t("sidebar.insights"), items: insightNavItems },
    { label: t("sidebar.planning"), items: planningNavItems },
    { label: t("sidebar.support"), items: supportNavItems },
  ];

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("webapp.nav.more")} title={t("webapp.more.title")} description={t("webapp.more.subtitle")} icon={LayoutGrid} />

      {/* Account card */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <Avatar name={displayName} size="lg" className="h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-ink">{displayName}</p>
          <p className="truncate text-[11.5px] text-ink-faint">{user?.email}</p>
        </div>
      </div>

      {/* Full navigation, grouped like the sidebar */}
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {section.label}
            </h2>
            <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surfaceMuted/40"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-100 text-signal-700 dark:bg-signal-900/40 dark:text-signal-400">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">{t(item.labelKey)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Settings */}
        <section>
          <h2 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
            {t("webapp.more.account")}
          </h2>
          <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surfaceMuted/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-100 text-signal-700 dark:bg-signal-900/40 dark:text-signal-400">
                <Settings2 size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">{t("settings.title")}</span>
                <span className="block text-[11.5px] text-ink-faint">{t("webapp.more.account")}</span>
              </span>
            </button>
            <Link
              href="/settings"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surfaceMuted/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-100 text-signal-700 dark:bg-signal-900/40 dark:text-signal-400">
                <UserCircle2 size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">Edit Profile</span>
                <span className="block text-[11.5px] text-ink-faint">Manage your profile details</span>
              </span>
            </Link>
          </div>
        </section>
      </div>

      {/* Logout */}
      <div className="mt-5 rounded-2xl bg-surface ring-1 ring-line">
        <Button variant="ghost" onClick={logout} className={cn("w-full gap-2 text-rose-700 hover:bg-rose-100/30 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20")}>
          <LogOut size={14} />
          {t("webapp.more.logout")}
        </Button>
      </div>

      <WebappSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}