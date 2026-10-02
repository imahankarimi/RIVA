"use client";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { useAuth } from "@/app/providers";
import { useI18n } from "@/lib/i18n";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();
  if (status === "loading") return <main className="grid min-h-screen place-items-center bg-paper text-sm text-ink-faint">{t("common.loading")}</main>;
  if (status === "unauthenticated") return <AuthScreen />;
  return <>{children}</>;
}
