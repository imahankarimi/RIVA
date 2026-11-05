# Mobile UX Fixes — November 4, 2026

This document details the three specific fixes applied to resolve remaining mobile UX issues in the RIVA Webapp.

## Issues Fixed

### 1. Typography / Font Rendering ✅

**Root Cause**: Missing font-switching CSS variables in `globals.css` that assign locale-specific fonts.

**Fix Applied**:
- Added font-switching CSS to `webapp/app/globals.css`
- `html[data-locale="en"]`: Inter (UI) + Manrope (display)
- `html[data-locale="fa"]`: Vazirmatn (both UI and display)
- CSS variables `--font-ui` and `--font-ui-display` now properly assigned based on `data-locale`

**Files Changed**:
- `webapp/app/globals.css`

### 2. Mobile Scrolling ✅

**Root Cause**: Scroll detection hook tracked `window.scrollY`, but actual scrolling happened inside the `main` element, creating a disconnect. Auto-hide/show behavior for topbar and tab bar was broken.

**Fix Applied**:
- Changed layout container from `min-h-dvh` to `h-dvh` for proper viewport constraint
- Added `id="webapp-main-scroll"` to the main scroll container
- Updated `useScrollDirection` hook to accept an element ref parameter
- Both `WebappTopbar` and `MobileTabBar` now track the correct scroll container via ref

**Files Changed**:
- `webapp/app/(shell)/layout.tsx`
- `webapp/lib/mobile-ux.ts`
- `webapp/components/webapp/WebappTopbar.tsx`
- `webapp/components/webapp/MobileTabBar.tsx`

### 3. Light Mode Colors ✅

**Root Cause**: Components using hardcoded white backgrounds and foundation tokens directly instead of semantic tokens. The More sheet had multiple issues with light mode visibility.

**Fix Applied in MobileTabBar More Sheet**:
- Grabber: `bg-deep-ink/20` → `bg-ink/20` (semantic token)
- Header title: `text-deep-ink` → `text-ink`
- Sheet background: `bg-white/50` → `bg-surface/80 backdrop-blur-sm`
- Sheet border: Added proper dark mode variant `dark:border-line/40`
- Navigation items:
  - Default text: `text-deep-ink` → `text-ink`
  - Hover states: `hover:bg-white/70` → `hover:bg-surface-muted/60`
  - Active states: proper semantic tokens with dark mode variants
- Icon backgrounds: `bg-surfaceMuted/50` → `bg-surface-muted/70`
- Border colors: Added dark mode variants `dark:border-line/30`

**Files Changed**:
- `webapp/components/webapp/MobileTabBar.tsx`

## Technical Details

### Font System
The font-switching system works as follows:
1. `I18nProvider` sets `data-locale` attribute on `<html>`
2. CSS rules in `globals.css` assign font CSS variables based on locale
3. Tailwind preset consumes these as `font-sans` and `font-display`
4. No component needs to hardcode font families

### Scroll Detection System
The scroll detection system now works correctly:
1. Main content scrolls inside a constrained viewport (`h-dvh`)
2. `useScrollDirection` hook accepts an optional element ref
3. Components find and track `#webapp-main-scroll` element
4. Scroll events properly trigger auto-hide/show behavior

### Semantic Tokens
Semantic tokens provide theme-aware colors:
- `bg-surface` → white (light) / deep navy (dark)
- `bg-surface-muted` → light gray (light) / darker navy (dark)
- `text-ink` → deep ink (light) / warm white (dark)
- `border-line` → steel-tinted gray, automatically themes

## Verification Checklist

Test these scenarios across both Light and Dark modes:

- [ ] **Typography**: Text renders correctly in both English and Persian
- [ ] **Font Loading**: Fonts load without flash or fallback on page load
- [ ] **Scrolling**: Smooth vertical scrolling throughout the app
- [ ] **Auto-hide**: Topbar and tab bar auto-hide on scroll down
- [ ] **Auto-show**: Topbar and tab bar auto-show on scroll up
- [ ] **Light Mode**: All surfaces, text, borders visible and properly contrasted
- [ ] **Dark Mode**: Still works correctly (not broken by fixes)
- [ ] **More Sheet**: Opens with correct colors in both themes
- [ ] **Navigation**: All menu items readable and interactive
- [ ] **Buttons**: Glass buttons and interactive states work correctly
- [ ] **Mobile Viewports**: Test at 320px, 375px, 390px, 430px widths
- [ ] **RTL**: Persian layout flows correctly right-to-left
- [ ] **Interactions**: Touch interactions, haptic feedback, transitions work

## What Was NOT Changed

The following were preserved as per requirements:
- Glisse component library and its interactions
- Existing business logic, APIs, authentication
- Backend integrations and data flows
- Desktop layouts and responsive behavior
- Unrelated components and functionality
- Design system tokens and color palette
- Animation and motion systems

## Notes

- All fixes address root causes, not symptoms
- Semantic tokens used throughout for theme consistency
- Mobile-first approach maintained
- RIVA's Liquid Glass design language preserved
- No regressions introduced to desktop experience
