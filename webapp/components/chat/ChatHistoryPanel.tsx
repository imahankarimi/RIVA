"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
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

export function ChatHistoryPanel({
  open,
  onClose,
  grouped,
  activeId,
  onSelect,
  onNew,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  grouped: Groups;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
}) {
  const { t, dir } = useI18n();
  const offscreen = dir === "rtl" ? -340 : 340;

  const sections: Array<[keyof Groups, string]> = [
    ["today", t("assistant.historyToday")],
    ["yesterday", t("assistant.historyYesterday")],
    ["previous7Days", t("assistant.historyPrevious7Days")],
    ["older", t("assistant.historyOlder")],
  ];

  const isEmpty = sections.every(([key]) => grouped[key].length === 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px]"
            aria-hidden
          />
          <motion.aside
            key="panel"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 end-0 z-50 flex w-[86vw] max-w-[340px] flex-col border-s border-line bg-surface shadow-raised"
            role="dialog"
            aria-label={t("assistant.history")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <h2 className="font-display text-[15px] font-bold text-ink">{t("assistant.history")}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint hover:bg-surfaceMuted hover:text-ink"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  onNew();
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-signal-500 px-3 py-2.5 text-[13px] font-medium text-onSignal hover:bg-signal-600"
              >
                <Plus size={15} strokeWidth={2.4} />
                {t("assistant.newChat")}
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surfaceMuted text-ink-faint">
                    <MessageSquare size={18} strokeWidth={1.8} />
                  </span>
                  <p className="max-w-[220px] text-[12.5px] text-ink-faint">{t("assistant.historyEmpty")}</p>
                </div>
              ) : (
                sections.map(([key, label]) =>
                  grouped[key].length === 0 ? null : (
                    <div key={key} className="mb-3">
                      <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {label}
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        <AnimatePresence initial={false}>
                          {grouped[key].map((conv) => (
                            <motion.li
                              key={conv.id}
                              layout
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: dir === "rtl" ? -20 : 20 }}
                              transition={{ duration: 0.16 }}
                              className="group relative"
                            >
                              <button
                                onClick={() => {
                                  onSelect(conv.id);
                                  onClose();
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 pe-9 text-start text-[13px] transition-colors duration-150",
                                  conv.id === activeId
                                    ? "bg-signal-50 text-signal-700"
                                    : "text-ink-soft hover:bg-surfaceMuted hover:text-ink"
                                )}
                              >
                                <MessageSquare size={14} className="shrink-0 text-ink-faint" />
                                <span className="truncate">{conv.title}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(conv.id);
                                }}
                                aria-label={t("assistant.historyDelete")}
                                className="absolute end-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint opacity-0 transition-opacity duration-150 hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 group-hover:opacity-100"
                              >
                                <Trash2 size={13} />
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
