"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { DemoNotice } from "@/components/demo/DemoScreen";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";
import { formatCurrency } from "@/lib/currency";

const debts = [
  { name: "Business Loan", creditor: "First National Bank", balance: 21800, limit: 30000, annualPct: 8.5, due: "2026-10-12" },
  { name: "Supplier Credit", creditor: "Meridian Supplies", balance: 4200, limit: 5000, annualPct: 0, due: "2026-10-03" },
  { name: "Equipment Lease", creditor: "LeaseWorks", balance: 9600, limit: 15000, annualPct: 6.2, due: "2026-11-01" },
];

export default function DebtsPage() {
  const { t, locale } = useI18n();
  const { business } = useBusiness();
  const currency = business.currency;

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("nav.debts")} />

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-10 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <DemoNotice text={t("demo.debtsNotice")} />

          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <CreditCard className="size-4" />
            </span>
            <h2 className="font-display text-[18px] font-bold text-ink">{t("nav.debts")}</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {debts.map((d) => {
              const pct = Math.round((d.balance / d.limit) * 100);
              return (
                <Card key={d.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      {d.name}
                      <Badge variant="destructive" className="text-[10px]">{d.annualPct > 0 ? `${d.annualPct}% APR` : "0%"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[11px] text-muted-foreground">{d.creditor}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatCurrency(d.balance, currency, locale)}</p>
                    <Progress value={pct} className="mt-3 h-2" />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{pct}% of {formatCurrency(d.limit, currency, locale)}</span>
                      <span>{t("demo.nextOn")} {d.due}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}