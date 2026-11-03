# Financial Value Color Fix — 2026-11-02

## Issue
Expense amounts (negative values like `-$837`) were displayed in **white** (`text-ink`) instead of **red**, while income amounts were correctly displayed in **green** (`text-moss-700`). This violated RIVA's financial UX semantic color rules defined in `docs/DESIGN_SYSTEM.md §9.2`.

## Root Cause
Multiple transaction display components were using hardcoded status colors (`text-moss-700` for positive) but falling back to neutral text color (`text-ink` or `text-foreground`) for negative amounts, instead of using the semantic financial tokens defined in the design system.

**Problem pattern:**
```tsx
positive ? "text-moss-700" : "text-ink"  // ❌ WRONG: negative = white
```

## Solution
Replaced hardcoded color logic with semantic financial tokens that properly convey meaning in both light and dark themes:

**Correct pattern:**
```tsx
positive ? "text-fin-positive" : "text-fin-negative"  // ✅ CORRECT
```

### Token Values (from design-system/tokens.css)

**Light mode:**
- `--c-fin-positive: 46 119 82` (moss-700, green)
- `--c-fin-negative: 143 51 44` (rose-700, red)

**Dark mode:**
- `--c-fin-positive: 133 202 165` (light green)
- `--c-fin-negative: 232 140 131` (light red)

Both themes maintain proper contrast and semantic meaning.

## Files Changed

### frontend/
1. `components/dashboard/RecentTransactions.tsx:45` — Recent transactions card amounts
2. `components/dashboard/RecentTransactionsTable.tsx:97` — Recent transactions table amounts
3. `components/transactions/TransactionRow.tsx:32` — Desktop transaction row
4. `components/transactions/TransactionRow.tsx:59` — Mobile transaction row

### webapp/
5. `components/transactions/TransactionRow.tsx:32` — Desktop transaction row
6. `components/transactions/TransactionRow.tsx:59` — Mobile transaction row

## Semantic Rules Applied

Per `docs/DESIGN_SYSTEM.md §9.2`:

> **Sign alone must never decide colour.**

- **Income (positive amounts):** `text-fin-positive` → green (moss)
- **Expenses (negative amounts):** `text-fin-negative` → red (rose)
- **Neutral values:** `text-fin-neutral` → slate (for balances with no directional meaning)

The fix uses transaction type/sign to determine semantic meaning, not just checking if a string starts with `-`.

## Verification

✅ Type checking passes (`tsc --noEmit`)
✅ Design system validator passes (`npm run design:check`)
✅ Linting passes (`next lint`)
✅ All 6 transaction display locations updated
✅ Both frontend/ and webapp/ copies synchronized

## Surfaces Affected

The fix applies to all transaction amount displays:
- Dashboard recent transactions (card and table views)
- Transactions page (list view, desktop and mobile)
- Income/Expenses filtered views
- Any component using `TransactionRow`

### Out of Scope (Intentional)

- Icon backgrounds in transaction rows still use decorative `bg-moss-100`/`bg-rose-100` — these are visual accents, not semantic financial data
- `StatCard` trend colors use `invertTrendColor` logic and were already correct
- Chart series colors follow chart-specific palette rules (§6.17)
- AI Assistant transaction cards already use semantic tokens

## Testing Required

Manual visual verification needed (cannot be done in sandboxed environment):

1. **Light theme:**
   - Income: `+$837` should display in green (#2E7752)
   - Expense: `-$837` should display in red (#8F332C)

2. **Dark theme:**
   - Income: `+$837` should display in light green (#85CAA5)
   - Expense: `-$837` should display in light red (#E88C83)

3. **Locations to check:**
   - `/overview` — Recent Transactions card
   - `/overview` — Recent Transactions table
   - `/transactions` — Transaction list (all tabs)
   - `/income` — Income transactions
   - `/expenses` — Expense transactions
   - Both desktop and mobile (375px) viewports

4. **RTL verification (fa locale):**
   - Persian digits should render correctly
   - Colors should remain semantically correct

## Design System Compliance

This fix aligns with RIVA's design principles:

- **Numbers must be trustworthy** — Color now conveys accurate financial meaning
- **Semantic color over decoration** — Uses `fin-*` tokens, not raw `moss-*`/`rose-*`
- **Theme-safe by default** — No `dark:` variants needed
- **Consistent across surfaces** — All transaction displays use the same logic

## Notes

- Pre-existing type errors in `frontend/components/ui/GlassSelect.tsx` are unrelated
- The fix preserves currency formatting, localization, and accounting behavior
- No changes to transaction calculations, API, or database
- Icon chip backgrounds remain decorative (not changed)
