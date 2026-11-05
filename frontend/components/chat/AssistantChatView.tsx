"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { useChat } from "@/lib/hooks/useChat";
import { useI18n } from "@/lib/i18n";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const emptyStateStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const emptyStateItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export function AssistantChatView({
  businessId,
  initialMessages,
  conversationId,
  onConversationId,
  selectionKey,
}: {
  businessId: string;
  initialMessages: ChatMessageType[];
  conversationId: string | null;
  onConversationId: (id: string) => void;
  selectionKey?: string;
}) {
  const { t } = useI18n();
  const { messages, aiState, sendMessage, confirmTransaction, cancelTransaction, selectChoice } = useChat(
    businessId,
    initialMessages,
    conversationId,
    onConversationId,
    selectionKey
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiState]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages container - ChatGPT style center column */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-paper">
        {messages.length === 0 ? (
          // Empty state
          <motion.div
            initial="hidden"
            animate="show"
            variants={emptyStateStagger}
            className="flex min-h-full flex-col items-center justify-center px-4 py-16 sm:px-6"
          >
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
              {/* Brand mark */}
              <motion.div
                variants={emptyStateItem}
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-500 to-signal-600 text-onSignal shadow-lg"
              >
                <div className="absolute -inset-2 rounded-[20px] bg-signal-500/10 blur-xl" />
                <Sparkles size={28} strokeWidth={2} className="relative" />
              </motion.div>

              {/* Title and description */}
              <motion.div variants={emptyStateItem} className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint shadow-sm">
                  <Sparkles size={12} className="text-signal-500" />
                  {t("common.productName")}
                </div>
                <h2 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
                  {t("assistant.subtitle")}
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-ink-soft">
                  Ask about your finances, record transactions, or get insights—RIVA handles the accounting.
                </p>
              </motion.div>

              {/* Suggestions */}
              <motion.div variants={emptyStateItem} className="w-full">
                <ChatSuggestions onPick={sendMessage} />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Conversation - ChatGPT style
          <div className="mx-auto w-full max-w-3xl px-4 py-8">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isSubmitting={aiState === "submitting"}
                  onConfirm={() => confirmTransaction(message.id)}
                  onCancel={() => cancelTransaction(message.id)}
                  onChoice={(choice) => selectChoice(message.id, choice, message.action)}
                />
              ))}
              {aiState === "thinking" && (
                <div className="px-4 py-2">
                  <ThinkingIndicator />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input - Sticky at bottom ChatGPT style */}
      <div className="shrink-0 border-t border-line bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <ChatInput onSend={sendMessage} disabled={aiState !== "idle"} />
        </div>
      </div>
    </div>
  );
}
