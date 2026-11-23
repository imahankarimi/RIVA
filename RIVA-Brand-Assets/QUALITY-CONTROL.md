# RIVA Brand Assets — Quality Control Report

**Build:** Version 1.0 · November 2026
**Scope:** vector reconstruction and asset standardisation of the existing RIVA identity
**Status:** for owner review and approval · not integrated into the RIVA application

---

## 1. Reference inventory

The following existing files were treated as the source evidence. None was modified.

| Reference | MD5 | What it contributed |
|---|---|---|
| `frontend/public/brand/riva-logo.svg` | `5166727be2f7b942d5069e658ae1dd29` | Primary composition: symbol/cap/gap proportions, light wordmark trace |
| `frontend/public/brand/riva-logo-dark.svg` | `3d8da0e347411957c1d250e2758cdd89` | Cleanest mono construction: ribbon knockout, wordmark outline master |
| `frontend/public/brand/riva-mark.svg` | `be47487814e5c53cb03b1058fc0d6d22` | Symbol-only proportions; two-tone ribbon |
| `frontend/public/brand/riva-mark-dark.svg` | `6b7cbe0b0ea65c7b5e921c3d490a9fe2` | Symbol dark treatment |
| `frontend/public/favicon.svg` | `ea93524a0f55b2f50c5ca928bbeb0ccc` | Rounded-tile favicon treatment |
| `frontend/public/icons/icon-{192,512,512-maskable}.png` | — | Shipped PWA icon treatment (mono ribbon) |
| `webapp/public/*` | identical copies | Confirmation that both apps share the same assets |
| `docs/DESIGN_SYSTEM.md` + `design-system/tokens.css` | — | Official primary token: Deep Navy `#101C2C` |

**Reference integrity:** all five MD5 values above were re-checked after the build and are unchanged.

---

## 2. Master-source decision

The references are not identical. The resolution is documented in `README.md §2` and summarised here:

1. **Symbol** — the light lockup uses a second steel-blue colour on the ribbon; the dark lockup, favicon and shipped PWA icons express the same ribbon as negative space. The single-colour brief requires the latter. The reconstruction uses the **mono knockout construction** with the **primary light lockup's silhouette and proportions**.
2. **Wordmark** — two traces of the same letterforms exist. The **cleaner dark outline** was used as the typographic master, normalised to the primary light lockup's cap height and vertical centring. No font was substituted.
3. **Colour** — the logo files use `#0C0D41`, `#0B0D40` and `#000019`; the product's documented primary token is `#101C2C`. The package uses **`#101C2C`** as the official light-mode logo colour, per the brief and the design system.

---

## 3. Corrections applied

| # | Correction | Evidence / effect |
|---|---|---|
| 1 | Snapped every symbol edge to exact 0° or 45° | Source edges deviated by up to 3.9°; max point displacement 1.89 units on 140 (1.35%) |
| 2 | Removed 8 collinear anchor points | 19-node traced contour → 11-node engineered contour; silhouette unchanged |
| 3 | Rebuilt the I as a true rectangle | Source used two near-vertical Bézier edges with 0.4-unit drift |
| 4 | Aligned R, I, V and A to one cap line and baseline | Source caps ranged 653.56–654.26 |
| 5 | Made the V symmetric with its original flat bottom | Source arm widths differed by 1.7 units |
| 6 | Made the A symmetric with a clean flat apex and crossbar | Source apex/counter were 1.6 units off-centre |
| 7 | Preserved the R bowl curves and tangencies | No redesign of the R; only straight-segment cleanup |
| 8 | Uniform stem widths | 14.0 units at the 107-unit reference cap; scaled uniformly |
| 9 | Normalised the lockup | Symbol 147, cap 109.3, gap 27.9, total 587.4 × 147 (4.076:1) |
| 10 | Encoded the ribbon as negative space | Required by the two-colour-token rule; matches the existing mono assets |

---

## 4. Fidelity metrics

Measured on alpha silhouettes at 1800 px cap height, aligned by bounding box.

| Metric | Symbol | Wordmark |
|---|---|---|
| Intersection-over-union | **96.2%** | **94.0%** |
| Reconstructed ink within 1 px of reference | **98.1%** | **96.4%** |
| Reconstructed ink within 2 px | 98.6% | 96.9% |
| Reconstructed ink within 5 px | 99.4% | 99.5% |
| Reference ink within 1 px of reconstruction | 98.8% | 98.5% |
| Mean boundary distance | **0.12 px** | **0.49 px** |

The residual is the intended geometric cleanup (45° snapping, node removal, cap/baseline alignment, symmetric V/A, uniform stems) — not a change of character. The full-lockup silhouette differs more by design, because the ribbon is a knockout rather than a filled steel band and the composition was normalised to the primary reference.

---

## 5. Validation results

