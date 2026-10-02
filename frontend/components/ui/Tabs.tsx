"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "@/lib/motion/tokens";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const activeTab = value ?? internal;
  const setActive = React.useCallback((v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  }, [onValueChange]);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: setActive }}>
      <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-lg bg-surfaceMuted p-1",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  value,
  className,
  disabled,
  children,
  ...props
}: {
  value: string;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      data-state={isActive ? "active" : "inactive"}
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5",
        "text-[13px] font-medium transition-colors duration-150",
        isActive ? "bg-surface text-ink shadow-subtle" : "text-ink-soft hover:text-ink",
        "disabled:opacity-40 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn(
        "mt-1 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
