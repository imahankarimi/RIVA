import type { ChatMessage } from "@/lib/types";

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO
  businessId: string;
}

export interface StoredConversation extends ConversationSummary {
  messages: ChatMessage[];
}
