"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, User, Shield, Palette, Globe, HardDrive, Sparkle, LogOut, Pencil, Check, Loader2, Lock,
} from "lucide-react";
import { useI18n, localeMeta, type Locale } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { usePreferences } from "@/lib/preferences/PreferencesProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Separator } from "@/components/ui/Separator";
import { Modal } from "@/components/ui/Modal";
import { GLASS } from "@/components/webapp/glass";
import { BusinessContextSection } from "@/components/settings/BusinessContextSection";
import { CurrencySelect, CurrencyLockWarning } from "@/components/settings/CurrencySelect";
import { ImportExportModal } from "@/components/settings/ImportExportModal";
import { useToast } from "@/components/ui/Toast";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { CURRENCY_META, defaultCurrencyFor, type BackendCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type TabId = "profile" | "business" | "ai" | "appearance" | "language" | "data";

const TABS: Array<{ id: TabId; labelKey: string; icon: typeof User }> = [
  { id: "profile", labelKey: "settings.profile", icon: User },
  { id: "business", labelKey: "settings.business", icon: Shield },
  { id: "ai", labelKey: "settings.aiPreferences", icon: Sparkle },
  { id: "appearance", labelKey: "settings.appearance", icon: Palette },
  { id: "language", labelKey: "settings.language", icon: Globe },
  { id: "data", labelKey: "settings.data", icon: HardDrive },
];

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-line bg-surface", className)}
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12px] text-ink-faint">{description}</p>}
        </div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </motion.div>
  );
}

function ProfileTab() {
  const { t, locale } = useI18n();
  const { user, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(firstName.trim(), lastName.trim());
      setEditing(false);
      toast(locale === "fa" ? "پروفایل ذخیره شد." : "Profile saved.", { variant: "success" });
    } catch {
      toast(locale === "fa" ? "ذخیره‌سازی ناموفق بود." : "Could not save profile.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <SectionCard title={t("settings.profile")} description={user?.email}>
        <div className="flex items-center gap-3">
          <Avatar name={displayName || user?.email} size="lg" className="h-12 w-12 text-sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">{displayName || user?.email}</p>
            <p className="text-[11.5px] text-ink-faint">{user?.email}</p>
          </div>
        </div>
        <Separator className="my-3" />
        {editing ? (
          <div className="space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[12px]">{t("profile.firstName")}</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("profile.firstNamePlaceholder")}
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">{t("profile.lastName")}</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("profile.lastNamePlaceholder")}
                  className="h-9 text-[13px]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !firstName.trim() || !lastName.trim()}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {t("profile.save")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFirstName(user?.firstName ?? "");
              setLastName(user?.lastName ?? "");
              setEditing(true);
            }}
          >
            <Pencil size={13} />
            {t("common.edit")}
          </Button>
        )}
      </SectionCard>

      <SectionCard title={t("settings.logout")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="gap-2 text-rose-700 hover:bg-rose-100/50 hover:text-rose-700"
        >
          <LogOut size={13} />
          {t("settings.logout")}
        </Button>
      </SectionCard>
    </div>
  );
}

