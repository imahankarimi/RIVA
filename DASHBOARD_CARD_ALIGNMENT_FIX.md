# Dashboard Card Alignment Fix

## Problem
The Dashboard metric cards (Revenue, Expenses, Cash Flow, Balance) had inconsistent heights. When comparison data appeared (e.g., "100.0% vs last month"), cards with trend percentages were taller than the Balance card, which has no comparison value, causing visual misalignment in the grid.

## Root Cause
In `StatCard.tsx`, the trend section was conditionally rendered:
```tsx
{hasTrend && (
  <div className="mt-2 flex items-center gap-1 text-[11.5px]">
    {/* trend content */}
  </div>
)}
```

Cards without trend data (Balance) were shorter by ~26px, breaking the grid alignment.

## Solution
Changed the structure to **always reserve space** for the trend section, but only render content when trend data exists:

```tsx
{/* Always reserve space for trend to maintain consistent card heights across all metrics */}
<div className="mt-2 flex min-h-[26px] items-center gap-1 text-[11.5px]">
  {hasTrend && (
    <>
      {/* trend content */}
    </>
  )}
</div>
```

The `min-h-[26px]` ensures consistent height whether the trend badge is present or not.

## Files Changed
- `frontend/components/dashboard/StatCard.tsx` — added `min-h-[26px]` and restructured conditional rendering
- `webapp/components/dashboard/StatCard.tsx` — applied same fix with `min-h-[24px]` (mobile-optimized sizing)

## Benefits
✅ All four metric cards maintain identical height, border alignment, and visual structure  
✅ Works across desktop and mobile breakpoints (375px+)  
✅ No layout shift when comparison values load or change dynamically  
✅ No fabricated financial data or misleading information  
✅ Preserves RTL/LTR support, dark mode, responsive behavior, and all RIVA design tokens  
✅ Backend logic and financial calculations unchanged

## Verification
- ✅ TypeScript: `tsc --noEmit` (both apps)
- ✅ Linting: `next lint` (both apps)
- ✅ Design system: `npm run design:check` passes

**Date:** 2026-10-14  
**Approach:** Structural layout fix using consistent minimum height
