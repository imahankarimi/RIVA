"use client";

import { useRef, useState, type KeyboardEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, X, File } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/glisse";
import { AttachmentMenu } from "@/components/chat/AttachmentMenu";
import { triggerHaptic } from "@/lib/mobile-ux";
import { cn } from "@/lib/utils";

/**
 * Premium chat input with mobile-optimized UX.
 *
 * Mobile enhancements:
 * - Compact, efficient use of screen space
 * - Auto-expanding textarea with proper keyboard handling
 * - iOS zoom prevention (16px minimum font size)
 * - Haptic feedback on interactions
 * - Touch-optimized controls using Glisse components
 * - File attachment support (frontend only - backend integration pending)
 */
export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    triggerHaptic("medium");

    // TODO: Backend integration needed for file attachments
    // For now, just send the text message
    if (selectedFile) {
      console.warn("File attachment selected but backend integration pending:", selectedFile.name);
    }

    onSend(trimmed);
    setValue("");
    setSelectedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Max 4 lines (~96px) before scrolling for more compact mobile view
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  function handleFilesClick() {
    triggerHaptic("light");
    fileInputRef.current?.click();
  }

  function handlePhotosClick() {
    triggerHaptic("light");
    photoInputRef.current?.click();
  }

  function handleCameraClick() {
    triggerHaptic("light");
    cameraInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(t("assistant.fileTooLarge") || "File is too large (max 10MB)");
        return;
      }
      setSelectedFile(file);
      triggerHaptic("medium");
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    triggerHaptic("light");
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div className="relative">
      {/* Selected file indicator */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 flex items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-[13px]"
          >
            <File size={14} className="shrink-0 text-ink-faint" />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{selectedFile.name}</span>
            <button
              onClick={handleRemoveFile}
              className="shrink-0 rounded-md p-0.5 text-ink-faint hover:bg-surfaceMuted hover:text-ink"
              aria-label={t("common.remove") || "Remove"}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard-sized mobile chat composer */}
      <div
        className={cn(
          "group relative flex items-end gap-2 rounded-[20px] border bg-surface px-3 py-2 shadow-sm transition-all duration-200",
          focused
            ? "border-signal-400 shadow-[0_0_0_3px_rgba(113,135,155,0.08)] ring-1 ring-signal-400/30"
            : "border-line hover:border-line/90 hover:shadow-md",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={handleFileChange}
        />
        <input
          ref={photoInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />

        {/* Attach menu - positioned above to avoid Bottom Tab Bar */}
        <AttachmentMenu
          disabled={disabled}
          onFilesClick={handleFilesClick}
          onPhotosClick={handlePhotosClick}
          onCameraClick={handleCameraClick}
        />

        {/* Message input with standard mobile dimensions */}
        <div className="relative flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder={t("assistant.askRiva") || "Ask RIVA"}
            onChange={(e) => {
              setValue(e.target.value);
              autoGrow();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setFocused(true);
              triggerHaptic("light");
            }}
            onBlur={() => setFocused(false)}
            className={cn(
              "w-full resize-none border-0 bg-transparent py-1 font-sans text-[16px] leading-[1.4] text-ink placeholder:text-ink-faint focus:outline-none",
              "scrollbar-thin scrollbar-thumb-scrollbar scrollbar-track-transparent"
            )}
            style={{
              minHeight: "22px",
              maxHeight: "96px",
            }}
          />
        </div>

        {/* Send button - Glisse filled variant, truly circular */}
        <motion.div
          animate={{
            scale: canSend ? 1 : 0.9,
            opacity: canSend ? 1 : 0.5,
          }}
          transition={{ duration: 0.18 }}
        >
          <Button
            onClick={submit}
            disabled={!canSend}
            variant="filled"
            className={cn(
              "!h-9 !w-9 !min-h-0 shrink-0 rounded-full p-0",
              !canSend && "cursor-not-allowed"
            )}
            aria-label={t("assistant.send")}
          >
            <ArrowUp size={18} strokeWidth={2.5} className="text-white" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
