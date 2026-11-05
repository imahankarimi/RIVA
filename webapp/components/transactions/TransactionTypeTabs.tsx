"use client";

import { SegmentedControl } from "@/components/glisse";

export type TransactionKind = "spent" | "income";

/**
 * TransactionTypeTabs
 *
 * Uses official Glisse SegmentedControl for the Spent/Income toggle.
 * Glisse provides the animated thumb, lens lift, and drag interaction behavior.
 */
export function TransactionTypeTabs({
  value,
  onChange,
  spentLabel,
  incomeLabel,
  ariaLabel,
}: {
  value: TransactionKind;
  onChange: (value: TransactionKind) => void;
  spentLabel: string;
  incomeLabel: string;
  /** Accessible name for the group, e.g. "Transaction type" / "نوع تراکنش". */
  ariaLabel?: string;
}) {
  const items = [
    { value: "spent", label: spentLabel },
    { value: "income", label: incomeLabel },
  ];

  return (
    <SegmentedControl
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as TransactionKind)}
      aria-label={ariaLabel}
    />
  );
}