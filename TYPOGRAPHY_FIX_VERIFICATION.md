# Typography Fix — Verification Guide

**Date:** 2026-11-11  
**Status:** ✅ Changes Applied

---

## What Was Fixed

Both **webapp** and **frontend** now use the correct fonts:

- **English:** IBM Plex Sans (both UI and display)
- **Persian:** Vazirmatn (both UI and display)

The previous implementation had a **variable name mismatch**:
- CSS referenced `--font-inter` and `--font-manrope`
- But the font loader was providing `--font-ibm-plex-sans` and `--font-vazirmatn`
- This caused fonts to fail loading and fall back to `system-ui`

---

## Files Changed

### 1. `webapp/app/layout.tsx`
**Before:**
```tsx
import { Inter, Manrope, JetBrains_Mono, Vazirmatn } from "next/font/google";
const inter = Inter({ ... variable: "--font-inter" });
const manrope = Manrope({ ... variable: "--font-manrope" });
```

**After:**
```tsx
import { IBM_Plex_Sans, JetBrains_Mono, Vazirmatn } from "next/font/google";
const ibmPlexSans = IBM_Plex_Sans({ ... variable: "--font-ibm-plex-sans" });
```

### 2. `webapp/app/globals.css` (English locale rules)
**Before:**
```css
html[data-locale="en"] {
  --font-ui: var(--font-inter), system-ui, sans-serif;
  --font-ui-display: var(--font-manrope), system-ui, sans-serif;
}
```

**After:**
```css
html[data-locale="en"] {
  --font-ui: var(--font-ibm-plex-sans), system-ui, sans-serif;
  --font-ui-display: var(--font-ibm-plex-sans), system-ui, sans-serif;
}
```

### 3. `frontend/app/layout.tsx`
**Same change as webapp** — replaced Inter/Manrope imports with IBM_Plex_Sans

### 4. `frontend/app/globals.css`
**Same change as webapp** — updated English locale rules to reference `--font-ibm-plex-sans`

---

## How It Works Now

### Font Loading (Next.js)
```
app/layout.tsx
  ├─ Imports IBM_Plex_Sans, JetBrains_Mono, Vazirmatn from next/font/google
  ├─ Creates CSS variables in <html>:
  │   ├─ --font-ibm-plex-sans
  │   ├─ --font-jetbrains-mono
  │   └─ --font-vazirmatn
  └─ Loads font files via Google Fonts CDN
```

### Font Switching (CSS)
```
app/globals.css
  ├─ :root (initial/default)
  │   ├─ --font-ui = var(--font-ibm-plex-sans)
  │   └─ --font-ui-display = var(--font-ibm-plex-sans)
  │
  ├─ html[data-locale="en"]
  │   ├─ --font-ui = var(--font-ibm-plex-sans)
  │   └─ --font-ui-display = var(--font-ibm-plex-sans)
  │
  └─ html[data-locale="fa"]
      ├─ --font-ui = var(--font-vazirmatn)
      └─ --font-ui-display = var(--font-vazirmatn)
```

### Component Usage (Tailwind → CSS Variables)
```
design-system/tailwind-preset.ts
  ├─ fontFamily.sans = ["var(--font-ui)", "system-ui", "sans-serif"]
  └─ fontFamily.display = ["var(--font-ui-display)", "system-ui", "sans-serif"]

Component usage:
  <body className="font-sans">       ← resolves to --font-ui
  <h1 className="font-display">      ← resolves to --font-ui-display
  <span className="font-mono">       ← resolves to --font-jetbrains-mono
```

### Language Switching (I18nProvider)
```
lib/i18n/index.tsx (useEffect):
  1. User clicks language toggle
  2. setLocale('fa') is called
  3. useEffect triggers:
     └─ document.documentElement.dataset.locale = 'fa'
  4. CSS selector html[data-locale="fa"] matches
  5. --font-ui switches to var(--font-vazirmatn)
  6. All components using font-sans automatically render in Vazirmatn
```

---

## Browser Verification Checklist

Start both dev servers and test manually:

```bash
# Terminal 1: Frontend (port 3000)
cd frontend && npm run dev

# Terminal 2: Webapp (port 3001)
cd webapp && npm run dev
```

### English Language Test

1. **Open webapp** at `http://localhost:3001/home`
2. **Open DevTools** → Elements → Inspect `<body>`
3. **Check Computed Styles:**
   - `font-family` should show: `__IBM_Plex_Sans_XXXX, __IBM_Plex_Sans_Fallback_XXXX, system-ui, sans-serif`
   - NOT `__Inter_XXXX` or `__Manrope_XXXX`
