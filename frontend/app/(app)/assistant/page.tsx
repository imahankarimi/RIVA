"use client";

import { useState } from "react";
import { History as HistoryIcon, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { AssistantChatView } from "@/components/chat/AssistantChatView";
import { ChatHistoryPanel } from "@/components/chat/ChatHistoryPanel";
import { useChatHistory } from "@/lib/hooks/useChatHistory";
import { useI18n } from "@/lib/i18n";
import { useBusiness } from "@/app/providers";

export default function AssistantPage() {
  const { t } = useI18n();
  const { business } = useBusiness();
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useChatHistory(business.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={t("assistant.title")} subtitle={t("assistant.subtitle")} />

      <div className="mx-auto flex w-full max-w-content items-center justify-end gap-1.5 px-4 pt-3 sm:px-6">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={history.startNew}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-surfaceMuted hover:text-ink"
        >
          <Plus size={14} />
          {t("assistant.newChat")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setHistoryOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-surfaceMuted hover:text-ink"
        >
          <HistoryIcon size={14} />
          {t("assistant.history")}
        </motion.button>
      </div>

      <AssistantChatView
        key={`${business.id}-assistant`}
        businessId={business.id}
        initialMessages={history.activeMessages}
        conversationId={history.activeId}
        onConversationId={history.onConversationId}
        selectionKey={history.selectionKey}
      />

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
