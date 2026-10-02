"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, onClose: () => onOpenChange(false) }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}
const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog parts must be used within <Dialog>");
  return ctx;
}

function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, onClose } = useDialogContext();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: DURATION.moderate, ease: EASE_OUT }}
            className={cn(
              "relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-raised",
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DialogHeader({
  title,
  onClose,
  className,
}: {
  title: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const { onClose: ctxOnClose } = useDialogContext();
  return (
    <div className={cn("flex h-14 shrink-0 items-center justify-between border-b border-line px-4", className)}>
      <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
      <button
        onClick={onClose ?? ctxOnClose}
        aria-label="Close"
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint hover:bg-surfaceMuted hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3", className)} {...props} />
  );
}

export { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter };