# Design notes

## Why this palette, not the reference screenshots

Both references lean on dark, saturated violet/indigo panels with glow
effects. That's a strong look, but it reads as "crypto dashboard," not
"calm assistant that handles your books." RIVA AI's brief explicitly asks
for calm, trustworthy, restrained — so the direction taken here is a warm,
light neutral workspace (`paper` #F7F7F4, not a pure white and not the
cliché cream-with-serif look) with a single considered accent.

- **Signal teal** (`#0E7C6B`) instead of purple/indigo — deliberately
  distances the product from the "generic AI SaaS gradient" look, and
  reads closer to ledger-green without going full QuickBooks.
- **Ink** (`#14181A`) — a warm near-black for text, not pure `#000`.
- **Amber / rose / moss** — desaturated, used only for status (warning /
  error / success), never as decoration.

## Type

- **Manrope** for display/headings — geometric but friendly, avoids both
  the "serif premium" cliché and the "generic grotesk SaaS" cliché.
- **Inter** for UI text and body copy — quiet, legible at small sizes.
- **Vazirmatn** for Persian — a proper RTL-native typeface rather than
  relying on the Latin font's fallback glyphs.
- **JetBrains Mono** for money — every amount in the product renders in
  tabular-figure monospace. This is the one deliberate typographic choice:
  numbers in a ledger should feel precise and countable, not blended into
  prose. It's used nowhere else, so it stays meaningful.

## Signature element: the receipt tear

The transaction confirmation card — the single most important surface in
the product — gets a subtle perforated-edge divider (`.receipt-tear` in
`globals.css`) between the amount and the "accounting details" disclosure.
It's a quiet nod to a paper receipt without literally illustrating one,
and it's the one place the design takes a visible risk. Everything else
around it (spacing, borders, shadows) stays deliberately quiet so that
motif and the AI conversation itself carry the personality.

## Motion

Framer Motion is used only for: message entrance, transaction card
entrance, and small state transitions (choice chips, disclosure panels).
Durations sit in the 150–260ms range called for in the brief.
`prefers-reduced-motion` is respected globally in `globals.css`.

## What was deliberately left out

- No glassmorphism, no gradients beyond a single soft signal-tinted card
  on the Overview page's "ask the assistant" CTA.
- No charting library — `MiniBarChart` is a ~20-line inline SVG-free bar
  chart, because the brief asks for reports that are "minimal and
  elegant," not an analytics dashboard.
