import { apiRequest } from "./client";
import type { ChatAction, ChatResponse, ConfirmResult } from "@/lib/types";

export function sendChatMessage(
  businessId: string,
  message: string,
  conversationId?: string | null,
  signal?: AbortSignal
) {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: { business_id: businessId, message, conversation_id: conversationId ?? null },
    signal,
  });
}

export function confirmChatAction(
  businessId: string,
  action: ChatAction,
  conversationId?: string | null,
  signal?: AbortSignal
) {
  return apiRequest<ConfirmResult>("/api/chat/confirm", {
    method: "POST",
    body: { business_id: businessId, action, conversation_id: conversationId ?? null },
    signal,
  });
}

export function resolveChatChoice(
  businessId: string,
  action: ChatAction,
  choice: string,
  conversationId?: string | null,
  signal?: AbortSignal
) {
  return apiRequest<ChatResponse>("/api/chat/resolve", {
    method: "POST",
    body: { business_id: businessId, action, choice, conversation_id: conversationId ?? null },
    signal,
  });
}

/**
 * Download a report export that the AI produced (CSV / XLSX / PDF).
 * The backend requires the auth token, so this uses an authenticated fetch
 * and triggers a browser download from the blob.
 */
export async function downloadReportExport(downloadPath: string, filename: string) {
  const { getStoredToken } = await import("./client");
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const token = getStoredToken();
  const res = await fetch(`${base}${downloadPath}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
