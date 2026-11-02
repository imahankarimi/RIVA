"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { verifyEmail } from "@/lib/api/auth";

type State = "loading" | "success" | "error" | "missing";

function VerifyEmailInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "loading" : "missing");

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmail(token)
      .then(() => {
        if (active) setState("success");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div className="pointer-events-none absolute -start-28 top-0 h-72 w-72 rounded-full bg-signal-100/70 blur-3xl" />
      <div className="relative w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-raised ring-1 ring-line animate-pop-in">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">
            {t("auth.verifyTitle")}
          </h1>
        </div>

        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 py-4 text-[13.5px] text-ink-soft">
            <Loader2 size={16} className="animate-spin" />
            {t("auth.connecting")}
          </div>
        )}
        {state === "success" && (
          <div className="space-y-4">
            <Alert variant="success">{t("auth.verifySuccess")}</Alert>
            <Button className="w-full" onClick={() => router.push("/login")}>
              {t("auth.goToLogin")}
            </Button>
          </div>
        )}
        {(state === "error" || state === "missing") && (
          <div className="space-y-4">
            <Alert variant="destructive">{t("auth.verifyInvalidToken")}</Alert>
            <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
              {t("auth.goToLogin")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
