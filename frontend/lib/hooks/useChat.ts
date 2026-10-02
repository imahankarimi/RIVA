"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage, confirmChatAction, resolveChatChoice } from "@/lib/api/chat";
import { getConversationMessages } from "@/lib/api/conversations";
import { normalizeMessages } from "@/lib/chat/normalizeMessages";
import type { ChatMessage, ChatResponse } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Chat orchestration hook.
 *
 * Owns the message list for the *currently selected conversation*.
 *
 * - `conversationId` is the active conversation ID (null for a brand-new chat
 *   that hasn't been persisted to the backend yet).
 * - `selectionKey` changes ONLY on explicit user actions: picking a history
 *   conversation or starting a new chat. When it changes, the hook loads that
 *   conversation's messages from the backend (or clears for a new chat).
 * - `localConversationId` tracks the conversation ID assigned by the backend
 *   during a lazy first-message flow, so subsequent messages in the same
 *   conversation go to the right place even before the parent re-renders.
 */
export function useChat(
  businessId: string,
  initialMessages: ChatMessage[] = [],
  conversationId: string | null,
  onConversationId: (id: string) => void,
  selectionKey?: string
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [aiState, setAiState] = useState<"idle" | "thinking" | "submitting">("idle");

  // Locally tracks the conversation ID assigned by the backend on lazy creation.
  // This lets subsequent messages go to the right conversation without waiting
  // for the parent to re-render with the new `conversationId` prop.
  const localConversationIdRef = useRef<string | null>(conversationId);
  const activeConversationId = localConversationIdRef.current ?? conversationId;

  // Reset the local override when the parent-provided conversationId changes
  // (e.g. user switches conversations via history panel).
  useEffect(() => {
    localConversationIdRef.current = conversationId;
  }, [conversationId]);

  const prevSelectionKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    const key = selectionKey ?? "";
    const isFirst = prevSelectionKey.current === undefined;

    if (!isFirst && prevSelectionKey.current !== key) {
      // User switched conversations. Load messages for the newly selected
      // conversation (if any) — authoritative fetch avoids stale props.
      const targetId = conversationId;
      if (targetId) {
        setMessages([]);
        setAiState("idle");
        let cancelled = false;
        getConversationMessages(targetId)
          .then((rows) => {
            if (!cancelled) setMessages(normalizeMessages(rows));
          })
          .catch(() => {
            if (!cancelled) setMessages([]);
          });
        return () => {
          cancelled = true;
        };
      }
      setMessages([]);
      setAiState("idle");
    }
    prevSelectionKey.current = key;
  }, [selectionKey, conversationId]);

  const pushMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const applyResponse = useCallback(
    (response: ChatResponse) => {
      // The response always carries the conversation it belongs to. Record it
      // locally (lazily on first message of a new chat) and tell the parent so
      // the history panel refreshes titles/ordering. Refreshing even when the
      // ID is unchanged keeps the auto-generated title current after the first
      // message of a conversation — and never touches selectionKey, so the
      // in-flight messages survive.
      if (response.conversation_id && response.conversation_id !== activeConversationId) {
        localConversationIdRef.current = response.conversation_id;
        onConversationId(response.conversation_id);
      } else if (response.conversation_id && response.conversation_id === activeConversationId) {
        onConversationId(response.conversation_id);
      }

      if (response.type === "confirmation_required" && (response.action || response.transactions)) {
        pushMessage({ id: uid(), role: "assistant", kind: "text", text: response.message });
        // If there's a list of resolved transactions (from record_transactions tool),
        // render one card per transaction. Otherwise use the single-action legacy path.
        const txns = response.transactions ?? (response.action ? [response.action] : []);
        for (const txn of txns) {
          pushMessage({
            id: uid(),
            role: "assistant",
            kind: "transaction",
            action: txn,
            status: "pending",
          });
        }
      } else if (response.type === "missing_information") {
        pushMessage({
          id: uid(),
          role: "assistant",
          kind: "choices",
          text: response.message,
          choices: response.choices,
          action: response.action,
        });
      } else if (response.type === "error") {
        pushMessage({ id: uid(), role: "assistant", kind: "error", text: response.message });
      } else {
        // "answer" (real accounting Q&A) and any plain "message" both render as text.
        pushMessage({
          id: uid(),
          role: "assistant",
          kind: "text",
          text: response.message,
          exports: response.exports,
        });
      }
    },
    [pushMessage, activeConversationId, onConversationId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      pushMessage({ id: uid(), role: "user", kind: "text", text });
      setAiState("thinking");
      try {
        const response = await sendChatMessage(businessId, text, activeConversationId);
        applyResponse(response);
      } catch {
        // A real failure — never fabricate an accounting response for this.
        pushMessage({
          id: uid(),
          role: "assistant",
          kind: "error",
          text: "نتونستم به RIVA AI وصل بشم. اتصال اینترنتت رو چک کن و دوباره امتحان کن.",
        });
      } finally {
        setAiState("idle");
      }
    },
    [businessId, activeConversationId, applyResponse, pushMessage]
  );

  const confirmTransaction = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target?.action) return;
      setAiState("submitting");
      try {
        const result = await confirmChatAction(businessId, target.action, activeConversationId);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: result.success ? "confirmed" : "cancelled" } : m))
        );
        if (result.success) {
          // Show the backend's localized success message in the active chat.
          pushMessage({ id: uid(), role: "assistant", kind: "success", text: result.message });
        } else {
          pushMessage({ id: uid(), role: "assistant", kind: "error", text: result.message });
        }
        if (activeConversationId) onConversationId(activeConversationId);
      } catch (error) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: "cancelled" } : m)));
        // Surface the backend's localized error if available; otherwise a neutral fallback.
        pushMessage({
          id: uid(),
          role: "assistant",
          kind: "error",
          text:
            error instanceof Error && error.message
              ? error.message
              : "نتونستم اون تراکنش رو ثبت کنم. دوباره امتحان کن.",
        });
      } finally {
        setAiState("idle");
      }
    },
    [messages, businessId, activeConversationId, pushMessage, onConversationId]
  );

  const cancelTransaction = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: "cancelled" } : m)));
  }, []);

  const selectChoice = useCallback(
    async (messageId: string, choice: string, action: ChatMessage["action"]) => {
      if (!action) return;
      // Guard against a stale "choices" message being clicked again after
      // the flow has already moved on — each question can only be answered once.
      const source = messages.find((m) => m.id === messageId);
      if (source?.selectedChoice) return;

      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, selectedChoice: choice } : m)));
      setAiState("thinking");

      try {
        const response = await resolveChatChoice(businessId, action, choice, activeConversationId);
        applyResponse(response);
      } catch (error) {
        console.error("Failed to resolve chat choice:", error);
        // Resolution failed — let the user try this question again.
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, selectedChoice: undefined } : m)));
        pushMessage({
          id: uid(),
          role: "assistant",
          kind: "error",
          text: "نتونستم روش پرداخت رو مشخص کنم. دوباره تلاش کن.",
        });
      } finally {
        setAiState("idle");
      }
    },
    [messages, businessId, activeConversationId, applyResponse, pushMessage]
  );

  return { messages, aiState, sendMessage, confirmTransaction, cancelTransaction, selectChoice };
}