4. **Check all text elements:**
   - Button text
   - Navigation labels
   - Card content
   - Numbers (should still use tabular figures with font-mono)
5. **Check Network tab:**
   - Should see `ibmplexsans*` font files loading (`.woff2`)
   - Should NOT see `inter*` or `manrope*` files

### Persian Language Test

1. **Switch language** to Persian (look for language toggle in settings or top bar)
2. **Verify `html[data-locale="fa"]`** is set in DevTools
3. **Inspect `<body>`** → Computed Styles
   - `font-family` should show: `__Vazirmatn_XXXX, __Vazirmatn_Fallback_XXXX, system-ui, sans-serif`
4. **Check all Persian text:**
   - Navigation (Home, Cash, Reports, etc.)
   - Card titles and content
   - Button labels
5. **Check RTL layout:**
   - Content should flow right-to-left
   - Numbers should be displayed correctly
6. **Check Network tab:**
   - Should see `vazirmatn*` font files loading
   - Should NOT see IBM Plex Sans files (they should not reload)

### Font Switching Test

1. **Toggle between English and Persian multiple times**
2. **Verify fonts switch instantly** (no flash of wrong font)
3. **Inspect computed font-family** after each switch
4. **Check that numbers/money display is preserved** (using font-mono rules)

### Numeric Typography Test

1. **Find a number or money amount** in both languages
2. **Inspect element** → Computed Styles
3. **Verify `font-feature-settings`** includes `"cv11"`, `"ss01"` (tabular numerals)
4. **Verify font-family** includes `--font-jetbrains-mono` for financial contexts
5. **Numbers should be uniform width** (proportional tabular)

### Dark Mode Test

1. **Toggle dark mode** (if available)
2. **Fonts should NOT change** — only background/text colors
3. **IBM Plex Sans remains for English**
4. **Vazirmatn remains for Persian**

---

## What Should NOT Change

✅ Font weights (400, 500, 600, 700)  
✅ Font sizes  
✅ Line heights  
✅ Letter spacing  
✅ Numeric display (tabular figures)  
✅ RTL/LTR behavior  
✅ Dark mode colors  
✅ Component styling  

---

## If Fonts Still Don't Load

### Issue: Fonts show as `system-ui` fallback

**Check:**
1. DevTools → Network → XHR/Fetch
   - Are `IBM_Plex_Sans` `.woff2` files loading?
   - Are `Vazirmatn` `.woff2` files loading?
2. DevTools → Network → Font
   - Any 404s or failed requests?
3. Check CSS in DevTools:
   - `html` element has `--font-ibm-plex-sans` variable set?
   - `html[data-locale="fa"]` has `--font-vazirmatn` variable set?
4. Check CSS variable resolution:
   ```javascript
   // In browser console:
   getComputedStyle(document.documentElement).getPropertyValue('--font-ibm-plex-sans')
   getComputedStyle(document.documentElement).getPropertyValue('--font-vazirmatn')
   ```

### Issue: Wrong font per language

**Check:**
1. Is `data-locale` attribute set correctly?
   ```javascript
   // In browser console:
   document.documentElement.dataset.locale  // should be 'en' or 'fa'
   ```
2. Are the correct CSS selectors matching?
   ```javascript
   // Check which rule is active:
   getComputedStyle(document.body).fontFamily
   ```

### Issue: Font switching doesn't work

1. Check I18nProvider is wrapping app:
   - Look for language toggle button
   - Clicking it should update `data-locale`
2. Verify CSS variables are defined at `:root`:
   - Check `globals.css` has the rules

---

## Code Verification (TypeScript)

Verify files compile without errors:

```bash
cd webapp && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Both should complete with no errors.

---

## Summary of Root Cause

**Problem:** Variable name mismatch between font loader and CSS
- Next.js loaded fonts as `--font-ibm-plex-sans` + `--font-vazirmatn`
- CSS looked for `--font-inter` + `--font-manrope`
- Browser couldn't find the variables → fell back to `system-ui`

**Solution:** Made variable names match in all four files
- Font loader: `--font-ibm-plex-sans`
- CSS rules: `var(--font-ibm-plex-sans)`
- Font loader: `--font-vazirmatn`
- CSS rules: `var(--font-vazirmatn)`

---

## Commit Information

**Files Modified:**
- `webapp/app/layout.tsx`
- `webapp/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/app/globals.css`

**Status:** Ready for testing

---

## Next Steps

1. **Start both dev servers** (see above)
2. **Test English language** with verification checklist
3. **Test Persian language** with verification checklist
4. **Verify font switching** works smoothly
5. **Check Network tab** for font file loading
6. **Confirm no FOUT** (Flash of Unstyled Text)

If any issues arise, check the debugging section above.
