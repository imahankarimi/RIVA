# RIVA — Logo Usage Guide

**Version 1.0 · November 2026**
The production standard for the RIVA mark. The identity is unchanged; this guide makes its execution exact.

A designed 6-page PDF of this guide is included as `RIVA-Logo-Usage-Guide.pdf`.

---

## 1. The identity

RIVA's symbol is a single continuous ribbon folded into a diamond aperture. The wordmark is a geometric monoline sans, drawn as outlines — not set in a font.

| Asset | Size (units) | Ratio |
|---|---|---|
| Primary lockup | 587.4 × 147 | 4.076 : 1 |
| Symbol | 202.8 × 147 | 1.380 : 1 |
| Wordmark | 356.7 × 109.3 | 3.264 : 1 |

The ribbon is expressed as **negative space**, so the mark holds in one colour. This is the same treatment already used by RIVA's dark lockup, favicon and app icon.

**Construction:** every symbol edge resolves to 0° or 45°; the symbol has 11 nodes; the wordmark shares one cap line, one baseline and uniform stem widths. The R bowl keeps its original tangencies.

---

## 2. Colour

The logo is monochrome in both modes.

| Token | Hex | Role |
|---|---|---|
| Deep Navy | `#101C2C` | Primary brand token (`--c-signal-500`); light-mode logo |
| Pure White | `#FFFFFF` | Dark-mode logo |
| Warm White | `#F7F7F3` | Recommended light surface |
| Deep Navy | `#101C2C` | Recommended dark surface |
| Steel Blue | `#71879B` | Secondary / charts — **not** used in the logo |
| Slate Blue | `#607D94` | Muted chrome — **not** used in the logo |

**Contrast:** Deep Navy on Warm White **15.97:1**; Deep Navy on Pure White **17.15:1**; Pure White on Deep Navy **17.15:1**.

Do not recolour the mark, introduce a third logo colour, add the steel-blue ribbon tint, or place the logo on gradients, photography or surfaces below 4.5:1.

---

## 3. Proportion and clear space

| Measure | Value | Relationship |
|---|---|---|
| Symbol height | 147.0 | master |
| Symbol width | 202.8 | 1.380 × symbol |
| Cap height | 109.3 | 0.743 × symbol |
| Symbol → wordmark | 27.9 | 0.190 × symbol |
| Lockup width | 587.4 | 4.076 : 1 |
| Clear space | 73.5 | 0.5 × symbol, all sides |

**Clear space:** keep 0.5 × the symbol height free on all sides. For the full lockup, that is 73.5 units around the 587.4 × 147 artboard. Nothing — text, edges, other marks — enters that zone.

**Minimum sizes**

| Asset | Digital | Print |
|---|---|---|
| Primary lockup | 108 px wide (≈27 px tall) | 30 mm wide |
| Symbol | 36 px high | 10 mm high |
| Favicon | 16 px | — |
| App icon master | 1024 × 1024 | — |

Never re-space the symbol and wordmark, change the cap height, or scale on one axis.

---

## 4. Application

**Light surfaces** — sidebar, top bar, documents, light landing pages: the `#101C2C` lockup on Warm White or white.

**Dark surfaces** — dark UI, hero sections, app splash, print on dark stock: the `#FFFFFF` lockup on Deep Navy.

### App icons

| Platform | Master | Rules |
|---|---|---|
| iOS | 1024 × 1024 | Square, opaque, **no rounded corners**; iOS applies the mask. 180 px Apple Touch included. |
| Android adaptive | 432 × 432 (108 dp @ 4×) | Separate foreground and background; symbol inside the 66 dp safe zone. |
| PWA | 192 / 512 / 1024 | `purpose: any`; 512 maskable stays inside the 40% safe radius. |
| Favicon | 16 / 32 / 48 | Dedicated tighter artwork; ICO and SVG. |
| Desktop | 256–1024 | PNG + multi-size ICO. |

Do not bake rounded corners into iOS artwork, stretch an icon to fill a slot, or put the horizontal lockup inside an app icon.

---

## 5. Incorrect usage

| Don't | Why |
|---|---|
| Recolour the mark | Only `#101C2C` or `#FFFFFF` are approved. |
| Add shadow, bevel, glow or gradient | The identity is flat and precise. |
| Distort or stretch | The lockup has one aspect ratio. |
| Rotate or skew | The lockup is always horizontal. |
| Place on a pattern or photo | The mark needs a quiet, flat ground. |
| Crop or crowd the clear space | The 0.5 × symbol margin is mandatory. |
| Re-type or re-space the wordmark | The letterforms are fixed outlines. |

---

## 6. File formats

| Format | Use it for | Technical note |
|---|---|---|
| SVG | Web, product UI, design systems | Transparent, editable paths, explicit fill, one colour, no fonts. |
| PDF | Print, documents, supplier hand-off | Vector; exact artboard. Dark file carries a Deep Navy page (PDF has no transparency). |
| EPS | Print production, Illustrator exchange | PostScript outlines; open directly in Illustrator. |
| PNG | Raster UI, slides, email | Transparent RGBA; 1× / 2× / 3× plus high-resolution. |
| WebP | Web performance | Lossless, alpha preserved. |
| ICO | Windows, browser favicon | Multi-size 16–256 px. |
| AI | Native Illustrator editing | **Not supplied** — open the PDF/EPS/SVG in Illustrator and save as `.ai`. |

Every file is a real, validated asset. SVG, PDF and EPS share the same master geometry. Raster exports are uniform downscales and are never stretched.

---

*RIVA — Records. Intelligence. Visibility. Automation.*
