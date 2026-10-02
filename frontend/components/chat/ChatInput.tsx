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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div
      className="sticky bottom-0 z-20 border-t border-line-soft bg-paper/95 px-3 pt-3 backdrop-blur sm:px-6"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        boxShadow: "0 -12px 24px -20px rgba(16, 28, 44, 0.18)",
      }}
    >
      <div
        className={cn(
          "mx-auto flex max-w-content items-end gap-1.5 rounded-xl border bg-surface p-1.5 transition-all duration-150",
          focused ? "border-signal-400 shadow-card ring-4 ring-signal-100/70" : "border-line shadow-subtle",
          disabled && "opacity-70"
        )}
      >
        <button
          type="button"
          disabled
          title={t("common.comingSoon")}
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-40 cursor-not-allowed"
          aria-label={`${t("assistant.attach")} (${t("common.comingSoon")})`}
        >
          <Paperclip size={18} />
        </button>

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
          className="max-h-[120px] flex-1 resize-none bg-transparent py-2.5 text-[14.5px] leading-normal text-ink placeholder:text-ink-faint focus:outline-none"
        />

        <button
          type="button"
          disabled
          title={t("common.comingSoon")}
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-40 cursor-not-allowed"
          aria-label={`${t("assistant.voice")} (${t("common.comingSoon")})`}
        >
          <Mic size={18} />
        </button>

        <motion.button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label={t("assistant.send")}
          whileHover={canSend ? { scale: 1.05 } : undefined}
          whileTap={canSend ? { scale: 0.95 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className={cn(
            "mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
            canSend ? "bg-signal-500 text-onSignal hover:bg-signal-600" : "bg-surfaceMuted text-ink-faint"
          )}
        >
          <ArrowUp size={17} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
