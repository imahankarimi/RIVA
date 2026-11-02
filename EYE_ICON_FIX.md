# Eye Icon Overflow Fix - Change Password Section

## Date
2026-11-02

## Bug Description
The eye (show/hide password) icon inside the password input fields in Settings → Profile → Change Password was incorrectly positioned, appearing to overflow outside its intended area.

## Root Cause Analysis

The issue was caused by the `glass-lens` class applied to the eye icon buttons. This class includes:

1. **`overflow: hidden`** - Clips content and pseudo-elements
2. **Pseudo-elements (::before, ::after)** - Extend beyond button boundaries with gradients and shadows
3. **Hover transforms** - `translateY(-1px) scale(1.01)` causes position shifts
4. **Positioning mismatch** - Button used `end-2.5` while input used `pe-11`, creating spacing issues

### Code Comparison

**Settings page (broken):**
```tsx
<Input className="pe-11" />
<button className="glass-lens absolute end-2.5 ...">
```

**Reset password page (working):**
```tsx
<Input className="pe-10" />
<button className="absolute end-2 ...">
```

**Auth screen (working):**
```tsx
<input className="pe-10" />
<button className="absolute end-3 ...">
```

The working implementations do NOT use `glass-lens` on the eye icon buttons.

## Fix Applied

### File Changed
- `frontend/app/(app)/settings/page.tsx`

### Changes Made

1. **Removed `glass-lens` class** from both eye icon buttons (current password and new password)
2. **Adjusted positioning** from `end-2.5` to `end-2` for consistency
3. **Adjusted input padding** from `pe-11` to `pe-10` for proper spacing

### Before (lines 167-175):
```tsx
<Input className="pe-11" />
<button className="glass-lens absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-faint hover:text-ink transition-colors">
  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</button>
```

### After (lines 167-175):
```tsx
<Input className="pe-10" />
<button className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-faint hover:text-ink transition-colors">
  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
</button>
```

Same fix applied to the "New Password" field (lines 181-196).

## Verification

### Code Quality
✅ ESLint: No warnings or errors
✅ Pattern consistency: Now matches reset-password.tsx and AuthScreen.tsx

### Affected Fields
- Current Password input (line 160-176)
- New Password input (line 181-197)
- Confirm Password input (no eye icon, unchanged)

### Positioning Calculation
- Input padding-end: `pe-10` = 2.5rem = 40px
- Button position: `end-2` = 0.5rem = 8px from edge
- Button padding: `p-1.5` = 0.375rem = 6px
- Icon size: 16px
- Total button width: 16px + (6px × 2) = 28px
- Available space: 40px - 8px = 32px ✅ (4px clearance)

### RTL Support
✅ Uses logical properties (`end-*`, `pe-*`) - works in both LTR and RTL

### Dark Mode
✅ Uses design tokens (`text-ink-faint`, `hover:text-ink`) - works in both themes

## Testing Recommendations

1. Navigate to Settings → Profile → Change Password
2. Verify eye icons in both password fields are properly positioned
3. Test hover states on eye icons
4. Toggle password visibility in both fields
5. Test in both light and dark mode
6. Test in both English (LTR) and Persian (RTL) layouts
7. Test on mobile (375px width)

## Design System Compliance

The fix aligns with RIVA's design system principles:
- Removes inappropriate use of `glass-lens` (should be navigation-only per DESIGN_SYSTEM.md)
- Matches established patterns in other password inputs
- Maintains accessibility (aria-label, hover states, transitions)
- Uses logical CSS properties for RTL support

## Related Files
- `frontend/app/(app)/settings/page.tsx` - Fixed
- `frontend/app/reset-password/page.tsx` - Reference implementation
- `frontend/components/auth/AuthScreen.tsx` - Reference implementation
- `frontend/app/globals.css` - glass-lens definition

## Status
✅ **FIXED** - Eye icon buttons now render correctly without overflow or positioning issues.
