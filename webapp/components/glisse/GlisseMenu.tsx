"use client";

import { Menu as GlisseMenu, type MenuProps } from "glisse";

/**
 * RIVA wrapper for Glisse Menu
 * Preserves trigger, positioning, icons, separators, and all states
 */
export function Menu(props: MenuProps) {
  return <GlisseMenu {...props} />;
}
