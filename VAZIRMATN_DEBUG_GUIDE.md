# Vazirmatn Font Loading — Debugging Guide

**Issue:** Vazirmatn font is not loading in webapp or frontend  
**Date:** 2026-11-11

---

## Changes Made (Latest)

### Vazirmatn Font Configuration

**Both `webapp/app/layout.tsx` and `frontend/app/layout.tsx`:**

```typescript
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap"
  // Removed explicit weights — Vazirmatn is a variable font with all weights included
});
```

**CSS (both `webapp/app/globals.css` and `frontend/app/globals.css`):**

```css
html[data-locale="fa"] {
  --font-ui: var(--font-vazirmatn), system-ui, sans-serif;
  --font-ui-display: var(--font-vazirmatn), system-ui, sans-serif;
}

html[data-locale="fa"] body {
  font-family: var(--font-vazirmatn), system-ui, sans-serif;
}

html[data-locale="fa"] .font-display {
  font-family: var(--font-vazirmatn), system-ui, sans-serif;
}
```

---

## Why Vazirmatn Might Not Be Loading

### 1. Variable Font vs Weights
Vazirmatn is a **variable font** — it includes all weights by default. Specifying explicit weights may cause loading issues with Next.js fonts. The updated configuration removes explicit weights.

### 2. Google Fonts CDN Issue
Vazirmatn might not be available on the Google Fonts CDN due to:
- Network restrictions in sandbox
- CDN caching or availability
- Incorrect subset name

### 3. CSS Variable Not Applied to `<html>`
The `--font-vazirmatn` variable needs to be present on the `<html>` root element. Check the body's className includes the Vazirmatn variable:

```typescript
// In layout.tsx body:
className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} ${vazirmatn.variable} font-sans`}
// Should output: --font-ibm-plex-sans --font-jetbrains-mono --font-vazirmatn font-sans
```

---

## Step-by-Step Debugging

### Step 1: Check Font Variables Are Applied to HTML

Open browser DevTools and run:

```javascript
// Check if CSS variables are defined
const html = document.documentElement;
const style = getComputedStyle(html);

console.log("--font-ibm-plex-sans:", style.getPropertyValue('--font-ibm-plex-sans'));
console.log("--font-vazirmatn:", style.getPropertyValue('--font-vazirmatn'));
console.log("--font-jetbrains-mono:", style.getPropertyValue('--font-jetbrains-mono'));
```

**Expected output:**
```
--font-ibm-plex-sans: __IBM_Plex_Sans_XXXX, __IBM_Plex_Sans_Fallback_XXXX
--font-vazirmatn: __Vazirmatn_XXXX, __Vazirmatn_Fallback_XXXX
--font-jetbrains-mono: __JetBrains_Mono_XXXX, __JetBrains_Mono_Fallback_XXXX
```

If any are empty or undefined:
- The font didn't load from Next.js
- Check Network tab for `.woff2` files
- Look for errors in console

### Step 2: Check Data-Locale Attribute

```javascript
// Verify data-locale is set
console.log("data-locale:", document.documentElement.dataset.locale);
// Should output: data-locale: en or fa
```

### Step 3: Check CSS Rules Are Applied

```javascript
// For English:
console.log(getComputedStyle(document.body).fontFamily);
// Should contain: IBM Plex Sans

// Switch to Persian first, then:
console.log(getComputedStyle(document.body).fontFamily);
// Should contain: Vazirmatn
```

### Step 4: Check Network Requests

1. Open DevTools → Network tab
2. Filter by "Font" type
3. Look for:
   - `ibmplexsans*.woff2` — should load ✅
   - `vazirmatn*.woff2` — check if loading ✅
   - `jetbrainsmono*.woff2` — should load ✅

**If Vazirmatn is NOT loading:**
- Check if request appears in Network tab
- If it appears but returns 404 → Google Fonts CDN issue
- If it doesn't appear → Font variable wasn't applied to body

### Step 5: Check Console Errors

Look for errors like:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

This indicates the CDN URL is wrong or the font isn't available.

---

## Alternative: Local Font File

If Vazirmatn won't load from Google Fonts CDN, use a local font file:

### Option A: Download and Import

1. Download Vazirmatn from [Google Fonts](https://fonts.google.com/specimen/Vazirmatn)
2. Place in `webapp/public/fonts/vazirmatn.woff2`
3. Define in CSS:

```css
@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/vazirmatn.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

Then remove from Next.js imports and reference by name:

```css
html[data-locale="fa"] {
  --font-ui: 'Vazirmatn', system-ui, sans-serif;
}
```

### Option B: Use Font.js Import

Some fonts work better with direct import:

