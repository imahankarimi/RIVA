"use client";

import { useState, useEffect } from "react";
import { AssistantChatView } from "@/components/chat/AssistantChatView";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { useChatHistory } from "@/lib/hooks/useChatHistory";
import { useBusiness } from "@/app/providers";
import { usePreview } from "@/components/preview/PreviewProvider";
import { GuestAssistantView } from "@/components/preview/views/GuestAssistantView";

/**
 * RIVA AI — ChatGPT-style interface with persistent conversation sidebar.
 *
 * Guests get the product explanation and an authentication prompt instead of a
 * fake chat: the assistant is an account-only workflow, and no anonymous model
 * or conversation API is ever called.
 */
export default function AssistantPage() {
  const { business } = useBusiness();
  const { isGuest } = usePreview();

  if (isGuest || !business) return <GuestAssistantView />;

  return <AssistantWorkspace businessId={business.id} />;
}

function AssistantWorkspace({ businessId }: { businessId: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useChatHistory(businessId);

  // Expose toggle function to Top Bar via window
  useEffect(() => {
    (window as any).__assistantToggleSidebar = () => setSidebarOpen((prev) => !prev);
    return () => {
      delete (window as any).__assistantToggleSidebar;
    };
  }, []);

  return (
    <div className="flex h-full overflow-hidden bg-paper">
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
          key={`${businessId}-wapp-assistant`}
          businessId={businessId}
          initialMessages={history.activeMessages}
          conversationId={history.activeId}
          onConversationId={history.onConversationId}
          selectionKey={history.selectionKey}
        />
      </div>
    </div>
  );
}
