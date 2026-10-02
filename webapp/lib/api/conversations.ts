import { apiRequest } from "./client";
import type { ChatAction } from "@/lib/types";

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  msgType: string;
  content: string;
  action?: ChatAction | ConversationActionPayload | null;
  createdAt: string;
}

/** Multi-transaction preview persisted for a record_transactions confirmation. */
export interface ConversationActionPayload {
  transactions?: ChatAction[];
  preview?: string;
}

interface BackendConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

interface BackendConversationMessage {
  id: string;
  role: "user" | "assistant";
  msg_type: string;
  content: string;
  action: ChatAction | ConversationActionPayload | null;
  created_at: string;
}

function normalizeSummary(c: BackendConversationSummary): ConversationSummary {
  return { id: c.id, title: c.title, updatedAt: c.updated_at };
}

function normalizeMessage(m: BackendConversationMessage): ConversationMessage {
  return {
    id: m.id,
    role: m.role,
    msgType: m.msg_type,
    content: m.content,
    action: m.action ?? undefined,
    createdAt: m.created_at,
  };
}

export function listConversations(businessId: string): Promise<ConversationSummary[]> {
  return apiRequest<BackendConversationSummary[]>(`/api/businesses/${businessId}/conversations`).then((rows) =>
    rows.map(normalizeSummary)
  );
}

export function createConversation(businessId: string): Promise<ConversationSummary> {
  return apiRequest<BackendConversationSummary>(`/api/businesses/${businessId}/conversations`, {
    method: "POST",
  }).then(normalizeSummary);
}

export function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  return apiRequest<BackendConversationMessage[]>(`/api/conversations/${conversationId}/messages`).then((rows) =>
    rows.map(normalizeMessage)
  );
}

export function deleteConversation(conversationId: string) {
  return apiRequest<void>(`/api/conversations/${conversationId}`, { method: "DELETE" });
}
