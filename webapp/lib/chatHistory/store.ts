import type { ChatMessage } from "@/lib/types";
import type { StoredConversation } from "./types";

// This is a storage-layer abstraction on purpose. Today it's backed by
// localStorage; once the backend exposes persistent conversation history
// (e.g. GET/POST /api/businesses/{id}/conversations), swap
// `localChatHistoryStore` for an API-backed implementation of the same
// interface below — nothing that calls useChatHistory needs to change.
export interface ChatHistoryStore {
  list(businessId: string): StoredConversation[];
  get(id: string): StoredConversation | null;
  save(conversation: StoredConversation): void;
  remove(id: string): void;
}

const STORAGE_KEY = "ledgerai.chat_history.v1";

function readAll(): Record<string, StoredConversation> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredConversation>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, StoredConversation>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export const localChatHistoryStore: ChatHistoryStore = {
  list(businessId) {
    const all = readAll();
    return Object.values(all)
      .filter((c) => c.businessId === businessId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },
  get(id) {
    return readAll()[id] ?? null;
  },
  save(conversation) {
    const all = readAll();
    all[conversation.id] = conversation;
    writeAll(all);
  },
  remove(id) {
    const all = readAll();
    delete all[id];
    writeAll(all);
  },
};

/** Derives a short title from the first user message, so conversations don't all say "New conversation". */
export function deriveTitle(messages: ChatMessage[], fallback: string): string {
  const firstUserText = messages.find((m) => m.role === "user" && m.text)?.text;
  if (!firstUserText) return fallback;
  return firstUserText.length > 42 ? `${firstUserText.slice(0, 42)}…` : firstUserText;
}

export function groupByRecency<T extends { updatedAt: string }>(
  conversations: T[]
): { today: T[]; yesterday: T[]; previous7Days: T[]; older: T[] } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 7 * 86_400_000;

  const groups = { today: [] as T[], yesterday: [] as T[], previous7Days: [] as T[], older: [] as T[] };

  for (const c of conversations) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= todayStart) groups.today.push(c);
    else if (t >= yesterdayStart) groups.yesterday.push(c);
    else if (t >= weekStart) groups.previous7Days.push(c);
    else groups.older.push(c);
  }

  return groups;
}
