"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, Shield, Palette, Globe, HardDrive, ChevronRight, Lock, Plus,
  Trash2, Pencil, LogOut, Sun, Moon, Monitor, Check, Loader2, Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Separator } from "@/components/ui/Separator";
import { useToast } from "@/components/ui/Toast";
import { CurrencySelect, CurrencyLockWarning } from "@/components/settings/CurrencySelect";
import { BusinessContextSection } from "@/components/settings/BusinessContextSection";
import { ImportExportModal } from "@/components/settings/ImportExportModal";
import { useI18n, localeMeta, type Locale } from "@/lib/i18n";
import { useBusiness, useAuth } from "@/app/providers";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/preferences/PreferencesProvider";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { CURRENCY_META, defaultCurrencyFor, type BackendCurrency } from "@/lib/currency";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { WebappHeader } from "@/components/webapp/WebappHeader";

type TabId = "profile" | "business" | "ai" | "appearance" | "language" | "data";

const TABS: Array<{ id: TabId; labelKey: string; icon: typeof User }> = [
  { id: "profile", labelKey: "settings.profile", icon: User },
  { id: "business", labelKey: "settings.business", icon: Shield },
  { id: "ai", labelKey: "settings.aiPreferences", icon: Sparkle },
  { id: "appearance", labelKey: "settings.appearance", icon: Palette },
  { id: "language", labelKey: "settings.language", icon: Globe },
  { id: "data", labelKey: "settings.data", icon: HardDrive },
];

// ─── Card wrapper ──────────────────────────────────────────────────────────
function SectionCard({
  title, description, children, className,
}: {
  title: string; description?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="show"
      className={cn("rounded-xl border border-line bg-surface", className)}
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] text-ink-faint">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </motion.div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────
function ProfileTab() {
  const { t, locale } = useI18n();
  const { user, updateProfile } = useAuth();
  const { logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
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
    } finally { setSaving(false); }
  };

  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("settings.profile")} description={user?.email}>
        <div className="flex items-center gap-4">
          <Avatar name={displayName || user?.email} size="lg" className="h-16 w-16 text-lg" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">{displayName || user?.email}</p>
            <p className="text-[13px] text-ink-faint">{user?.email}</p>
          </div>
        </div>
        <Separator className="my-4" />
        {editing ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{t("profile.firstName")}</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("profile.firstNamePlaceholder")} /></div>
              <div className="space-y-1.5"><Label>{t("profile.lastName")}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("profile.lastNamePlaceholder")} /></div>
            </div>
            <div className="flex gap-2 pt-1"><Button onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim()}>{saving && <Loader2 size={14} className="animate-spin" />}{t("profile.save")}</Button><Button variant="ghost" onClick={() => setEditing(false)}>{t("common.cancel")}</Button></div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => { setFirstName(user?.firstName ?? ""); setLastName(user?.lastName ?? ""); setEditing(true); }}><Pencil size={14} />{t("common.edit")}</Button>
        )}
      </SectionCard>

      <SectionCard title={t("settings.logout")}><Button variant="ghost" onClick={() => { logout(); router.replace("/login"); }} className="gap-2 text-rose-700 hover:bg-rose-100/50 hover:text-rose-700"><LogOut size={14} />{t("settings.logout")}</Button></SectionCard>
    </motion.div>
  );
}

