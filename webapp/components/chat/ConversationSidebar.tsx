"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  title: string;
  updatedAt: string;
}

interface Groups {
  today: HistoryEntry[];
  yesterday: HistoryEntry[];
  previous7Days: HistoryEntry[];
  older: HistoryEntry[];
}

export function ConversationSidebar({
  grouped,
  activeId,
  onSelect,
  onNew,
  onRemove,
  isOpen,
  onToggle,
}: {
  grouped: Groups;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { t, dir } = useI18n();

  const sections: Array<[keyof Groups, string]> = [
    ["today", t("assistant.historyToday")],
    ["yesterday", t("assistant.historyYesterday")],
    ["previous7Days", t("assistant.historyPrevious7Days")],
    ["older", t("assistant.historyOlder")],
  ];

  const isEmpty = sections.every(([key]) => grouped[key].length === 0);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - matches main RIVA sidebar inset card style */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen || window.innerWidth >= 768 ? 0 : dir === "rtl" ? 280 : -280,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-[5rem] bottom-0 z-40 flex w-[280px] flex-col bg-paper",
          dir === "rtl" ? "end-0" : "start-0",
          "md:static md:inset-y-0 md:z-0"
        )}
      >
        {/* Inset card shell - same as main RIVA sidebar */}
        <div className="m-2 flex h-[calc(100vh-6rem)] w-auto flex-col overflow-hidden rounded-xl bg-sidebar text-sidebar-foreground shadow-subtle ring-1 ring-line/70 md:h-[calc(100vh-1rem)]">
          {/* New Chat Button */}
          <div className="shrink-0 border-b border-line p-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNew();
              if (window.innerWidth < 768) onToggle();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] font-medium text-ink shadow-subtle transition-all hover:bg-surface hover:shadow-card"
          >
            <Plus size={15} strokeWidth={2.5} />
            {t("assistant.newChat")}
          </motion.button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceMuted text-ink-faint">
                <MessageSquare size={16} strokeWidth={1.8} />
              </span>
              <p className="max-w-[200px] text-[12px] leading-relaxed text-ink-faint">
                {t("assistant.historyEmpty")}
              </p>
            </div>
          ) : (
            sections.map(([key, label]) =>
              grouped[key].length === 0 ? null : (
                <div key={key} className="mb-4">
                  <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    {label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    <AnimatePresence initial={false}>
                      {grouped[key].map((conv) => (
                        <motion.li
                          key={conv.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="group relative"
                        >
                          <button
                            onClick={() => {
                              onSelect(conv.id);
                              if (window.innerWidth < 768) onToggle();
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 pe-9 text-start text-[13px] transition-colors",
                              conv.id === activeId
                                ? "bg-signal-50 font-medium text-signal-700"
                                : "text-ink-soft hover:bg-surfaceMuted hover:text-ink"
                            )}
                          >
                            <MessageSquare
                              size={13}
                              className={cn(
                                "shrink-0",
                                conv.id === activeId ? "text-signal-600" : "text-ink-faint"
                              )}
                            />
                            <span className="line-clamp-1 flex-1">{conv.title}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(conv.id);
                            }}
                            aria-label={t("assistant.historyDelete")}
                            className="absolute end-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )
            )
          )}
        </div>
        </div>
      </motion.aside>
    </>
  );
}
