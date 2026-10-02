"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayMs = 400,
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayMs?: number;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const showTimeout = React.useRef<NodeJS.Timeout>();

  const sideMap = {
    top: { y: -6, origin: "bottom" as const },
    bottom: { y: 6, origin: "top" as const },
    left: { x: -6, origin: "right" as const },
    right: { x: 6, origin: "left" as const },
  };

  function open() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    showTimeout.current = setTimeout(() => setVisible(true), delayMs);
  }

  function close() {
    clearTimeout(showTimeout.current);
    setVisible(false);
  }

  React.useEffect(() => () => clearTimeout(showTimeout.current), []);

  // Compute position after tooltip is mounted
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  React.useLayoutEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const tr = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    let top = 0, left = 0;

    switch (side) {
      case "top": top = tr.top - tt.height - gap; left = tr.left + tr.width / 2 - tt.width / 2; break;
      case "bottom": top = tr.bottom + gap; left = tr.left + tr.width / 2 - tt.width / 2; break;
      case "left": top = tr.top + tr.height / 2 - tt.height / 2; left = tr.left - tt.width - gap; break;
      case "right": top = tr.top + tr.height / 2 - tt.height / 2; left = tr.right + gap; break;
    }
    if (side === "top" || side === "bottom") {
      if (align === "start") left = tr.left;
      else if (align === "end") left = tr.right - tt.width;
    }
    setStyle({ position: "absolute", top, left, zIndex: 9999 });
  }, [visible, side, align]);

  const offset = sideMap[side];

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className="inline-flex"
      >
        {children}
      </div>
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, ...offset }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...offset }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={style}
            className={cn(
              "pointer-events-none whitespace-nowrap rounded-md bg-signal-500 px-2.5 py-1.5 text-[12px] font-medium text-onSignal shadow-raised",
              className
            )}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { Tooltip };
