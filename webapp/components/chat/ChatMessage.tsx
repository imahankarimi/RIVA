"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Download, Sparkle } from "lucide-react";
import { downloadReportExport } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-500 text-onSignal">
          <Sparkle size={12} strokeWidth={2.5} />
        </div>
      )}

      <div className={cn("flex max-w-[85%] flex-col gap-2", isUser && "items-end")}>
        {message.kind === "text" && (
          <>
            <div
              className={cn(
                "rounded-xl px-3.5 py-2 text-[13.5px] leading-relaxed",
                isUser
                  ? "rounded-br-sm bg-signal-500 text-onSignal"
                  : "rounded-bl-sm border border-line bg-surface text-ink shadow-subtle"
              )}
            >
              {message.text}
            </div>
            {!isUser && message.exports && message.exports.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {message.exports.map((exp) => (
                  <button
                    key={`${exp.filename}-${exp.format}`}
                    onClick={() =>
                      exp.download_path &&
                      downloadReportExport(exp.download_path, exp.filename).catch(() => {
                        // ignore download failures — user keeps the chat intact
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-soft transition-colors hover:border-signal-300 hover:bg-signal-50 hover:text-signal-700"
                  >
                    <Download size={12} />
                    {exp.filename}
                  </button>
                ))}
              </div>
            )}
          </>
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
          <>
            {message.text && (
              <div className="rounded-lg rounded-ss-sm border border-line bg-surface px-4 py-2.5 text-[14px] text-ink shadow-subtle">
                {message.text}
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
          </>
        )}

        {message.kind === "success" && (
          <div className="flex items-start gap-2 rounded-lg rounded-ss-sm border border-moss-100 bg-moss-100/40 px-4 py-2.5 text-[13.5px] text-moss-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {message.kind === "error" && (
          <div className="flex items-start gap-2 rounded-lg rounded-ss-sm border border-rose-100 bg-rose-100/40 px-4 py-2.5 text-[13.5px] text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
