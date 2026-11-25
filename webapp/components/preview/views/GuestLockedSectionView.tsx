"use client";

import type { LucideIcon } from "lucide-react";
import { WebappHeader } from "@/components/webapp/WebappHeader";
import { GuestBanner, PreviewLockCard } from "@/components/preview/PreviewUI";

/**
 * Guest treatment for account-only sections (settings, planning). No demo
 * arrays, no sample figures — the section explains itself and asks for the
 * account it needs.
 */
export function GuestLockedSectionView({
  eyebrow,
  title,
  description,
  icon,
  reasonKey,
  body,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  reasonKey: string;
  body: string;
}) {
  return (
    <div className="mx-auto w-full max-w-content px-4 pb-8 pt-4 sm:px-6 sm:pt-5">
      <WebappHeader eyebrow={eyebrow} title={title} description={description} icon={icon} />

      <GuestBanner />

      <div className="mx-auto w-full max-w-md">
        <PreviewLockCard
          title={title}
          body={body}
          icon={icon}
          reasonKey={reasonKey}
        />
      </div>
    </div>
  );
}
