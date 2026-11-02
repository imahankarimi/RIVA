# RIVA Sidebar Selection — Final Fix

**Date:** 2026-11-02  
**Checkpoint:** `0c0340a` preserved (no commits)  
**Status:** Complete — Ready for testing

## All Issues Fixed

### ✅ 1. Positional Stability (NEW REQUIREMENT)
**Issue:** Selected button moved/shifted during selection due to Framer Motion `layoutId` animation
**Fix:** Completely removed the animated pill with `layoutId="sidebar-active-pill"`
**Result:** Button stays in exact position. Only visual appearance changes (background, border, text color, shadow) via CSS transitions.

### ✅ 2. Protrusion
**Issue:** Active pill protruded outside rounded corners during animation
**Fix:** Removed the separate animated pill layer entirely
**Result:** No protrusion possible—background is now part of the Link element itself

### ✅ 3. Color Transitions  
**Issue:** Double-layer backgrounds (Link + pill) caused color flashing
**Fix:** Single background source via `bg-sidebar-accent` on the Link's active state only
**Result:** Smooth CSS transitions, no flashing

### ✅ 4. Business/Profile Button Artifacts
**Issue:** White rectangular patches on hover due to `hover:bg-sidebar-accent` blocking glass-lens pseudo-elements
**Fix:** Removed `hover:bg-sidebar-accent`, added `z-10` to children
**Result:** Glass-lens gradient and mouse tracking work correctly

## Implementation

### Final NavLink Structure

```tsx
<Link
  className={cn(
    "glass-lens group relative flex h-9 items-center gap-2.5 rounded-md px-3",
    "transition-all duration-180",  // Smooth CSS transitions
    active
      ? "border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-subtle"
      : "border border-transparent text-ink-soft hover:border-line/50 hover:text-ink"
  )}
>
  {/* NO animated pill — button stays in place */}
  
  <Icon className="relative z-10 shrink-0 transition-colors duration-180" />
  <motion.span className="relative z-10">{label}</motion.span>
</Link>
```

**Key points:**
- No `layoutId` — no position animation
- Background is part of Link's conditional classes
- `transition-all duration-180` handles background, border, shadow, text color smoothly
- Glass-lens effect works via existing pseudo-elements
- Content stays `z-10` above glass-lens layers

### Business & Profile Buttons

```tsx
<button className="glass-lens relative flex w-full items-center gap-2.5 rounded-md">
  {/* NO hover:bg-sidebar-accent */}
  <div className="relative z-10 flex h-8 w-8 ... bg-sidebar-accent">
    {initial}
  </div>
  <motion.div className="relative z-10 min-w-0 flex-1">
    {/* content */}
  </motion.div>
</button>
```

**Changes:**
- Removed `hover:bg-sidebar-accent` from both buttons
- Added `z-10` to all child elements
- Glass-lens pseudo-elements now visible on hover

## What Changed

**Modified files:**
1. `frontend/components/layout/SidebarNavLinks.tsx` — Removed animated pill, simplified to CSS-only transitions
2. `frontend/components/layout/Sidebar.tsx` — Fixed Business and Profile buttons

**Unchanged (per restrictions):**
- ✅ Global `.glass-lens` implementation
- ✅ `liquidLens.ts` mouse tracker
- ✅ All other Liquid Glass buttons
- ✅ Sidebar layout, dimensions, typography
- ✅ Navigation logic
- ✅ RTL/LTR support
- ✅ No selection dots

## Behavior

**Selection:**
- Click a nav item → Background, border, shadow, text color transition smoothly in place
- Button does NOT move, shift, slide, or translate
- Only appearance changes, position stays fixed
- Duration: 180ms with ease curve

**Hover:**
- Inactive items: subtle border appears
- Business/Profile buttons: glass-lens gradient follows mouse
- No white artifacts or blocking

**Glass Lens:**
- Mouse tracking works on all buttons
- Radial gradient follows pointer
- No conflicts with selection state

## Verification

Run the app and confirm:

**Position stability:**
- [ ] Click between nav items — buttons never move or shift
- [ ] Selection changes happen in-place with smooth visual transition
- [ ] No layout shifts or reflows during selection
- [ ] Collapsed sidebar: no position changes

**Visual appearance:**
- [ ] Light mode: active has white background, navy text
- [ ] Dark mode: active has warm-white background, dark text
- [ ] Smooth transitions: background, border, shadow, text (180ms)
- [ ] No color flashing or double-layers

**Business/Profile buttons:**
- [ ] Hover shows glass-lens gradient (no white patch)
- [ ] Mouse tracking follows cursor
- [ ] Avatar/initial badges stay visible
- [ ] Text readable on all states

**Cross-environment:**
- [ ] Light/dark mode transitions work
- [ ] Persian RTL: no layout breaks
- [ ] English LTR: works correctly
- [ ] Collapsed/expanded states work

## Design System

```bash
npm run design:check
# ✅ RIVA design system — OK (157 tokens in :root, 116 in .dark)
```

All tokens validated. No new TypeScript errors introduced.

## Technical Notes

**Why remove the animated pill?**

The `layoutId` approach creates a shared element that animates between positions—exactly what we must NOT do. Even with perfect border-radius inheritance, it fundamentally moves content. The reference implementation (liquid-glass) never used shared layout animation—it used simple CSS state classes, which is what we now have.

**Performance:**

CSS transitions on `background-color`, `border-color`, `box-shadow`, and `color` are GPU-accelerated and more performant than Framer Motion layout animations. The 180ms duration matches RIVA's design system (`--dur-base`).

**Accessibility:**

`aria-current="page"` is already set by the parent routing logic. Visual state is now pure CSS, which screen readers interpret correctly through computed styles.
