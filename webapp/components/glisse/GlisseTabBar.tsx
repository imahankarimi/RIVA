"use client";

import Link from "next/link";
import { TabBar as GlisseTabBar, type TabBarProps } from "glisse";

/**
 * RIVA wrapper for Glisse TabBar
 * Preserves animated selection, spring transitions, drag interaction, lift, lens
 * Integrates Next.js Link for navigation
 */
export function TabBar(props: Omit<TabBarProps, "link">) {
  return <GlisseTabBar {...props} link={Link} />;
}
