# Soon Badges Restoration — Complete

## Summary
Restored the missing "Soon" badges in the frontend sidebar navigation. The badges were already present and working in the webapp sidebar.

## Root Cause
The `NavLink` component in `frontend/components/layout/SidebarNavLinks.tsx` was missing the badge rendering logic that was present in `webapp/components/webapp/WebappSidebar.tsx`.

## Navigation Items with "Soon" Badges

### Frontend (RIVA Desktop)
- **Planning Section:**
  - `/budgets` — "Budgets" (به‌زودی)
  - `/goals` — "Goals" (به‌زودی)
  - `/debts` — "Debts" (به‌زودی)
  - `/subscriptions` — "Subscriptions" (به‌زودی)

- **Intelligence Section:**
  - `/advisor` — "RIVA Advisor" (به‌زودی)

### Webapp (RIVA App)
- **Planning Section:**
  - `/budgets` — "Budgets" (به‌زودی)
  - `/goals` — "Goals" (به‌زودی)
  - `/debts` — "Debts" (به‌زودی)
  - `/subscriptions` — "Subscriptions" (به‌زودی)

## Changes Made

### File: `frontend/components/layout/SidebarNavLinks.tsx`

**Added:**
1. `showSoon` constant that checks if item has `soon: true` property
2. Conditional `justify-between` class when badge is present
3. Wrapped icon and label in a flex container
4. Added badge rendering logic with motion animation

**Badge Styling:**
- Rounded full border
- Subtle border (`border-line/40`)
- Surface background (`bg-surface`)
- Faint text color (`text-ink-faint`)
- 10px font size
- Proper RTL support (no physical directional properties)

## Visual Behavior

### Expanded Sidebar
- Badge appears on the trailing end of navigation items marked with `soon: true`
- Text reads "Soon" (English) or "به‌زودی" (Persian)
- Smooth fade-in animation when expanding sidebar
- Proper spacing between label and badge

### Collapsed Sidebar
- Badges are hidden (only icons visible)
- No layout shift or overflow

### Theme Support
- Light mode: subtle border and muted text
- Dark mode: adjusted opacity for glass effect compatibility

### RTL Support
- Uses logical properties (`inline-flex`, flex gap)
- Badge automatically positions on correct side in Persian layout

## Verification Checklist

✅ Design system validation passed (`npm run design:check`)
✅ ESLint passed for changed file
✅ Translation keys exist in both `en.ts` and `fa.ts` dictionaries
✅ No hardcoded colors (uses design tokens)
✅ Proper motion tokens from `lib/motion/tokens.ts`
✅ Consistent with webapp implementation
✅ RTL-safe (no physical directional properties)
✅ Accessible (sufficient contrast, no color-only signaling)

## Files Modified
- `frontend/components/layout/SidebarNavLinks.tsx`

## Files Not Modified
- `webapp/components/webapp/WebappSidebar.tsx` (already had badges)
- Navigation configuration files (badges already defined in `soon: true` properties)
- i18n dictionaries (translations already present)

## Technical Notes

The webapp sidebar (`WebappSidebar.tsx`) had the correct implementation since its creation. The frontend sidebar was missing this feature, likely due to a refactoring where the badge rendering logic was removed but the `soon: true` properties remained in `nav-items.ts`.

The restored implementation matches the webapp pattern:
- Same translation key: `t("common.soon")`
- Same visual styling approach
- Same responsive behavior
- Same motion tokens

Date: 2026-11-02