// ─── Business Tab ─────────────────────────────────────────────────────
function BusinessTab() {
  const { t, locale } = useI18n();
  const { business, businesses, setBusinessId, addBusiness, removeBusiness } = useBusiness();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState<BackendCurrency>(defaultCurrencyFor(locale));
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const currentMeta = CURRENCY_META[business.currency];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true); setBusinessError("");
    try { await addBusiness(newName.trim(), newCurrency); setCreateOpen(false); toast(locale === "fa" ? "کسب‌وکار ایجاد شد." : "Business created.", { variant: "success" }); }
    catch { toast(locale === "fa" ? "ایجاد ناموفق بود." : "Could not create business.", { variant: "error" }); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try { await removeBusiness(pendingDeleteId); setPendingDeleteId(null); toast(locale === "fa" ? "کسب‌وکار حذف شد." : "Business removed.", { variant: "success" }); }
    catch { toast(locale === "fa" ? "حذف ناموفق بود." : "Could not remove business.", { variant: "error" }); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("settings.baseCurrency")} description={t("settings.currencyLockedBody")}>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surfaceMuted/50 px-4 py-3">
          <span className="text-[20px]">{currentMeta.flag}</span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">{locale === "fa" ? currentMeta.nameFa : currentMeta.name} ({business.currency})</p>
            <p className="text-[11.5px] text-ink-faint">{t("settings.currencyLockedBody")}</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-surfaceMuted px-2.5 py-1 text-[11px] font-medium text-ink-faint"><Lock size={11} />{t("settings.currencyLocked")}</span>
        </div>
      </SectionCard>

      <SectionCard title="Businesses" description={`${businesses.length} workspace${businesses.length !== 1 ? "s" : ""}`}>
        <div className="space-y-2">
          {businesses.map((b) => (
            <div key={b.id} className={cn("flex items-center justify-between rounded-lg border px-4 py-3 transition-colors", b.id === business.id ? "border-signal-300 bg-signal-50" : "border-line hover:border-signal-200")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surfaceMuted text-[12px] font-semibold text-ink-soft">{b.name.charAt(0)}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{b.name}</p>
                  <p className="text-[11.5px] text-ink-faint">{CURRENCY_META[b.currency].flag} {b.currency}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {b.id !== business.id && <Button size="sm" variant="ghost" onClick={() => setBusinessId(b.id)}>{t("settings.switchTo", { name: b.name })}</Button>}
                {b.id === business.id && <span className="rounded-full bg-moss-100 px-2.5 py-1 text-[11px] font-medium text-moss-700">Active</span>}
                {businesses.length > 1 && <button onClick={() => setPendingDeleteId(b.id)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-100/50 hover:text-rose-700" aria-label={t("settings.removeBusiness")}><Trash2 size={13} /></button>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setNewName(""); setNewCurrency(defaultCurrencyFor(locale)); setCreateOpen(true); }} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2.5 text-[12.5px] font-medium text-ink-faint transition-colors hover:border-signal-300 hover:text-signal-700"><Plus size={13} />{t("settings.addBusiness")}</button>
      </SectionCard>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("settings.createBusinessTitle")}>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>{t("settings.business")}</Label><Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("settings.businessNamePlaceholder")} /></div>
          <CurrencySelect value={newCurrency} onChange={setNewCurrency} label={t("settings.baseCurrency")} />
          <CurrencyLockWarning title={t("settings.currencyChooseCarefullyTitle")} body={t("settings.currencyChooseCarefullyBody")} />
          {businessError && <Alert variant="destructive">{businessError}</Alert>}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row"><Button onClick={handleCreate} disabled={creating || !newName.trim()} className="sm:flex-1">{t("settings.createBusinessAction")}</Button><Button variant="ghost" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button></div>
        </div>
      </Modal>

      <Modal open={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)} title={t("settings.deleteBusinessConfirmTitle")}>
        <p className="text-[13px] text-ink">{t("settings.deleteWarningIntro")}</p>
        <ul className="my-2 space-y-1 text-[12.5px] text-ink-soft">{[t("settings.deleteWarningAccounts"), t("settings.deleteWarningTransactions"), t("settings.deleteWarningReports"), t("settings.deleteWarningAiConversations")].map((item) => <li key={item} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-ink-faint" />{item}</li>)}</ul>
        <p className="text-[12px] font-semibold text-rose-700">{t("settings.deleteWarningIrreversible")}</p>
        {businessError && <Alert variant="destructive" className="mt-2">{businessError}</Alert>}
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(null)}>{t("common.cancel")}</Button><Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>{t("settings.removeBusiness")}</Button></div>
      </Modal>
    </motion.div>
  );
}

// ─── AI Tab ─────────────────────────────────────────────────────────────
function AITab() {
  const { showAccountingTermsByDefault, setShowAccountingTermsByDefault } = usePreferences();
  const { t } = useI18n();
  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("settings.aiPreferences")}>
        <div className="space-y-1">
          {[
            { label: t("settings.showAccountingTerms"), desc: t("settings.showAccountingTermsBody"), checked: showAccountingTermsByDefault, onChange: setShowAccountingTermsByDefault },
            { label: t("settings.aiSuggestions"), desc: t("common.comingSoon"), checked: false, onChange: () => {}, disabled: true },
          ].map(({ label, desc, checked, onChange, disabled }) => (
            <div key={label} className="flex items-center justify-between rounded-lg px-1 py-3">
              <div className="space-y-0.5"><p className="text-[13px] font-medium text-ink">{label}</p><p className="text-[12.5px] text-ink-faint">{desc}</p></div>
              <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title={t("businessContext.title")}><BusinessContextSection /></SectionCard>
    </motion.div>
  );
}

// ─── Appearance Tab ─────────────────────────────────────────────────────
function AppearanceTab() {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();
  const options = [
    { id: "light" as const, icon: Sun, label: t("common.light") },
    { id: "dark" as const, icon: Moon, label: t("common.dark") },
    { id: "system" as const, icon: Monitor, label: t("common.system") },
  ];

  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("settings.appearance")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setPreference(id)} className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-[13px] font-medium transition-all",
              preference === id ? "border-signal-500 bg-signal-50/60 text-ink" : "border-line bg-surface text-ink-soft hover:border-signal-300"
            )}>
              <Icon size={20} strokeWidth={1.8} className={preference === id ? "text-signal-600" : "text-ink-faint"} />
              {label}
              {preference === id && <Check size={14} className="text-signal-600" />}
            </button>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ─── Language Tab ───────────────────────────────────────────────────────
function LanguageTab() {
  const { t, locale, setLocale } = useI18n();
  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("settings.language")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(localeMeta) as Locale[]).map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={cn(
              "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-[13px] font-medium transition-all",
              l === locale ? "border-signal-500 bg-signal-50/60 text-ink" : "border-line bg-surface text-ink-soft hover:border-signal-300"
            )}>
              <span className="text-[18px]">{localeMeta[l].flag}</span>
              <span className="flex-1 text-left">{localeMeta[l].nativeLabel}</span>
              {l === locale && <Check size={14} className="text-signal-600" />}
            </button>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ─── Data Tab ──────────────────────────────────────────────────────────
function DataTab() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const { transactions } = useTransactions(business?.id ?? null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  return (
    <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
      <SectionCard title={t("importExport.title")} description={t("settings.dataBody")}>
        <Button variant="outline" onClick={() => setImportExportOpen(true)} className="gap-2"><HardDrive size={14} />{t("importExport.title")}</Button>
      </SectionCard>
      <ImportExportModal open={importExportOpen} onClose={() => setImportExportOpen(false)} transactions={transactions} currency={business.currency} />
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const tabIcons: Record<TabId, typeof User> = { profile: User, business: Shield, ai: Sparkle, appearance: Palette, language: Globe, data: HardDrive };
  const tabContent: Record<TabId, React.ReactNode> = {
    profile: <ProfileTab />,
    business: <BusinessTab />,
    ai: <AITab />,
    appearance: <AppearanceTab />,
    language: <LanguageTab />,
    data: <DataTab />,
  };

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("settings.title")} title={t("settings.title")} description={t("settings.subtitle")} icon={User} />

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:gap-6">
        {/* Desktop/tablet: vertical tab nav */}
        <nav className="hidden w-52 shrink-0 md:flex md:flex-col gap-1">
          {TABS.map((tab) => {
            const Icon = tabIcons[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 text-left",
                  activeTab === tab.id
                    ? "bg-surfaceMuted text-ink"
                    : "text-ink-soft hover:bg-surfaceMuted/60 hover:text-ink"
                )}
              >
                <Icon size={15} strokeWidth={1.8} className={activeTab === tab.id ? "text-signal-600" : "text-ink-faint"} />
                {t(tab.labelKey)}
              </button>
            );
          })}
          <Separator className="my-2" />
          <button
            onClick={() => { logout(); router.replace("/login"); }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-700 hover:bg-rose-100/40"
          >
            <LogOut size={15} strokeWidth={1.8} />
            {t("settings.logout")}
          </button>
        </nav>

        {/* Mobile: horizontal tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 md:hidden scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tabIcons[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-surfaceMuted text-ink"
                    : "text-ink-faint hover:bg-surfaceMuted/50 hover:text-ink"
                )}
              >
                <Icon size={13} strokeWidth={1.8} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}