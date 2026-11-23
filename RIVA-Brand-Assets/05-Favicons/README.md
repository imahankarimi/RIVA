# RIVA — Favicon Package

The favicon uses a dedicated, tighter crop of the RIVA symbol on a rounded tile so it remains recognisable in a browser tab. It is the same symbol as the app icon, not a different mark.

## Files

| File | Size | Use |
|---|---|---|
| `favicon.svg` | 64 × 64 | Modern browsers (dark tile) |
| `favicon-light.svg` | 64 × 64 | Light-tab variant |
| `favicon-dark-16/32/48.png` | 16/32/48 | PNG fallbacks (dark) |
| `favicon-light-16/32/48.png` | 16/32/48 | PNG fallbacks (light) |
| `favicon-dark-256.png` | 256 | Source for the ICO |
| `favicon.ico` | 16/32/48 | Legacy browsers, Windows |
| `apple-touch-icon.png` | 180 | iOS home screen, light |
| `apple-touch-icon-dark.png` | 180 | iOS home screen, dark |

## Recommended HTML

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

For a light-default product, point `favicon.svg` and `apple-touch-icon.png` at the light variants; for a dark-default product, use the dark ones. Both are supplied.

## Notes

- The rounded tile is a favicon-specific treatment; it is **not** a baked iOS corner. App icon masters remain square.
- At 16 px, the fold line may resolve to a single pixel — this is expected and the mark remains recognisable.
- Do not place the full RIVA lockup in a favicon slot.
