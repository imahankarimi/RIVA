# Native Adobe Illustrator (.ai) format — limitation

**A native `.ai` file is not included in this package.** Adobe Illustrator is not installed in this environment, and a genuine Illustrator document cannot be fabricated. Renaming a PDF to `.ai` would produce a file that is not a native Illustrator document, so that was not done.

## What to use instead

Every logo asset is available as fully editable, font-independent vector artwork:

- **SVG** — `RIVA-lockup-master.svg`, `RIVA-symbol-master.svg`, `RIVA-wordmark-master.svg`, `RIVA-master.svg`
- **PDF** — vector, exact artboard
- **EPS** — PostScript outlines, opens directly in Illustrator

All paths use absolute coordinates and explicit fills. There are no fonts, linked images, patterns, effects or CSS dependencies. Opening any of the above in Adobe Illustrator and choosing **File → Save As → Adobe Illustrator (.ai)** produces a native `.ai` with identical geometry.

## Recommended Illustrator workflow

1. Open `RIVA-master.svg` (or the individual master) in Illustrator.
2. If prompted, keep the artboard and use the original document size.
3. Confirm the fill colours: `#101C2C` for light production, `#FFFFFF` for dark production.
4. Save as `.ai` with **Create PDF Compatible File** enabled if the file must also be readable by other applications.

## Why this is not a "fake" .ai

A PDF-compatible `.ai` created by Illustrator contains Illustrator's private editing data in addition to the PDF stream. That data can only be produced by Illustrator. The supplied PDF/EPS/SVG files are real, valid vector files; they are simply not claimed to be native Illustrator documents.

*If a native `.ai` is mandatory, generate it from these masters in Illustrator — the geometry will not change.*