function BusinessTab() {
  const { t, locale } = useI18n();
  const { business, businesses, setBusinessId } = useBusiness();
  const currentMeta = CURRENCY_META[business.currency];

  return (
    <div className="space-y-3">
      <SectionCard title={t("settings.baseCurrency")} description={t("settings.currencyLockedBody")}>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surfaceMuted/50 px-3 py-2.5">
          <span className="text-[18px]">{currentMeta.flag}</span>
          <div>
            <p className="text-[12px] font-semibold text-ink">
              {locale === "fa" ? currentMeta.nameFa : currentMeta.name} ({business.currency})
            </p>
            <p className="text-[10.5px] text-ink-faint">{t("settings.currencyLockedBody")}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surfaceMuted px-2 py-1 text-[10px] font-medium text-ink-faint">
            <Lock size={10} />
            {t("settings.currencyLocked")}
          </span>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.business")} description={`${businesses.length} workspace${businesses.length !== 1 ? "s" : ""}`}>
        <div className="space-y-2">
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => setBusinessId(b.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all text-left",
                b.id === business.id
                  ? "border-signal-300 bg-signal-50"
                  : "border-line hover:border-signal-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surfaceMuted text-[11px] font-semibold text-ink-soft">
                  {b.name.charAt(0)}
                </span>
                <div>
                  <p className="text-[12px] font-medium text-ink">{b.name}</p>
                  <p className="text-[10.5px] text-ink-faint">{CURRENCY_META[b.currency].flag} {b.currency}</p>
                </div>
              </div>
              {b.id === business.id && (
                <span className="rounded-full bg-moss-100 px-2 py-0.5 text-[10px] font-medium text-moss-700">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function AITab() {
  const { t } = useI18n();
  const { showAccountingTermsByDefault, setShowAccountingTermsByDefault } = usePreferences();

  return (
    <div className="space-y-3">
      <SectionCard title={t("settings.aiPreferences")}>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg px-1 py-2">
            <div>
              <p className="text-[12px] font-medium text-ink">{t("settings.showAccountingTerms")}</p>
              <p className="text-[11px] text-ink-faint">{t("settings.showAccountingTermsBody")}</p>
            </div>
            <Switch
              checked={showAccountingTermsByDefault}
              onChange={setShowAccountingTermsByDefault}
              label={t("settings.showAccountingTerms")}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("businessContext.title")}>
        <BusinessContextSection />
      </SectionCard>
    </div>
  );
}

function AppearanceTab() {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();
  const options = [
    { id: "light" as const, icon: "☀️", label: t("common.light") },
    { id: "dark" as const, icon: "🌙", label: t("common.dark") },
    { id: "system" as const, icon: "⚙️", label: t("common.system") },
  ];

  return (
    <div className="space-y-3">
      <SectionCard title={t("settings.appearance")}>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setPreference(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-[12px] font-medium transition-all",
                preference === id
                  ? "border-signal-500 bg-signal-50/60 text-ink"
                  : "border-line bg-surface text-ink-soft hover:border-signal-300"
              )}
            >
              <span className="text-lg">{icon}</span>
              {label}
              {preference === id && <Check size={13} className="text-signal-600" />}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function LanguageTab() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="space-y-3">
      <SectionCard title={t("settings.language")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(localeMeta) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-[12px] font-medium transition-all",
                l === locale
                  ? "border-signal-500 bg-signal-50/60 text-ink"
                  : "border-line bg-surface text-ink-soft hover:border-signal-300"
              )}
            >
              <span className="text-[16px]">{localeMeta[l].flag}</span>
              <span className="flex-1 text-left">{localeMeta[l].nativeLabel}</span>
              {l === locale && <Check size={13} className="text-signal-600" />}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DataTab({
  transactions,
}: {
  transactions: any[];
}) {
  const { t } = useI18n();
  const { business } = useBusiness();
  const [importExportOpen, setImportExportOpen] = useState(false);

  return (
    <div className="space-y-3">
      <SectionCard title={t("importExport.title")} description={t("settings.dataBody")}>
        <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)} className="gap-2">
          <HardDrive size={13} />
          {t("importExport.title")}
        </Button>
      </SectionCard>

      <ImportExportModal
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        transactions={transactions}
        currency={business.currency}
      />
    </div>
  );
}

export function WebappSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { business } = useBusiness();
  const { transactions } = useTransactions(business?.id ?? null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const tabIcons: Record<TabId, typeof User> = {
    profile: User,
    business: Shield,
    ai: Sparkle,
    appearance: Palette,
    language: Globe,
    data: HardDrive,
  };

  const tabContent: Record<TabId, React.ReactNode> = {
    profile: <ProfileTab />,
    business: <BusinessTab />,
    ai: <AITab />,
    appearance: <AppearanceTab />,
    language: <LanguageTab />,
    data: <DataTab transactions={transactions} />,
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-center">
          <motion.button
            aria-label={t("common.close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ y: "100%", x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: "100%", x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "relative z-10 flex h-[90vh] sm:h-auto sm:max-h-[85vh] w-full sm:w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden",
              GLASS.base,
              "border-b-0 sm:border"
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/25 px-5 py-4">
              <h2 className="font-display text-[16px] font-bold text-deep-ink dark:text-warm-white">
                {t("settings.title")}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-deep-ink/60 dark:text-warm-white/60 hover:bg-white/40 dark:hover:bg-white/10 hover:text-deep-ink dark:hover:text-warm-white"
                aria-label={t("common.close")}
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex flex-1 min-w-0 overflow-hidden flex-col sm:flex-row">
              {/* Tab navigation */}
              <nav className="order-2 flex gap-1 overflow-x-auto border-t border-white/25 px-3 py-2 sm:order-1 sm:w-40 sm:shrink-0 sm:border-r sm:border-t-0 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-white/25 sm:py-3 sm:px-3">
                {TABS.map((tab) => {
                  const Icon = tabIcons[tab.id];
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap sm:w-full sm:text-left sm:text-[12px] sm:px-3 sm:py-2",
                        activeTab === tab.id
                          ? "bg-surfaceMuted text-ink"
                          : "text-ink-soft hover:bg-surfaceMuted/60 hover:text-ink"
                      )}
                    >
                      <Icon size={13} strokeWidth={1.8} className="sm:w-4 sm:h-4" />
                      <span className="sm:inline">{t(tab.labelKey)}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Content area */}
              <div className="order-1 flex-1 min-w-0 overflow-y-auto px-3 py-3 sm:order-2 sm:px-4 sm:py-4">
                {tabContent[activeTab]}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
