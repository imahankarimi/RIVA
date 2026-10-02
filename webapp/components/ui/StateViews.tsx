"use client";

import { motion } from "framer-motion";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/motion/tokens";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot [animation-delay:300ms]" />
      </span>
      <p className="text-[13px] text-ink-faint">{label}</p>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surfaceMuted text-ink-faint">
        <Inbox size={20} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        {body && <p className="mt-1 max-w-xs text-[12.5px] text-ink-faint">{body}</p>}
      </div>
    </motion.div>
  );
}

export function ErrorState({ title, body, onRetry, retryLabel }: { title: string; body?: string; onRetry?: () => void; retryLabel: string }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
        <AlertTriangle size={20} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        {body && <p className="mt-1 max-w-xs text-[12.5px] text-ink-faint">{body}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw size={13} />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}
