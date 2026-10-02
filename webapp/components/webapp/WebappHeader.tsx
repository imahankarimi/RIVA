"use client";

import type { LucideIcon } from "lucide-react";

/** Consistent page header for webapp content pages — eyebrow / title on the
 *  left, an optional action slot on the right. Content stays crisp (no glass). */
export function WebappHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex items-start gap-2 sm:gap-3">
        {Icon && (
          <div className="shrink-0 mt-1">
            <Icon size={24} className="text-signal-600 sm:w-7 sm:h-7" strokeWidth={1.8} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{eyebrow}</p>
          )}
          {title && <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight text-ink sm:mt-1.5 sm:text-[28px]">{title}</h1>}
          {description && <p className="mt-0.5 text-[12px] text-ink-faint sm:mt-1 sm:text-[12.5px]">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:mt-0">{action}</div>}
    </div>
  );
}