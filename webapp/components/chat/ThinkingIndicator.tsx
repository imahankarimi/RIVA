import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export function ThinkingIndicator({ label }: { label?: string }) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
          className="h-2 w-2 rounded-full bg-signal-500"
        />
        <motion.span
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
          className="h-2 w-2 rounded-full bg-signal-500"
        />
        <motion.span
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
          className="h-2 w-2 rounded-full bg-signal-500"
        />
      </div>
      <span className="text-[14px] text-ink-soft">{label ?? t("assistant.thinking")}</span>
    </motion.div>
  );
}
