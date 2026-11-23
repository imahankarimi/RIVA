# RIVA — Extended Raster Exports

This folder contains the high-resolution PNG and lossless WebP editions of the three logo assets. The 1×/2×/3× PNG sets for daily use live beside each logo in `01`–`03`; this folder provides larger sizes and WebP.

## Naming

`riva-{asset}-{mode}-{width}.{png|webp}`

| Folder | Widths | Height |
|---|---|---|
| `Primary-Logo/{Light,Dark}` | 2400 / 3600 | 600 / 900 |
| `Symbol/{Light,Dark}` | 1024 / 1536 | 742 / 1113 |
| `Wordmark/{Light,Dark}` | 2400 / 3600 | 736 / 1104 |

Every export is a uniform downscale of the vector master. Nothing is stretched.

## Which format?

- **PNG** — maximum compatibility; transparent RGBA; use for docs, slides, email, legacy UI.
- **WebP** — lossless with alpha; smaller than PNG on the web; use with a PNG fallback if you support very old browsers.

The dark assets are white artwork on transparent. Place them on a dark surface; they will be invisible on white by design.
