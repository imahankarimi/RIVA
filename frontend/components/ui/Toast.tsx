"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING_SOFT } from "@/lib/motion/tokens";

type ToastVariant = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (message: string, opts?: { variant?: ToastVariant; duration?: number }) => {
      const id = Math.random().toString(36).slice(2, 10);
      const toast: Toast = {
        id,
        message,
        variant: opts?.variant ?? "default",
        duration: opts?.duration ?? 4000,
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => dismiss(id), toast.duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const iconMap: Record<ToastVariant, React.ReactNode> = {
  default: <Info size={16} className="text-signal-500" />,
  success: <CheckCircle2 size={16} className="text-moss-700" />,
  error: <AlertCircle size={16} className="text-rose-700" />,
  warning: <AlertCircle size={16} className="text-amber-700" />,
};

const bgMap: Record<ToastVariant, string> = {
  default: "bg-signal-50 border-signal-100",
  success: "bg-moss-100 border-moss-100",
  error: "bg-rose-100 border-rose-100",
  warning: "bg-amber-100 border-amber-100",
};

const textMap: Record<ToastVariant, string> = {
  default: "text-signal-700",
  success: "text-moss-700",
  error: "text-rose-700",
  warning: "text-amber-700",
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={SPRING_SOFT}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-raised max-w-sm",
              bgMap[t.variant]
            )}
          >
            <span className="mt-0.5 shrink-0">{iconMap[t.variant]}</span>
            <span className={cn("flex-1 text-[13px] leading-snug", textMap[t.variant])}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className={cn("shrink-0 mt-0.5 rounded p-0.5 transition-colors hover:bg-black/5", textMap[t.variant])}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
