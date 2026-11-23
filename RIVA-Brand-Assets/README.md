# RIVA — Brand Asset System

**Version 1.0 · November 2026 · For review and approval**

This is a standalone, production-ready brand asset package for **RIVA — Records, Intelligence, Visibility, Automation**. It is a precision vector reconstruction of the existing RIVA identity, not a redesign. No file in the RIVA application repository was modified, and nothing in this package is imported by the product.

---

## 1. What this package contains

| | |
|---|---|
| **Primary lockup** | Symbol + RIVA wordmark, original composition, light and dark |
| **Symbol** | The exact RIVA ribbon-diamond mark, light and dark |
| **Wordmark** | The RIVA lettering as vector outlines, light and dark |
| **App icons** | 1024 px square masters, 16–2048 px rasters, iOS, Android adaptive, PWA, favicon |
| **Vector formats** | SVG, PDF, EPS for every logo asset; editable masters |
| **Raster formats** | PNG (1×/2×/3× + high-resolution), WebP, ICO |
| **Documentation** | This README, a 6-page usage guide, a Markdown guide, colour tokens, QC report |
| **Previews** | Reference comparison, variants, icon system, light/dark UI, construction |

**Two logo colours only:**

- **Light mode** — `#101C2C` (RIVA Deep Navy, the product's primary brand token `--c-signal-500`)
- **Dark mode** — `#FFFFFF` (pure white)

Both variants use **exactly the same artwork**. Only the fill changes.

---

## 2. Reference study and how inconsistencies were resolved

The supplied references in the RIVA repository were studied before any vector was rebuilt:

- `frontend/public/brand/riva-logo.svg` — light lockup, two-tone ribbon (`#0C0D41` + `#8288A9`)
- `frontend/public/brand/riva-logo-dark.svg` — dark lockup, single-colour ribbon knockout
- `frontend/public/brand/riva-mark.svg` / `riva-mark-dark.svg` — standalone mark, two-tone
- `frontend/public/favicon.svg` — rounded-tile favicon, single-colour ribbon
- `frontend/public/icons/icon-{192,512,512-maskable}.png` — PWA icons, single-colour ribbon
- `webapp/public/*` — identical copies of the brand files
- `docs/DESIGN_SYSTEM.md` and `design-system/tokens.css` — the official product palette

Those references are **not geometrically identical**, which is the reason this package exists. Three inconsistencies were resolved using the strongest evidence:

### 2.1 Two constructions of the same symbol

The light lockup renders the ribbon as a **secondary steel-blue band** (`#8288A9`). The dark lockup, favicon and shipped PWA icons render the same ribbon as **negative space** with a fine fold line.

The brief requires exactly two monochrome variants, one colour each, with identical artwork. A two-colour ribbon cannot satisfy that. The reconstruction therefore uses the **single-colour ribbon knockout** — the construction already approved in RIVA's dark lockup, favicon and app icon — while preserving the light lockup's silhouette, fold, aperture and proportions. The mark is the same mark; it is expressed in the only form that survives one colour.

### 2.2 Two traces of the same wordmark

The light and dark references contain two separate traces of the same R, I, V and A. The dark trace is cleaner and was used as the typographic master. It was then normalised to the **primary light lockup's proportions** (cap height 109.3 against a 147 symbol) and vertically centred on the cap-height axis. No font was substituted; the letterforms remain outlines.

### 2.3 Three legacy navy values vs the official token

The logo files use `#0C0D41` (light logo), `#0B0D40` (icon source) and `#000019` (favicon / shipped PWA raster). None of these is the product's primary brand token. `docs/DESIGN_SYSTEM.md` and `design-system/tokens.css` define the official primary as **Deep Navy `#101C2C` (`--c-signal-500`)**.

The brief asked for the exact primary colour from the product's brand palette, so **`#101C2C` is the official logo colour in this package**. The legacy values are retired for logo production. If the owner prefers the legacy `#0C0D41` value instead, it is a one-token substitution across all vector sources.

**Primary composition master:** the light lockup — symbol height 147, cap height 109.3, gap 27.9, overall 587.4 × 147 (4.076 : 1).

---

## 3. Geometry and proportions

All values are in lockup units. 1 unit = 1 pt in the PDF/EPS files.

| Measure | Value | Relationship |
|---|---|---|
| Symbol height | **147.0** | master unit |
| Symbol width | **202.8** | 1.380 × symbol height |
| Cap height | **109.3** | 0.743 × symbol height |
| Symbol → wordmark gap | **27.9** | 0.190 × symbol height |
| Lockup width | **587.4** | 4.076 : 1 |
| Clear space | **73.5** | 0.5 × symbol height, all sides |

**Construction rules**

- Every symbol edge resolves to exactly **0° or 45°**.
- The symbol is an **11-node** closed contour; 8 collinear nodes were removed from the traced source.
- The wordmark shares one cap line, one baseline and uniform stem widths.
- The R bowl keeps its original Bézier tangencies; the V and A are symmetric with the original flat terminals.
- The light and dark files are geometrically identical.

**Corrections made (no identity change)**

1. Snapped all symbol edges to exact 0°/45° (maximum point displacement 1.89 units on a 140-unit height — 1.35%).
2. Removed 8 collinear anchor points without changing the silhouette.
3. Rebuilt the I as a true rectangle; aligned R, I, V and A to a common cap line and baseline.
4. Made the V symmetric with its flat bottom; made the A symmetric with a clean flat apex and crossbar.
5. Normalised stem widths and removed residual bitmap-trace jitter.
6. Removed duplicate/irregular joins and excess anchor points.
7. Normalised the lockup to the primary reference's proportions.
8. Encoded the ribbon as negative space for single-colour production.

---

## 4. Package map

```
RIVA-Brand-Assets/
├── 01-Primary-Logo/
│   ├── Light/   riva-logo-light.svg · .pdf · .eps · .png · @2x.png · @3x.png
│   └── Dark/    riva-logo-dark.svg  · .pdf · .eps · .png · @2x.png · @3x.png
├── 02-Symbol/
│   ├── Light/   riva-symbol-light.svg · .pdf · .eps · .png · @2x.png · @3x.png
│   └── Dark/    riva-symbol-dark.svg  · .pdf · .eps · .png · @2x.png · @3x.png
├── 03-Wordmark/
│   ├── Light/   riva-wordmark-light.svg · .pdf · .eps · .png · @2x.png · @3x.png
│   └── Dark/    riva-wordmark-dark.svg  · .pdf · .eps · .png · @2x.png · @3x.png
├── 04-App-Icons/
│   ├── Light/   1024 px master SVG + 16→2048 px PNGs
│   ├── Dark/    1024 px master SVG + 16→2048 px PNGs
│   ├── iOS/     AppIcon 1024 and 180, light and dark, square and opaque
│   ├── Android/ adaptive foreground + background, SVG and 432/1024 px PNGs
│   ├── PWA/     icon-192, icon-512, icon-1024, icon-512-maskable, site.webmanifest
│   └── Desktop/ 256/512/1024 px PNGs + multi-size ICO, light and dark
├── 05-Favicons/
│   ├── favicon.svg · favicon-light.svg
│   ├── favicon-{dark,light}-{16,32,48,256}.png
│   ├── favicon.ico (16/32/48)
│   └── apple-touch-icon.png · apple-touch-icon-dark.png
├── 06-Raster-Exports/
│   ├── Primary-Logo/{Light,Dark}/  2400 and 3600 px PNG + lossless WebP
│   ├── Symbol/{Light,Dark}/        1024 and 1536 px PNG + lossless WebP
│   └── Wordmark/{Light,Dark}/      2400 and 3600 px PNG + lossless WebP
├── 07-Vector-Masters/
│   ├── RIVA-master.svg             all three assets on one editable artboard
│   ├── RIVA-lockup-master.svg · .pdf · .eps
│   ├── RIVA-symbol-master.svg · .pdf · .eps
│   ├── RIVA-wordmark-master.svg · .pdf · .eps
│   └── AI-FORMAT-NOTE.md
├── 08-Brand-Guidelines/
│   ├── RIVA-Logo-Usage-Guide.pdf   6-page A4 usage guide
│   ├── RIVA-Logo-Usage-Guide.md    Markdown version
│   ├── RIVA-Brand-Tokens.css       standalone colour tokens
│   ├── RIVA-Brand-Tokens.json
│   └── source/guidelines.html      editable source of the PDF
├── 09-Previews/
│   ├── 01-reference-vs-reconstruction.png
│   ├── 02-logo-variants.png
│   ├── 03-app-icon-system.png
│   ├── 04-ui-light.png
│   ├── 05-ui-dark.png
│   └── 06-construction-and-clearspace.png
├── QUALITY-CONTROL.md
├── README.md
└── RIVA-Brand-Assets.zip
```

Each of `04`, `05`, `06` and `09` includes a short README with platform-specific guidance.

### File naming

- `riva-logo-{light|dark}` — full horizontal lockup
- `riva-symbol-{light|dark}` — symbol only
- `riva-wordmark-{light|dark}` — wordmark only
- `riva-app-icon-{light|dark}-{size}.png` — app icon raster
- `riva-logo-light@2x.png` — 2× raster of the 1200 px base (2400 px)
- `RIVA-*-master` — neutral black vector masters for editing

---

## 5. Format guide

| Format | Use it for | Notes |
|---|---|---|
| **SVG** | Web, product UI, design systems, most flexible | Transparent, editable paths, explicit `fill`, no CSS dependency, explicit `viewBox`, no fonts, no external references. |
| **PDF** | Print, documents, supplier hand-off | Vector (no images, no fonts). Exact artboard in points. Light files have a white page; dark files carry a Deep Navy page because PDF has no transparency. |
| **EPS** | Print production, Illustrator exchange | PostScript outlines, `eofill`, `BoundingBox` in points. Light has a white background; dark has a Deep Navy background. |
| **PNG** | Raster UI, slides, email, docs | RGBA with alpha; logos are transparent. Uniform downscales only — never stretched. |
| **WebP** | Web performance | Lossless, alpha preserved, identical geometry to PNG. |
| **ICO** | Windows, browser favicon | Multi-size 16–256 px. |
| **AI** | Native Illustrator editing | **Not supplied.** Adobe Illustrator was not available. Open the supplied PDF, EPS or SVG in Illustrator and save as `.ai`; all paths are editable and font-independent. |

**Raster sizes**

- Lockup: 1200 × 300 (1×), 2400 × 600 (2×), 3600 × 900 (3×); 2400/3600 also in `06-Raster-Exports` with WebP.
- Symbol: 512 × 371 (1×), 1024 × 742 (2×), 1536 × 1113 (3×); 1024/1536 also in `06`.
- Wordmark: 1200 × 368 (1×), 2400 × 736 (2×), 3600 × 1104 (3×); 2400/3600 also in `06`.
- App icons: 16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024, 2048.

---

## 6. Usage rules

### Light mode
Use the `#101C2C` artwork on **Warm White `#F7F7F3`** or pure white. Contrast: **15.97 : 1** on Warm White, **17.15 : 1** on white.

### Dark mode
Use the `#FFFFFF` artwork on **Deep Navy `#101C2C`** or near-black. Contrast: **17.15 : 1**.

### Clear space
Keep **0.5 × symbol height (73.5 units)** free on all sides. For the full lockup this is 73.5 units around the 587.4 × 147 artboard.

### Minimum sizes
- Lockup: **108 px wide** (≈27 px tall) digital; **30 mm wide** print.
- Symbol: **36 px high** digital; **10 mm high** print.
- Favicon: **16 px**, using the dedicated favicon artwork.
- App icon master: **1024 × 1024**, square, no baked corners.

### App icons
- **iOS:** 1024 px square, opaque, no rounded corners. iOS applies its own mask. A 180 px Apple Touch icon is included.
- **Android adaptive:** separate foreground and background layers. The symbol sits inside the 66 dp safe zone on a 108 dp canvas.
- **PWA:** 192/512 any-purpose icons plus a 512 maskable icon. Content stays inside the 40% safe radius.
- **Favicon:** dedicated 16/32/48 px artwork with a tighter mark; ICO and SVG supplied.

### Never
Recolour the mark, add gradients/shadows/bevels, stretch or rotate it, outline it, re-type it, re-space it, crop the clear space, or place it on a busy or low-contrast background.

---

## 7. Technical specifications

| Asset | viewBox | Native size |
|---|---|---|
| Primary lockup | `0 0 587.435 147` | 587.435 × 147 |
| Symbol | `0 0 202.819 147` | 202.819 × 147 |
| Wordmark | `0 0 356.716 109.3` | 356.716 × 109.3 |
| App icon master | `0 0 1024 1024` | 1024 × 1024 |
| Favicon | `0 0 64 64` | 64 × 64 |

- No `<image>`, no `@font-face`, no CSS classes, no external links, no editor metadata in the logo SVGs.
- Logo fills are explicit: `#101C2C` or `#FFFFFF`.
- Every SVG includes a `<title>` for accessibility.
- The wordmark is outlined; opening the files never requires an installed font.
- Icons are square; the favicon's rounded tile is a favicon-specific treatment, not a baked iOS corner.
- Dark PDF/EPS carry a Deep Navy page because those formats have no alpha channel.

---

## 8. Quality control

**Silhouette fidelity against the existing mono reference**

| Check | Result |
|---|---|
| Symbol IoU | **96.2%** |
| Symbol ink within 1 px | **98.1%** |
| Symbol ink within 5 px | **99.4%** |
| Symbol mean boundary distance | **0.12 px** |
| Wordmark IoU | **94.0%** |
| Wordmark ink within 1 px | **96.4%** |
| Wordmark ink within 5 px | **99.5%** |
| Wordmark mean boundary distance | **0.49 px** |

The residual difference is deliberate geometric cleanup: 45° snapping, collinear-node removal, cap/baseline alignment, symmetric V/A and uniform stems. It is not a change of character.

**Validation performed**

- SVG: XML parse, explicit `viewBox`, no raster/external dependencies, no missing fills.
- PDF: 1 page each, exact artboard, `pdfimages -list` confirms **zero raster images**.
- EPS: valid EPSF 3.0 headers, `BoundingBox`/`HiResBoundingBox`, `eofill`, `showpage`, `%%EOF`.
- PNG: RGBA, transparent logos, opaque iOS icons, exact declared dimensions, uniform scaling.
- WebP: opens, alpha preserved, lossless.
- ICO: multi-size 16/32/48 and 16–256 for desktop.
- ZIP: integrity-tested after packaging.

A detailed QC report is in `QUALITY-CONTROL.md`.

---

## 9. Known limitations

1. **No native `.ai` file.** Adobe Illustrator was not available in this environment. A genuine Illustrator file cannot be fabricated; renaming a PDF to `.ai` would be misleading. The PDF, EPS and SVG masters are fully editable and font-independent. See `07-Vector-Masters/AI-FORMAT-NOTE.md`.
2. **PDF/EPS have page backgrounds.** PDF and EPS do not support transparency. Light files use a white page; dark files use a Deep Navy page. The SVGs remain transparent.
3. **Colour normalisation.** The reference logo files used `#0C0D41` / `#0B0D40` / `#000019`; this package uses the documented product token `#101C2C`. If the legacy value is required, it is a single-token substitution.
4. **The steel ribbon is retired as a colour.** The single-colour brief makes a second hue impossible. The ribbon is preserved as negative space — the same treatment as RIVA's existing dark/favicon artwork.
5. **No integration.** Nothing here is wired into the RIVA apps, manifests, themes, CSS or imports. Review and approval only.
6. **Pre-existing working-tree changes.** The RIVA repository already contained unrelated uncommitted theme/landing changes before this task (timestamps predate this session). They were observed and left untouched; see `QUALITY-CONTROL.md §9`.

---

## 10. Recommended next step

1. Review `09-Previews/01-reference-vs-reconstruction.png` and the two UI previews.
2. Review `08-Brand-Guidelines/RIVA-Logo-Usage-Guide.pdf`.
3. Confirm the official blue (`#101C2C`) and the single-colour ribbon treatment.
4. If approved, integrate in a separate task — replacing the brand files, favicons, PWA manifest icons and app-icon sources, without changing any layout or design tokens.

---

*RIVA — Records. Intelligence. Visibility. Automation.*
