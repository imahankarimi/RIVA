# Design notes (historical)

> **This file is superseded.** The source of truth for RIVA's look and behavior
> is [`../docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) (spec) and
> [`../design-system/`](../design-system/) (tokens/preset/glass code).
> Working rules for agents and contributors live in
> [`../AGENT.md`](../AGENT.md). If anything here disagrees with those files,
> they win.

## Why this palette, not the reference screenshots

Both references lean on dark, saturated violet/indigo panels with glow
effects. That's a strong look, but it reads as "crypto dashboard," not
"calm assistant that handles your books." RIVA AI's brief explicitly asks
for calm, trustworthy, restrained — so the direction taken here is a warm,
light neutral workspace (paper `#F7F7F3`, not a pure white and not the
cliché cream-with-serif look) with a single considered accent.

- **Deep Navy** (`#101C2C`) as the primary/signal colour — grounded and
  financial rather than the "generic AI SaaS" purple/teal. (An earlier note
  in this file cited "Signal teal #0E7C6B"; that was superseded — see
  `docs/DESIGN_SYSTEM.md` §1.3.)
- **Deep Ink** (`#10131A`) — a warm near-black for text, not pure `#000`.
- **Amber / rose / moss** — desaturated, used only for status (warning /
  error / success), never as decoration.

## Type

- **Manrope** for display/headings — geometric but friendly.
- **Inter** for UI text and body copy — quiet, legible at small sizes.
- **Vazirmatn** for Persian — a proper RTL-native typeface.
- **JetBrains Mono** for money — every amount renders in tabular figures.
  Numbers in a ledger should feel precise and countable, not blended into
  prose.

## Signature element: the receipt tear

The transaction confirmation card gets a subtle perforated-edge divider
(`.receipt-tear` in `globals.css`) between the amount and the accounting
details disclosure — a quiet nod to a paper receipt. Everything around it
stays deliberately quiet so the motif and the AI conversation carry the
personality.

## Motion

Framer Motion is used only for message entrance, transaction card entrance,
and small state transitions. Durations sit in the 150–260ms range; tokens
live in `design-system/tokens.css`. `prefers-reduced-motion` is respected
globally in `globals.css`.

## What was deliberately left out

- No decorative gradients, and no glassmorphism **on content** — the Liquid
  Glass material (added later) is scoped to navigation only
  (`docs/DESIGN_SYSTEM.md` §7).
- No charting library beyond Recharts wrappers — reports stay "minimal and
  elegant", not an analytics dashboard.
