"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Download, Sparkle, User } from "lucide-react";
import { downloadReportExport } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/glisse";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TransactionCard } from "./TransactionCard";
import { QuickChoices } from "./QuickChoices";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onConfirm?: () => void;
  onCancel?: () => void;
  onChoice?: (choice: string) => void;
  isSubmitting?: boolean;
}

export function ChatMessage({ message, onConfirm, onCancel, onChoice, isSubmitting }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6"
    >
      {/* Avatar */}
      <div className="flex shrink-0">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8",
            isUser
              ? "bg-primary text-primary-foreground shadow-subtle"
              : "bg-signal-500 text-onSignal shadow-sm"
          )}
        >
          {isUser ? (
            <User size={14} strokeWidth={2} className="sm:hidden" />
          ) : (
            <Sparkle size={14} strokeWidth={2.5} className="sm:hidden" />
          )}
          {isUser ? (
            <User size={16} strokeWidth={2} className="hidden sm:block" />
          ) : (
            <Sparkle size={16} strokeWidth={2.5} className="hidden sm:block" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-col items-start gap-2 sm:gap-3">
        {/* Role label */}
        <div className="text-[12px] font-semibold text-ink sm:text-[13px]">
          {isUser ? "You" : "RIVA AI"}
        </div>

        {/* Message content */}
        <div className="min-w-0">
          {message.kind === "text" && message.text && (
            <div className="text-[14px] leading-relaxed text-ink">
              {isUser ? (
                <div className="w-fit max-w-[min(340px,calc(100vw-120px))] rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card ring-1 ring-line/10 sm:max-w-[480px] sm:px-4 sm:py-3.5">
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                </div>
              ) : (
                <div className="w-fit max-w-[min(480px,calc(100vw-100px))] rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card ring-1 ring-line/10 sm:max-w-[680px] sm:px-4 sm:py-3.5">
                  <MarkdownRenderer content={message.text} />
                </div>
              )}
            </div>
          )}

          {message.kind === "transaction" && message.action && (
            <TransactionCard
              action={message.action}
              status={message.status ?? "pending"}
              onConfirm={onConfirm}
              onCancel={onCancel}
              isSubmitting={isSubmitting}
            />
          )}

          {message.kind === "choices" && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {message.text && (
                <div className="text-[14px] leading-relaxed text-ink">
                  <MarkdownRenderer content={message.text} />
                </div>
              )}
              {message.choices && (
                <QuickChoices
                  choices={message.choices}
                  onSelect={onChoice ?? (() => {})}
                  selected={message.selectedChoice}
                  disabled={isSubmitting}
                />
              )}
            </div>
          )}

          {message.kind === "success" && (
            <div className="flex items-start gap-2 rounded-lg border border-moss-200 bg-moss-50 px-3 py-2.5 text-[13px] leading-relaxed text-moss-800 dark:border-moss-800 dark:bg-moss-950/40 dark:text-moss-200 sm:gap-2.5 sm:px-4 sm:py-3 sm:text-[14px]">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 sm:hidden" strokeWidth={2} />
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 hidden sm:block" strokeWidth={2} />
              <span>{message.text}</span>
            </div>
          )}

          {message.kind === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] leading-relaxed text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 sm:gap-2.5 sm:px-4 sm:py-3 sm:text-[14px]">
              <AlertCircle size={16} className="mt-0.5 shrink-0 sm:hidden" strokeWidth={2} />
              <AlertCircle size={18} className="mt-0.5 shrink-0 hidden sm:block" strokeWidth={2} />
              <span>{message.text}</span>
            </div>
          )}

          {/* Export downloads */}
          {!isUser && message.exports && message.exports.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
              {message.exports.map((exp) => (
                <Button
                  key={`${exp.filename}-${exp.format}`}
                  variant="glass"
                  icon={<Download size={13} strokeWidth={2} className="sm:hidden" />}
                  onClick={() =>
                    exp.download_path &&
                    downloadReportExport(exp.download_path, exp.filename).catch(() => {
                      // ignore download failures
                    })
                  }
                  className="border border-line bg-surface text-[12px] text-ink-soft hover:border-signal-300 hover:bg-signal-50 hover:text-signal-700 dark:hover:bg-signal-950/30 sm:text-[13px]"
                >
                  <Download size={14} strokeWidth={2} className="hidden sm:inline" />
                  {exp.filename}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
