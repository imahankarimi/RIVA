"use client";

import type { TooltipProps } from "recharts";

interface ChartTooltipProps extends TooltipProps<number, string> {
  formatValue: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

/** A restrained tooltip — surface card, hairline border, no drop shadow theatrics. */
export function ChartTooltip({ active, payload, label, formatValue, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-raised">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-medium text-ink-faint">
          {labelFormatter ? labelFormatter(String(label)) : label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-ink-soft">{entry.name}</span>
            <span className="ms-auto font-mono font-figures font-semibold text-ink">
              {formatValue(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
