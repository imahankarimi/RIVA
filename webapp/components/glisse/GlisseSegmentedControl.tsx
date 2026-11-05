"use client";

import { SegmentedControl as GlisseSegmentedControl, type SegmentedControlProps } from "glisse";

/**
 * RIVA wrapper for Glisse SegmentedControl
 * Preserves selection animation, dragging, and lens behavior
 */
export function SegmentedControl(props: SegmentedControlProps) {
  return <GlisseSegmentedControl {...props} />;
}
