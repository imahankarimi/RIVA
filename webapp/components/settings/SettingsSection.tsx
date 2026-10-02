import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden p-0">
      <h3 className="border-b border-line px-5 py-3.5 font-display text-[13.5px] font-bold text-ink">{title}</h3>
      <div className="divide-y divide-line-soft">{children}</div>
    </Card>
  );
}

export function SettingsRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12px] text-ink-faint">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
