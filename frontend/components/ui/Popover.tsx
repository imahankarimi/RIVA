"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Popover — lightweight custom implementation of the Shadcn floating
 * popover. Positions relative to its trigger, portal-free (RIVA uses a
 * fixed shell), dismisses on outside click / Escape, and animates in with
 * a fade+zoom that respects RTL via CSS logical properties.
 */
function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (onOpenChange) onOpenChange(v);
      else setInternalOpen(v);
    },
    [onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  );
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("Popover parts must be used within <Popover>");
  return ctx;
}

function PopoverTrigger({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = usePopoverContext();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      className={cn("inline-flex cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function PopoverContent({
  align = "center",
  side = "bottom",
  className,
  children,
}: {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = usePopoverContext();
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const parent = contentRef.current?.parentElement;
    triggerRef.current = parent?.querySelector("[aria-haspopup='dialog']") as HTMLElement | null;
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const alignClass =
    align === "start" ? "start-0" : align === "end" ? "end-0" : "left-1/2 -translate-x-1/2 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute z-50 mt-2 rounded-lg border border-line bg-popover p-2.5 text-sm text-popover-foreground shadow-raised",
            side === "top" && "mb-2 mt-0",
            alignClass,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Popover, PopoverTrigger, PopoverContent };