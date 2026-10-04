"use client";

import { useState } from "react";
import { History as HistoryIcon, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { AssistantChatView } from "@/components/chat/AssistantChatView";
import { ChatHistoryPanel } from "@/components/chat/ChatHistoryPanel";
import { useChatHistory } from "@/lib/hooks/useChatHistory";
import { useBusiness } from "@/app/providers";
import { useI18n } from "@/lib/i18n";

/**
 * RIVA AI — reuses the exact desktop chat stack (useChatHistory +
 * AssistantChatView) copied into this app. The screen is bare of glass except
 * the floating nav; the chat itself is the crisp content layer.
 */
export default function AssistantPage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useChatHistory(business.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Compact mobile header */}
      <div className="shrink-0 border-b border-line/50 bg-paper px-4 py-2 sm:px-6 md:sticky md:top-0 md:z-10 md:border-0 md:bg-paper/95 md:backdrop-blur">
        <div className="mx-auto flex w-full max-w-content items-center justify-end gap-1.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={history.startNew}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink shadow-subtle backdrop-blur hover:bg-surface hover:shadow-card"
          >
            <Plus size={14} />
            {t("assistant.newChat")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setHistoryOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink shadow-subtle backdrop-blur hover:bg-surface hover:shadow-card"
          >
            <HistoryIcon size={14} />
            {t("assistant.history")}
          </motion.button>
        </div>
      </div>

      {/* Chat fills remaining space */}
      <div className="min-h-0 flex-1">
        <AssistantChatView
          key={`${business.id}-wapp-assistant`}
          businessId={business.id}
          initialMessages={history.activeMessages}
          conversationId={history.activeId}
          onConversationId={history.onConversationId}
          selectionKey={history.selectionKey}
        />
      </div>

      <ChatHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        grouped={history.grouped}
        activeId={history.activeId}
        onSelect={history.selectConversation}
        onNew={history.startNew}
        onRemove={history.removeConversation}
      />
    </div>
  );
}