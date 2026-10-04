"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { useChat } from "@/lib/hooks/useChat";
import { useI18n } from "@/lib/i18n";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

// Local, self-contained motion variants for the empty-state entrance.
// Mirrors the project's existing easing/duration language (short, restrained —
// this is an accounting app, not a marketing site) without depending on an
// unverified import path for the shared motion-tokens module.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const emptyStateStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const emptyStateItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } },
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
  /** Called once the backend assigns/confirms a conversation id (e.g. after the first message of a new chat). */
  onConversationId: (id: string) => void;
  /** Changes only when the user explicitly selects a conversation or starts a
   *  new one — tells useChat to adopt the parent's messages. Stable when the
   *  backend assigns an ID to the current new chat, so in-flight messages
   *  survive. */
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiState]);

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable messages container */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-content flex-col px-4 py-5 sm:px-6 sm:py-7">
          {messages.length === 0 ? (
            <motion.div
              initial="hidden"
              animate="show"
              variants={emptyStateStagger}
              className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center sm:py-16"
            >
              {/* Restrained brand mark — a single soft ring, no glow/particles. */}
              <motion.div
                variants={emptyStateItem}
                className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-signal-500 text-onSignal shadow-raised"
              >
                <span
                  aria-hidden
                  className="absolute -inset-1.5 rounded-[20px] ring-1 ring-signal-300/40"
                />
                <Sparkle size={20} strokeWidth={2.2} />
              </motion.div>

              <motion.div variants={emptyStateItem} className="flex max-w-sm flex-col items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  <Sparkle size={10} className="text-signal-500" />
                  {t("common.productName")}
                </span>
                <h2 className="font-display text-[20px] font-bold leading-snug text-ink sm:text-[22px]">
                  {t("assistant.subtitle")}
                </h2>
              </motion.div>

              <motion.div variants={emptyStateItem} className="w-full">
                <ChatSuggestions onPick={sendMessage} />
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex flex-1 flex-col gap-5 pb-2">
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
              {aiState === "thinking" && <ThinkingIndicator />}
            </div>
          )}
        </div>
      </div>

      {/* Fixed composer above mobile tab bar */}
      <div className="shrink-0 border-t border-line-soft bg-paper/95 backdrop-blur shadow-[0_-8px_16px_-12px_rgba(16,28,44,0.12)] md:shadow-none">
        <div className="px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:px-6 md:pb-3">
          <ChatInput onSend={sendMessage} disabled={aiState !== "idle"} />
        </div>
      </div>
    </div>
  );
}
