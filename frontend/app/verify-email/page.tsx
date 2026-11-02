"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
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
    <AuthFlowShell title={t("auth.verifyTitle")}>
      {state === "loading" && (
        <div className="flex items-center gap-2 text-[13.5px] text-ink-soft">
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
    </AuthFlowShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
