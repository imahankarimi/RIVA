"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { RecurringRow } from "@/components/demo/DemoScreen";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { formatCurrency } from "@/lib/currency";

const subscriptions = [
  { name: "Netflix", amount: 15.99, cadence: "monthly", nextOn: "2026-10-01" },
  { name: "Adobe Creative Cloud", amount: 54.99, cadence: "monthly", nextOn: "2026-09-28" },
  { name: "Hostinger Hosting", amount: 89.0, cadence: "yearly", nextOn: "2027-01-15" },
  { name: "Spotify", amount: 9.99, cadence: "monthly", nextOn: "2026-10-05" },
];

export default function SubscriptionsPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const total = subscriptions.reduce((s, x) => s + x.amount, 0);
  const monthly = subscriptions.filter((s) => s.cadence === "monthly").reduce((s, x) => s + x.amount, 0);

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-1 sm:px-6">
      <WebappHeader eyebrow={t("nav.subscriptions")} title={t("nav.subscriptions")} icon={RefreshCw} />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <Alert variant="warning">{t("demo.subsNotice")}</Alert>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">{t("demo.monthlyTotal")}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(monthly, business.currency, locale)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">{t("demo.allSubs")}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(total, business.currency, locale)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("nav.subscriptions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscriptions.map((s) => (
                <RecurringRow key={s.name} {...s} currency={business.currency} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}