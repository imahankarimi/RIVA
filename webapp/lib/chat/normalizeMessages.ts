import type { ConversationActionPayload, ConversationMessage } from "@/lib/api/conversations";
import type { ChatAction, ChatMessage } from "@/lib/types";

/**
 * Normalize backend message rows into the chat UI shape.
 *
 * A single `confirmation_required` backend row may hold either:
 * - a legacy single action (old parse path), or
 * - a `{ transactions: [...] }` preview list from record_transactions.
 * In the latter case we emit one transaction card per preview so each one can
 * be confirmed/recorded independently.
 */
export function normalizeMessages(rows: ConversationMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (const m of rows) {
    const action = m.action as
      | (ConversationActionPayload & { transactions?: ChatAction[] })
      | null
      | undefined;
    if (m.msgType === "confirmation_required" && action && Array.isArray(action.transactions)) {
      for (const txn of action.transactions) {
        result.push({
          id: m.id,
          role: m.role,
          kind: "transaction",
          text: m.content,
          action: txn,
          status: "pending",
        });
      }
      continue;
    }
    result.push({
      id: m.id,
      role: m.role,
      kind:
        m.msgType === "confirmation_required"
          ? "transaction"
          : m.msgType === "missing_information"
            ? "choices"
            : m.msgType === "success"
              ? "success"
              : m.msgType === "error"
                ? "error"
                : "text",
      text: m.content,
      action: m.action as ChatAction | undefined,
      status: m.msgType === "success" ? "confirmed" : undefined,
    });
  }
  return result;
}