| Check | Result |
|---|---|
| SVG files parsed | **19 / 19** |
| SVG with explicit `viewBox` | 19 / 19 |
| SVG with raster `<image>` | 0 |
| SVG with external `href` | 0 |
| SVG with CSS/styles | 0 |
| SVG paths without explicit `fill` | 0 |
| Logo PDFs with raster images | **0** (verified with `pdfimages -list`) |
| Logo PDF page geometry | exact artboard (e.g. 587.436 × 147 pt for the lockup) |
| EPS structural check | **9 / 9** valid EPSF 3.0, `BoundingBox`, `eofill`, `showpage`, `%%EOF` |
| PNG files opened | **95 / 95** |
| Logo PNGs with transparent corner | yes (alpha min 0) |
| iOS 1024 PNG | RGB, no alpha channel, square, no baked corners |
| WebP files opened | **12 / 12**, lossless, alpha preserved |
| ICO files | **3** — favicon 16/32/48; desktop 16–256; light + dark |
| Stretched rasters | 0 — every raster is a uniform scale of its SVG master |
| File naming | consistent across light/dark and all formats |

**Guideline PDF note:** `08-Brand-Guidelines/RIVA-Logo-Usage-Guide.pdf` intentionally contains raster illustrations on pages 5–6 (app-icon PNGs and the "incorrect usage" examples). The logo artwork on pages 1–4 is vector. This does not affect the logo PDFs, which are pure vector.

---

## 6. Small-size legibility

| Size | Asset | Observation |
|---|---|---|
| 16 px | favicon | Dedicated tighter artwork; mark reads as the ribbon-diamond; rounded tile keeps tab clarity |
| 32 px | favicon / app icon | Hairline fold visible; aperture clean |
| 64 px | app icon | All edges clean; no grey fringing |
| 128–256 px | app icon | Full detail, including the fold line |
| 108 px wide | lockup minimum | Wordmark remains legible; below this use the symbol |
| 36 px high | symbol minimum | Aperture and fold remain readable |

No optical corrections were introduced that alter the identity. The favicon uses a tighter optical margin only at favicon sizes; its artwork is the same symbol.

---

## 7. Colour validation

| Token | Hex | RGB | Used in |
|---|---|---|---|
| Deep Navy | `#101C2C` | 16, 28, 44 | Light logo, dark icon background |
| Pure White | `#FFFFFF` | 255, 255, 255 | Dark logo |
| Warm White | `#F7F7F3` | 247, 247, 243 | Light icon background, recommended light surface |
| Steel Blue | `#71879B` | 113, 135, 155 | Secondary/system — **not** in the logo |
| Slate Blue | `#607D94` | 96, 125, 148 | Muted chrome — **not** in the logo |

Contrast: Deep Navy on Warm White **15.97:1**; Deep Navy on Pure White **17.15:1**; Pure White on Deep Navy **17.15:1**.

No gradients, secondary hues, tints, shadows or effects are present in any logo file.

---

## 8. Deliverable inventory

| Folder | Files | Formats |
|---|---|---|
| `01-Primary-Logo` | 12 | SVG, PDF, EPS, PNG 1×/2×/3× (light + dark) |
| `02-Symbol` | 12 | SVG, PDF, EPS, PNG 1×/2×/3× |
| `03-Wordmark` | 12 | SVG, PDF, EPS, PNG 1×/2×/3× |
| `04-App-Icons` | 60 | SVG, PNG 16–2048, ICO (iOS, Android, PWA, desktop) |
| `05-Favicons` | 14 | SVG, PNG 16/32/48/256, ICO, Apple Touch |
| `06-Raster-Exports` | 25 | PNG + lossless WebP, 2 sizes × 2 modes × 3 assets |
| `07-Vector-Masters` | 11 | SVG, PDF, EPS + AI format note |
| `08-Brand-Guidelines` | 5 | PDF, Markdown, tokens, HTML source |
| `09-Previews` | 7 | PNG |
| Root | 3 | README, QC report, ZIP |

**Total:** 161 files, ~7.6 MB including the ZIP (160 asset/documentation files + the archive). Counts include the short README in each sub-folder.

---

## 9. Sign-off checklist

- [x] Existing symbol, wordmark and composition preserved
- [x] No redesign, no font substitution, no decorative additions
- [x] Two official monochrome variants only
- [x] Light and dark artwork geometrically identical
- [x] SVG, PDF, EPS, PNG, WebP, ICO validated
- [x] App icons: square master, iOS/Android/PWA/favicon/desktop exports
- [x] Transparent SVG and PNG backgrounds for logos
- [x] Exact official blue documented and applied
- [x] Clear space, minimum sizes and proportions documented
- [x] Side-by-side reference comparison produced
- [x] No RIVA repository file modified
- [x] No Git commit, push or deployment

**Pre-existing repository state (not part of this task):** the RIVA working tree already contained unrelated uncommitted theme/landing changes before this build (`frontend/.env.example`, `frontend/components/landing/LandingNav.tsx`, `frontend/components/layout/SidebarContext.tsx`, `frontend/lib/theme/ThemeProvider.tsx`, `webapp/components/landing/LandingNav.tsx`, `webapp/lib/theme/ThemeProvider.tsx`, plus untracked theme files). Their timestamps (17–23 Nov, 12:48–12:51 on the build day) predate this session. They were not modified, reverted or absorbed. Only the new `RIVA-Brand-Assets/` folder was added.

**Open item for the owner:** confirm the official blue (`#101C2C`) and the single-colour ribbon knockout. Both are documented decisions, not oversights. A different blue or a two-tone ribbon would require an explicit direction change.
