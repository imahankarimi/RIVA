"use client";

import { createContext, useContext, useState } from "react";

interface SidebarContextValue {
  /** Desktop "taskbar" collapsed state — persisted across sessions. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /**
   * Desktop hover expansion — TEMPORARY. When the pointer is over the rail it
   * visually expands regardless of `collapsed`; leaving reverts it. Drives the
   * same width/label animation as `collapsed` without persisting anything.
   */
  hovered: boolean;
  setHovered: (v: boolean) => void;
  /** Latest truth used to animate the desktop rail (manual collapsed + hover). */
  displayedCollapsed: boolean;
  /** Mobile off-canvas nav drawer, opened from the Topbar hamburger button. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "ledgerai.sidebar_collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // First-time visitors get the collapsed "taskbar" rail; a stored preference
  // wins when present. This provider only mounts after auth resolves on the
  // client, so reading storage in the initializer is safe and avoids a
  // collapsed→expanded reflow on refresh.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "1";
  });
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Reference behavior applied to RIVA: the manual `collapsed` preference is
  // the baseline; hovering the rail temporarily overrides it to expanded.
  const displayedCollapsed = collapsed && !hovered;

  const value: SidebarContextValue = {
    collapsed,
    toggleCollapsed,
    hovered,
    setHovered,
    displayedCollapsed,
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
