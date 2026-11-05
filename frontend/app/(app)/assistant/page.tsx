"use client";

import { useState } from "react";
import { AssistantChatView } from "@/components/chat/AssistantChatView";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { useChatHistory } from "@/lib/hooks/useChatHistory";
import { useBusiness } from "@/app/providers";

export default function AssistantPage() {
  const { business } = useBusiness();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useChatHistory(business.id);

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Conversation Sidebar - ChatGPT style */}
      <ConversationSidebar
        grouped={history.grouped}
        activeId={history.activeId}
        onSelect={history.selectConversation}
        onNew={history.startNew}
        onRemove={history.removeConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AssistantChatView
          key={`${business.id}-assistant`}
          businessId={business.id}
          initialMessages={history.activeMessages}
          conversationId={history.activeId}
          onConversationId={history.onConversationId}
          selectionKey={history.selectionKey}
        />
      </div>
    </div>
  );
}
