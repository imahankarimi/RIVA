# RIVA — App Icon System

All app icons use the **exact RIVA symbol**, never the horizontal lockup. Light and dark icons share identical geometry, padding and optical centring; only the colours change.

## Folder map

| Folder | Contents | Use |
|---|---|---|
| `Light/` | `riva-app-icon-light.svg` (1024 master) + PNG 16–2048 | Light home screens, light desktop shells |
| `Dark/` | `riva-app-icon-dark.svg` (1024 master) + PNG 16–2048 | Dark home screens, dark desktop shells |
| `iOS/` | `AppIcon-1024-{Light,Dark}.png`, `AppIcon-180-*`, `apple-touch-icon-180*.png` | iOS / iPadOS. RGB, opaque, square, **no baked corners** |
| `Android/` | `ic-launcher-foreground-{light,dark}-{432,1024}`, `ic-launcher-background-*` | Adaptive icon layers (foreground transparent, background solid) |
| `PWA/` | `icon-192`, `icon-512`, `icon-1024`, `icon-512-maskable`, `site.webmanifest` | Installable PWA |
| `Desktop/` | 256/512/1024 PNG + multi-size ICO, light and dark | Windows / macOS / Linux app icon |

## Platform notes

### iOS
- Source: 1024 × 1024 square, **RGB with no alpha channel**, no rounded corners.
- The OS applies the mask. Never pre-round the artwork.
- Apple Touch icon: 180 × 180, opaque.

### Android adaptive
- Canvas: 432 × 432 px = 108 dp at 4×.
- Keep the symbol inside the central **66 dp** safe zone; the OS may mask to a circle, squircle or other shape.
- Foreground PNG has transparency; background is a solid brand colour. Compose them as separate layers (`ic_launcher_foreground` + `ic_launcher_background`).

### PWA
- `icon-192.png` and `icon-512.png`: `purpose: "any"`.
- `icon-512-maskable.png`: `purpose: "maskable"`; content is inside the 40% safe radius.
- The supplied `site.webmanifest` is a reference manifest — copy the icon paths into the app manifest; do not overwrite the product's manifest in this review package.

### Favicon
Use the dedicated `05-Favicons/` artwork, not these app icons. The favicon uses a tighter mark and a rounded tile for browser-tab clarity.

## Rules

- Never stretch, squash or rotate an icon.
- Never place the horizontal lockup inside an icon.
- Never recolour outside the two approved modes.
- Use the SVG masters for any new size; do not upscale a small PNG.