```typescript
import localFont from 'next/font/local';

const vazirmatn = localFont({
  src: [
    {
      path: '../public/fonts/Vazirmatn-Regular.woff2',
      weight: '400',
    },
    {
      path: '../public/fonts/Vazirmatn-Bold.woff2',
      weight: '700',
    },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
});
```

---

## Checking Actual Rendered Fonts

### In Browser

1. Right-click any Persian text element
2. Select "Inspect" or "Inspect Element"
3. In DevTools, find the element
4. Look at "Computed" styles
5. Check `font-family` value

**Should show:**
- English: `__IBM_Plex_Sans_XXXX, ...`
- Persian: `__Vazirmatn_XXXX, ...`

**If shows:**
- `system-ui` or sans-serif → font failed to load
- Wrong font name → CSS variable mismatch

### Using getComputedStyle

```javascript
const body = document.body;
const computedStyle = getComputedStyle(body);
console.log("Body font-family:", computedStyle.fontFamily);
```

---

## CSS Cascade Verification

Check that the CSS rules are correctly cascading:

```css
/* ✅ This should be applied when data-locale="fa" */
html[data-locale="fa"] body {
  font-family: var(--font-vazirmatn), system-ui, sans-serif;
}

/* This is more specific than the global body rule below */

/* ❌ This gets overridden when data-locale is set */
body {
  /* ... other properties ... */
}
```

### CSS Specificity Order

1. **Most specific:** `html[data-locale="fa"] body` (wins)
2. **Less specific:** `html[data-locale="fa"]`
3. **Least specific:** `body`

Verify with DevTools Computed tab — it shows which rule is applied.

---

## Full Debug Checklist

Run in browser console after switching to Persian:

```javascript
console.group('🔍 Typography Debug');

// 1. Check locale attribute
console.log('✓ Locale:', document.documentElement.dataset.locale);

// 2. Check CSS variables exist
const html = getComputedStyle(document.documentElement);
console.log('✓ --font-vazirmatn:', html.getPropertyValue('--font-vazirmatn').trim() || '❌ NOT FOUND');
console.log('✓ --font-ibm-plex-sans:', html.getPropertyValue('--font-ibm-plex-sans').trim() || '❌ NOT FOUND');

// 3. Check body font-family
console.log('✓ Body font-family:', getComputedStyle(document.body).fontFamily);

// 4. Check CSS rule is applied
const faRule = getComputedStyle(document.querySelector('html[data-locale="fa"]'));
console.log('✓ [data-locale="fa"] rule active:', faRule.fontFamily || '❌ NOT ACTIVE');

console.groupEnd();
```

Expected output:
```
✓ Locale: fa
✓ --font-vazirmatn: __Vazirmatn_XXXX, __Vazirmatn_Fallback_XXXX
✓ --font-ibm-plex-sans: __IBM_Plex_Sans_XXXX, __IBM_Plex_Sans_Fallback_XXXX
✓ Body font-family: __Vazirmatn_XXXX, __Vazirmatn_Fallback_XXXX, system-ui, sans-serif
✓ [data-locale="fa"] rule active: (should match body font-family)
```

---

## Network Inspection

In DevTools → Network:

1. Filter by "Font"
2. Look for requests containing "vazir"
3. Check Response headers:
   - Status: 200 ✅ (not 404 or other error)
   - Content-Type: `font/woff2`

4. If 404: The font isn't available on Google Fonts CDN
5. If timing shows long delay: Network latency or CDN issue

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `system-ui` displayed | CSS variable not found | Verify `--font-vazirmatn` exists on `<html>` |
| Wrong font in Persian | CSS selector not matching | Check `data-locale="fa"` is set |
| Font doesn't load | Network blocked | Use local font file instead |
| FOUT (flash) | Font loading slow | Ensure `display: "swap"` is set |
| Weights wrong | Variable font not recognized | Verify Vazirmatn is loaded as variable font |

---

## Next Steps

1. **Start dev server:**
   ```bash
   cd webapp && npm run dev
   ```

2. **Switch to Persian** using language toggle

3. **Run debug checklist** above in browser console

4. **Check Network tab** for font file requests

5. **Inspect elements** and verify computed font-family

6. **Report findings:**
   - Which step fails?
   - What does console show?
   - Are `.woff2` files in Network tab?
   - Any errors?

---

## If Vazirmatn Still Won't Load

**Try local font file:**

```bash
# Create fonts directory
mkdir -p webapp/public/fonts

# Download Vazirmatn WOFF2 file from Google Fonts and place there
# Then update layout.tsx to use localFont
```

This bypasses CDN issues entirely.
