"use client";

import { Paperclip, File, Image as ImageIcon, Camera } from "lucide-react";
import { Menu } from "@/components/glisse";
import { useI18n } from "@/lib/i18n";

interface AttachmentMenuProps {
  disabled?: boolean;
  onFilesClick: () => void;
  onPhotosClick: () => void;
  onCameraClick: () => void;
}

/**
 * Attachment menu positioned above the button to avoid Bottom Tab Bar.
 * Uses CSS to override Glisse Menu's default downward positioning.
 */
export function AttachmentMenu({
  disabled,
  onFilesClick,
  onPhotosClick,
  onCameraClick,
}: AttachmentMenuProps) {
  const { t } = useI18n();

  return (
    <div
      className="attachment-menu-wrapper relative flex h-9 w-9 shrink-0 items-center justify-center [&_button]:!h-9 [&_button]:!w-9 [&_button]:!min-h-0 [&_button]:!min-w-0 [&_button]:!rounded-full [&_button]:!p-0"
    >
      <Menu
        aria-label={t("assistant.attach") || "Attach"}
        icon={<Paperclip size={18} strokeWidth={2} />}
        align="start"
        items={[
          {
            label: t("assistant.attachFiles") || "Files",
            icon: <File size={16} strokeWidth={2} />,
            onSelect: onFilesClick,
            disabled: disabled,
          },
          {
            label: t("assistant.attachPhotos") || "Photos",
            icon: <ImageIcon size={16} strokeWidth={2} />,
            onSelect: onPhotosClick,
            disabled: disabled,
          },
          {
            label: t("assistant.attachCamera") || "Camera",
            icon: <Camera size={16} strokeWidth={2} />,
            onSelect: onCameraClick,
            disabled: disabled,
          },
        ]}
      />
      <style jsx>{`
        .attachment-menu-wrapper :global(.lg-menu-card) {
          position: absolute !important;
          bottom: calc(100% + 8px) !important;
          top: auto !important;
          z-index: 50;
        }
      `}</style>
    </div>
  );
}
