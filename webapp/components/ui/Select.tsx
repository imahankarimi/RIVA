"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "@/lib/motion/tokens";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  name,
  error,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  error?: string;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? value ?? "");
  const selected = value ?? internal;
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === selected)?.label;

  function select(v: string) {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
    setOpen(false);
  }

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`select-list-${selected || "empty"}`}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-surface px-3 py-2 text-sm text-ink",
          "transition-colors duration-150",
          "placeholder:text-ink-faint",
          "focus-visible:outline-none focus-visible:border-signal-400 focus-visible:ring-2 focus-visible:ring-signal-100",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surfaceMuted",
          error ? "border-rose-500/70" : "border-input",
        )}
      >
        <span className={cn(!selected && "text-ink-faint")}>{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className="text-ink-faint" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={`select-list-${selected || "empty"}`}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-surface shadow-raised"
            role="listbox"
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === selected}
                aria-disabled={opt.disabled}
                onClick={() => !opt.disabled && select(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center px-3 py-2 text-sm transition-colors duration-75",
                  opt.value === selected
                    ? "bg-signal-50 font-medium text-signal-700"
                    : "text-ink hover:bg-surfaceMuted hover:text-ink",
                  opt.disabled && "pointer-events-none opacity-40"
                )}
              >
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1 text-[11.5px] font-medium leading-tight text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

export { Select, type SelectOption };
