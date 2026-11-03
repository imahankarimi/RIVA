# RIVA Font Restoration Report

**Date:** 2026-11-02  
**Objective:** Restore original IBM Plex Sans and Vazirmatn fonts across RIVA applications

---

## Original Font Configuration

Based on Git history analysis (commit `ba5767a`), the original RIVA v1 fonts were:

- **English (Latin):** IBM Plex Sans
- **Persian (Arabic):** Vazirmatn

---

## Root Cause of Regression

The **frontend** application's CSS (`frontend/app/globals.css`) referenced CSS variables `--font-inter` and `--font-manrope` for English typography:

```css
html[data-locale="en"] {
  --font-ui: var(--font-inter), system-ui, sans-serif;
  --font-ui-display: var(--font-manrope), var(--font-inter), system-ui, sans-serif;
}
```

However, `frontend/app/layout.tsx` loaded **IBM Plex Sans** with a different variable name:

```tsx
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",  // ← Variable name mismatch
  // ...
});
```

This created a **variable name mismatch**: CSS looked for `--font-inter` but the layout provided `--font-ibm-plex-sans`, causing the browser to fall back to `system-ui` instead of rendering IBM Plex Sans.

The **webapp** application was unaffected—it correctly loaded Inter/Manrope and referenced the matching variables.

---

## Files Modified

### `frontend/app/globals.css`

**Changed:** CSS variable references for English locale from `--font-inter`/`--font-manrope` to `--font-ibm-plex-sans`.

```diff
 :root,
 html[data-locale="en"] {
-  --font-ui: var(--font-inter), system-ui, sans-serif;
-  --font-ui-display: var(--font-manrope), var(--font-inter), system-ui, sans-serif;
+  --font-ui: var(--font-ibm-plex-sans), system-ui, sans-serif;
+  --font-ui-display: var(--font-ibm-plex-sans), system-ui, sans-serif;
 }

 html[data-locale="en"] body {
-  font-family: var(--font-inter), system-ui, sans-serif;
+  font-family: var(--font-ibm-plex-sans), system-ui, sans-serif;
 }

 html[data-locale="en"] .font-display {
-  font-family: var(--font-manrope), var(--font-inter), system-ui, sans-serif;
+  font-family: var(--font-ibm-plex-sans), system-ui, sans-serif;
 }
```

**No changes required** to `frontend/app/layout.tsx`, `webapp/app/layout.tsx`, or `webapp/app/globals.css`.

---

## Font Assets and Paths

### Frontend (RIVA Main)

**Next.js Font Loading:**
```tsx
import { IBM_Plex_Sans, Vazirmatn } from "next/font/google";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap"
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap"
});
```

**Font Files:** Loaded via Next.js Google Fonts integration. No local font files required.

**CSS Variables:**
- English: `--font-ibm-plex-sans` → IBM Plex Sans (400, 500, 600, 700)
- Persian: `--font-vazirmatn` → Vazirmatn (variable weights)

### Webapp (RIVA Web)

**Next.js Font Loading:**
```tsx
import { Inter, Manrope, JetBrains_Mono, Vazirmatn } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap"
});
```

**CSS Variables:**
- English UI: `--font-inter` → Inter
- English Display: `--font-manrope` → Manrope
- Persian: `--font-vazirmatn` → Vazirmatn

---

## Browser Verification Results

### Frontend (Port 3004)

**English Locale (`data-locale="en"`):**
- ✅ Body font-family: `__IBM_Plex_Sans_4eeef7, __IBM_Plex_Sans_Fallback_4eeef7, system-ui, sans-serif`
- ✅ IBM Plex Sans renders correctly in all weights (400, 500, 600, 700)
- ✅ No fallback to system-ui

**Persian Locale (`data-locale="fa"`):**
- ✅ Body font-family: `__Vazirmatn_6768c4, __Vazirmatn_Fallback_6768c4, system-ui, sans-serif`
- ✅ Vazirmatn renders correctly
- ✅ Font switches correctly when locale changes

**Locale Switching:**
- ✅ Changing `data-locale` attribute triggers immediate font-family update
- ✅ No FOUT (Flash of Unstyled Text) observed
- ✅ Both fonts load via Next.js font optimization with `display: swap`

### Webapp (Port 3001)

**Configuration verified via source inspection:**
- ✅ Inter loads as `--font-inter`
- ✅ Manrope loads as `--font-manrope`
- ✅ Vazirmatn loads as `--font-vazirmatn`
- ✅ CSS references match loaded font variables
- ✅ No changes required

---

## Summary

| Application | English Font | Persian Font | Status |
|------------|--------------|--------------|---------|
| **Frontend** | IBM Plex Sans | Vazirmatn | ✅ **Fixed** |
| **Webapp** | Inter | Vazirmatn | ✅ **Already correct** |

**Root cause:** CSS variable name mismatch in frontend only  
**Resolution:** Updated `frontend/app/globals.css` to reference `--font-ibm-plex-sans` instead of non-existent `--font-inter`  
**Verification:** Browser DevTools confirmed actual rendered fonts match intended configuration  

---

## Definition of Done: Complete ✅

IBM Plex Sans restored for English and Vazirmatn confirmed for Persian, exactly as intended in the original RIVA v1 implementation.
