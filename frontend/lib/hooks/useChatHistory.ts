"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createConversation,
  deleteConversation,
  listConversations,
} from "@/lib/api/conversations";
import { groupByRecency } from "@/lib/chatHistory/store";
import { normalizeMessages } from "@/lib/chat/normalizeMessages";
import type { ConversationSummary } from "@/lib/api/conversations";
import type { ChatMessage } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function storageKey(businessId: string) {
  return `riva.active_conversation.${businessId}`;
}

/**
 * Backend-persisted conversation history.
 *
 * - "New Chat" creates a real conversation server-side (with its own ID), so
 *   refreshing the page keeps it.
 * - Selecting a conversation loads its messages.
 * - The active conversation ID is the single source of truth — no message
 *   mixing across conversations.
 * - `selectionKey` changes ONLY on explicit user actions (select/new). When
 *   the backend assigns an ID to the current lazy new chat (via
 *   onConversationId), `activeId` changes but `selectionKey` stays stable —
 *   so the chat view keeps its in-flight messages instead of resetting.
 */
export function useChatHistory(businessId: string) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [creatingNew, setCreatingNew] = useState(false);

  const refresh = useCallback(() => {
    if (!businessId) return;
    listConversations(businessId)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [businessId]);

  // Reset/carry over when the business changes. Also restore the last active
  // conversation from localStorage so a refresh reopens the same chat.
  useEffect(() => {
    setSelectionVersion((v) => v + 1);
    refresh();
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(storageKey(businessId));
    } catch {
      // storage unavailable — ignore
    }
    if (saved) {
      setActiveId(saved);
      setActiveMessages([]);
    } else {
      setActiveId(null);
      setActiveMessages([]);
    }
  }, [businessId, refresh]);

  // Persist the active conversation so refresh reopens it.
  useEffect(() => {
    try {
      if (activeId) window.localStorage.setItem(storageKey(businessId), activeId);
      else window.localStorage.removeItem(storageKey(businessId));
    } catch {
      // ignore
    }
  }, [activeId, businessId]);

  /** Create a brand-new conversation server-side and make it active. */
  const startNew = useCallback(async () => {
    if (!businessId) return;
    setCreatingNew(true);
    try {
      const created = await createConversation(businessId);
      setActiveId(created.id);
      setActiveMessages([]);
      setSelectionVersion((v) => v + 1);
      refresh();
    } finally {
      setCreatingNew(false);
    }
  }, [businessId, refresh]);

  /** Load and switch to an existing conversation (user action). */
  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setActiveMessages([]);
    setSelectionVersion((v) => v + 1);
  }, []);

  const removeConversation = useCallback(
    (id: string) => {
      deleteConversation(id).catch(() => {});
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((current) => {
        if (current !== id) return current;
        // The active conversation was deleted — reset to "New Chat" state
        setActiveMessages([]);
        setSelectionVersion((v) => v + 1);
        return null;
      });
    },
    []
  );

  /**
   * Called by the chat view when the backend reports a conversation ID.
   * Usually this is the first message of a brand-new lazy conversation. We
   * update activeId + refresh history, but do NOT bump selectionVersion, so
   * the chat view's in-flight messages survive.
   */
  const onConversationId = useCallback(
    (id: string) => {
      setActiveId(id);
      refresh();
    },
    [refresh]
  );

  const grouped = useMemo(
    () => groupByRecency(conversations.map((c) => ({ ...c, updatedAt: c.updatedAt }))),
    [conversations]
  );

  const selectionKey = `${businessId}:${selectionVersion}`;

  return {
    conversations,
    grouped,
    activeId,
    activeMessages,
    loadingMessages,
    creatingNew,
    selectionKey,
    startNew,
    selectConversation,
    removeConversation,
    onConversationId,
  };
}

export { uid };
