# Font Loading Fix — RIVA

**Date:** 2026-10-14  
**Issue:** Intended fonts (Inter, Manrope, JetBrains Mono, Vazirmatn) not loading locally; fallback system fonts displayed instead.  
**Status:** ✅ Fixed

---

## Root Cause

**CSS variable scope mismatch** between `layout.tsx` and `globals.css`.

The font variables from `next/font/google` were applied to `<body>`:

```tsx
// layout.tsx (BEFORE)
<body className={`${inter.variable} ${manrope.variable} ... font-sans`}>
```

But `globals.css` tried to reference these variables on `:root` (the `<html>` element):

```css
/* globals.css */
:root,
html[data-locale="en"] {
  --font-ui: var(--font-inter), system-ui, sans-serif;
  /* ^^^ Tried to resolve --font-inter, but it was defined on body! */
}
```

**CSS variables defined on a child element (`body`) are NOT visible to parent elements (`:root`/`html`).**

When `:root` couldn't resolve `var(--font-inter)`, the entire `--font-ui` value became invalid, causing the font stack to fall back to `system-ui, sans-serif`.

---

## The Fix

Moved the font variable classes from `<body>` to `<html>` so `:root` can resolve them:

### frontend/app/layout.tsx

```tsx
// AFTER
<html
  lang="en"
  dir="ltr"
  data-locale="en"
  suppressHydrationWarning
  className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} ${vazirmatn.variable} ${ibmPlexSans.variable}`}
>
  <head>...</head>
  <body className="font-sans">
    <Providers>{children}</Providers>
    <ServiceWorkerRegistration />
  </body>
</html>
```

### webapp/app/layout.tsx

```tsx
// AFTER
<html
  lang="en"
  dir="ltr"
  suppressHydrationWarning
  className={`${inter.variable} ${manrope.variable} ${mono.variable} ${vazirmatn.variable}`}
>
  <head>...</head>
  <body className="font-sans">
    <Providers>{children}</Providers>
    <ServiceWorkerRegistration />
  </body>
</html>
```

The `font-sans` utility class stays on `<body>` where it belongs — it applies the actual font-family from the resolved CSS variables.

---

## What Changed

**Files modified:**
- `frontend/app/layout.tsx` — moved font variables to `<html>`
- `webapp/app/layout.tsx` — moved font variables to `<html>`

**Files NOT changed:**
- `frontend/app/globals.css` — correct as-is
- `webapp/app/globals.css` — correct as-is
- `design-system/tokens.css` — correct as-is
- `design-system/tailwind-preset.ts` — correct as-is

---

## Verification Results

✅ **TypeScript:** `tsc --noEmit` passes in both apps (no errors)  
✅ **ESLint:** `next lint` passes in both apps (no warnings)  
✅ **Design system:** `npm run design:check` passes (143 tokens in :root, 102 in .dark)

---

## Expected Result

After this fix, the intended RIVA fonts now load correctly:

- **English (LTR):**
  - UI text: **Inter**
  - Display/headings: **Manrope**
  - Money/tabular figures: **JetBrains Mono**

- **Persian (RTL):**
  - UI text: **Vazirmatn**
  - Display/headings: **Vazirmatn**
  - Money/tabular figures: **JetBrains Mono**

The font switching is automatic based on `html[data-locale]`, set by `lib/i18n/I18nProvider`.

---

## How Font Loading Works in RIVA

1. **`next/font/google`** in `layout.tsx` fetches fonts from Google Fonts and generates CSS variable names (`--font-inter`, `--font-manrope`, etc.)
2. **`globals.css`** maps these to semantic variables (`--font-ui`, `--font-ui-display`) based on locale
3. **`tailwind-preset.ts`** exposes `font-sans`, `font-display`, `font-mono` that resolve through the semantic variables
4. **Components** use `font-sans` / `font-display` and get the correct font automatically for English or Persian

---

## Notes

- The legacy `--font-ibm-plex-sans` variable is retained in frontend for backward compatibility with any components still referencing it.
- Both apps share `node_modules` (webapp symlinks to frontend's), so font files are downloaded once.
- In sandboxed/offline environments, `next build` may fail due to network restrictions when fetching Google Fonts. Use `next dev` or grant network access to `fonts.googleapis.com` and `fonts.gstatic.com`.

---

**Verified:** 2026-10-14T18:21  
**Co-Authored-By:** Claude <noreply@anthropic.com>
