# RIVA Liquid Glass - Restart Instructions

## Problem Diagnosis

The Liquid Glass implementation is **code-complete** but not visible because:

1. ✅ CSS classes exist in `frontend/app/globals.css` (lines 308+)
2. ✅ AuthScreen component uses the classes (`liquid-glass-auth-page`, etc.)
3. ✅ Design tokens defined (`--liquid-bg-dark-*`, `--lens-*`)
4. ⚠️ **Next.js dev server is using stale cached CSS** (cache dated Oct 2, changes made Oct 15)

## Root Cause

Next.js dev server caches compiled CSS. Major `globals.css` changes (694 lines added) require a **hard restart** to clear the cache and recompile.

## Fix: Restart Dev Server

### Frontend (RIVA Desktop - port 3000)

```bash
# Stop the current dev server (Ctrl+C in its terminal)

# Clear Next.js cache
cd frontend
rm -rf .next

# Restart dev server
npm run dev
```

**Open:** http://localhost:3000/login

### Webapp (RIVA App - port 3001)

```bash
# Stop the current dev server (Ctrl+C in its terminal)

# Clear Next.js cache
cd webapp
rm -rf .next

# Restart dev server
npm run dev
```

**Open:** http://localhost:3001/login

## What You Should See After Restart

### Login Page Visual Changes:

1. **Dark gradient background** - Animated floating orbs (Deep Navy, Steel Blue, Slate Blue gradients)
2. **Frosted glass panel** - Translucent centered card with:
   - Backdrop blur (20px)
   - White border with subtle glow
   - Reflective top edge highlight
   - Smooth entrance animation
3. **Brand mark** - Signal-colored circular icon with gradient
4. **Glass inputs** - Translucent form fields with hover/focus glass effects
5. **Liquid button** - Signal gradient button with elevation on hover
6. **Smooth animations** - liquidRise entrance, floating background orbs

### If Still Not Visible

1. **Hard refresh** - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) in browser
2. **Check browser console** - Look for CSS loading errors
3. **Verify correct port** - Frontend is 3000, Webapp is 3001
4. **Check you're on `/login`** - Not `/` (which redirects to AuthGate)

## Files Changed

- `frontend/components/auth/AuthScreen.tsx` - Complete Liquid Glass redesign
- `frontend/app/globals.css` - +694 lines (Liquid Glass styles)
- `webapp/components/auth/AuthScreen.tsx` - Same changes + routing fix
- `webapp/app/globals.css` - +690 lines (Liquid Glass styles)

## Production Deployment

Both apps will show Liquid Glass after deployment:
- Frontend: `https://riva-snowy-beta.vercel.app/login`
- Webapp: `https://riva-app-inky.vercel.app/login`

Vercel automatically rebuilds and clears caches on deploy.

## Technical Details

- Glass material: `backdrop-filter: blur(20px) saturate(150%)`
- Background: Layered radial gradients with CSS animations (float 20s, pulse 15s)
- Pointer tracking: `liquidLens.ts` installed in both apps' Providers
- Design tokens: All colors via `design-system/tokens.css`
- Animations: RIVA motion tokens (`--dur-slow`, `--ease-riva`)
