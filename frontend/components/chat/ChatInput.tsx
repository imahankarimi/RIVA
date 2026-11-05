"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Paperclip, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
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
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div className="sticky bottom-0 z-20 border-t border-line-soft bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
        <div
          className={cn(
            "group relative flex items-end gap-2 rounded-2xl border bg-surface px-4 py-3 shadow-sm transition-all duration-200",
            focused
              ? "border-signal-400 shadow-[0_0_0_3px_rgba(113,135,155,0.1)] ring-1 ring-signal-400/20"
              : "border-line hover:border-line-strong",
            disabled && "opacity-60"
          )}
        >
          {/* Attach button (disabled) */}
          <button
            type="button"
            disabled
            title={t("common.comingSoon")}
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-40 transition-colors hover:bg-surfaceMuted disabled:cursor-not-allowed"
            aria-label={`${t("assistant.attach")} (${t("common.comingSoon")})`}
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>

          {/* Message input */}
          <div className="flex min-w-0 flex-1 flex-col">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              disabled={disabled}
              placeholder={t("assistant.inputPlaceholder")}
              onChange={(e) => {
                setValue(e.target.value);
                autoGrow();
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="max-h-[200px] w-full resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed"
              style={{ scrollbarWidth: "thin" }}
            />

            {/* Input hint */}
            {focused && !value && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1 text-[12px] text-ink-faint"
              >
                Press <kbd className="rounded bg-surfaceMuted px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to send,{" "}
                <kbd className="rounded bg-surfaceMuted px-1.5 py-0.5 font-mono text-[11px]">Shift + Enter</kbd> for new line
              </motion.div>
            )}
          </div>

          {/* Voice button (disabled) */}
          <button
            type="button"
            disabled
            title={t("common.comingSoon")}
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-40 transition-colors hover:bg-surfaceMuted disabled:cursor-not-allowed"
            aria-label={`${t("assistant.voice")} (${t("common.comingSoon")})`}
          >
            <Mic size={18} strokeWidth={2} />
          </button>

          {/* Send button */}
          <motion.button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label={t("assistant.send")}
            whileHover={canSend ? { scale: 1.05 } : undefined}
            whileTap={canSend ? { scale: 0.95 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200",
              canSend
                ? "bg-signal-500 text-onSignal hover:bg-signal-600 hover:shadow-md active:shadow-sm"
                : "cursor-not-allowed bg-surfaceMuted text-ink-faint"
            )}
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
