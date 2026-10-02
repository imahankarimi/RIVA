import { useI18n } from "@/lib/i18n";

export function ThinkingIndicator({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5 rounded-lg rounded-ss-sm bg-surface px-4 py-3 shadow-subtle border border-line w-fit animate-fade-up">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:300ms]" />
      </span>
      <span className="text-[13px] text-ink-faint">{label ?? t("assistant.thinking")}</span>
    </div>
  );
}
