# RIVA Design System

**Status:** authoritative. This document, together with `design-system/`, defines
how RIVA looks. Where this document and an existing component disagree, the
component is wrong — fix the component.

**Version:** v1 — established October 2026 from RIVA's existing implementation.

> **How to read this.** Sections 1–5 are *law*: they explain why the system looks
> the way it does and what you may not break. Sections 6–11 are *reference*: the
> measurements you need while building. If you are about to write a component,
> read the law sections, then look up the component.

---

## Contents

1. [Brand](#1-brand)
2. [Colour](#2-colour)
3. [Typography](#3-typography)
4. [Layout](#4-layout)
5. [Motion](#5-motion)
6. [Components](#6-components)
7. [Liquid Glass](#7-liquid-glass)
8. [RIVA Advisor](#8-riva-advisor)
9. [Financial UX](#9-financial-ux)
10. [Localisation and RTL](#10-localisation-and-rtl)
11. [Accessibility, performance, PWA](#11-accessibility-performance-pwa)

---

## 1. Brand

### 1.1 What RIVA is

RIVA is **financial intelligence for businesses**. It is not an expense tracker
and not a chatbot with a ledger attached. Its job is to turn accounting data
into meaning: what is happening, why it matters, what to do next.

> **Records. Intelligence. Visibility. Automation.**

The product is calm, precise, trustworthy and quiet. It should feel closer to a
well-made instrument than to a dashboard.

### 1.2 Product personality

| We are | We are not |
|---|---|
| Calm | Loud |
| Precise | Approximate |
| Trustworthy | Flashy |
| Minimal | Empty |
| Intelligent | Pretend-AI |
| Warm | Cute |
| Confident | Opinionated about the user's money |

The failure mode to avoid is the "generic AI SaaS" look: purple/cyan gradients,
glowing orbs, sparkle-everywhere, confetti micro-animations. RIVA's intelligence
is expressed through **restraint and correctness**, not decoration.

### 1.3 Brand palette

Five hues. Everything in the system derives from or sits beside these.

| Token | Name | Value | Role |
|---|---|---|---|
| `--c-paper` | **Warm White** | `#F7F7F3` | The page. Never pure `#FFFFFF`. |
| `--c-signal-500` | **Deep Navy** | `#101C2C` | The primary action, and RIVA's voice. |
| `--c-ink` | **Deep Ink** | `#10131A` | Text. A warm near-black, never `#000000`. |
| `--c-signal-400` | **Steel Blue** | `#71879B` | Steel: charts, de-emphasised chrome. |
| — | **Slate Blue** | `#607D94` | The cool secondary for muted chrome. |

**Why Warm White and not white.** A pure-white page under pure-white cards has
no surface to sit on, so the interface has to invent borders and shadows to
carry structure. Warm White gives cards somewhere to lift from. It also reads as
*paper*, which is exactly the metaphor for an accounting product.

**Why Deep Ink rather than black.** Pure black on warm white vibrates. A warm
near-black at 4.5:1+ is easier to read for long sessions — which is what an
accounting product is: long sessions.

**Why status colours sit outside the brand.** Rose, amber and moss are
*deliberately* not brand hues. If a red number were derived from the brand, the
eye would read it as "a RIVA colour" instead of "a problem". Status colour must
be unambiguous.

**Never introduce a hue.** No purple, no cyan, no emerald. If something needs a
colour that does not exist, it almost certainly needs a *weight* or *opacity*
change, not a new hue.

### 1.4 Logo

Assets live in each app at `public/brand/`:

| File | Use |
|---|---|
| `riva-logo.svg` | Full lockup — sidebar, desktop top bar, light mode |
| `riva-logo-dark.svg` | Full lockup for dark surfaces |
| `riva-mark.svg` | Mark only — collapsed rail, compact bars, PWA-adjacent chrome |
| `riva-mark-dark.svg` | Mark only, dark mode |
| `public/favicon.svg` | Browser tab |
| `public/icons/icon-{192,512}.png` | PWA install icons |
| `public/icons/icon-512-maskable.png` | PWA maskable icon |

**Logo rules**

- Rendered at **36px** (mark) or **108×36px** (lockup). Never scaled between
  those two sizes.
- Always give clear space of at least half the mark's height on all sides.
- Never place the logo on a busy image, never add a gradient to it, never outline
  it, never rotate it, and never re-colour it outside the light/dark pairs above.
- On the floating glass bar the logo sits on the glass material itself, which is
  a fixed brand surface — see §7.
- The lockup collapses to the mark, and the mark crossfades to the lockup, when
  the sidebar collapses (`Sidebar.tsx`). Keep that `AnimatePresence` swap.

**The wordmark is set in the RIVA sans, not in the SVG's own type.** If you need
a differently-tracked wordmark, use the provided asset rather than retyping it.

### 1.5 Iconography

- **Library:** `lucide-react`. It is the only icon set. Do not add a second.
- **Sizes:** 13 / 16 / 18 / 20 / 24px. Inside a 44px button, 16–18px.
- **Default stroke:** `2`. Use `2.2–2.5` only on the hero elements (mobile tab
  bar centre, AI Assistant avatar) and `1.75` never.
- **Colour:** icons inherit the text colour of the text they accompany. They are
  almost never coloured independently — a coloured icon without a coloured label
  reads as an unexplained signal.
- **RTL:** any glyph whose meaning depends on direction (arrows, chevrons,
  trend arrows) gets the `flip-rtl` class, which `globals.css` mirrors under
  `[dir="rtl"]`.
- **Domain icons:** transaction categories use `lib/categoryIcons.ts`
  (`iconFor`), which falls back to `Receipt`. Never pick a category icon inline.
- **Do not** hand-roll SVG icons, use emoji as interface iconography, or mix
  outline and filled styles in one view.

### 1.6 The receipt tear — the signature motif

The single place RIVA takes a visible creative risk.

`.receipt-tear` in `globals.css` draws a perforated edge via a repeating radial
gradient, and appears **only** on the AI Assistant's transaction confirmation
card, between the amount and the accounting-details disclosure. It is a quiet nod
to a paper receipt without illustrating one.

**Rules**

- Exactly one component may use it: `components/chat/TransactionCard.tsx`.
- Its punch colour tracks the page background (`--c-receipt-punch`), so it works
  in both themes without a second variant.
- Never use it on a card border, a divider, or a page edge.
- Everything around it stays deliberately quiet — that is what makes it land.

---

## 2. Colour

### 2.1 How colour works in RIVA

Every colour is an **RGB triplet** custom property, which lets Tailwind apply
alpha to it:

```css
--c-signal-500: 16 28 44;                 /* triplet, not #101C2C */
signal: { 500: "rgb(var(--c-signal-500) / <alpha-value>)" }
```

This indirection is what allows `bg-signal-500` to theme correctly in light and
dark **with no per-component `dark:` variant**. It is the single most important
mechanical rule in the system:

> **If a colour comes from a token, you never write `dark:` for it.**
> A `dark:` override on a token-backed colour means the token is wrong — fix the
> token, not the component.

### 2.2 Layer 1 — Foundation

The raw ramps. Used by existing code and for building gradients; **new UI should
prefer Layer 2.**

**Surfaces** (light → dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--c-paper` | `#F7F7F3` | `#10131A` | Page background |
| `--c-surface` | `#FFFFFF` | `#101C2C` | Cards, bars, sheets |
| `--c-surface-muted` | `#F4F4F0` | `#182433` | Inset wells, table headers |
| `--c-surface-raised` | `#FFFFFF` | `#1F2B3A` | Popovers, menus, dialogs |

**Ink** — light values are slate/steel cooled toward the brand, then darkened
until each clears WCAG AA on `--c-paper` (5.29:1 and 3.81:1). Raw `#607D94` /
`#71879B` measure 4.02:1 and 3.47:1 and **fail** for body and secondary label
text, which is why they are not used directly.

| Token | Light | Dark | Contrast on paper |
|---|---|---|---|
| `--c-ink` | `#10131A` | `#F7F7F3` | 16.9:1 |
| `--c-ink-soft` | `#4F6A7E` | `#A9BCCC` | 5.29:1 |
| `--c-ink-faint` | `#6B8093` | `#8195A6` | 3.81:1 (labels ≥12px only) |

**Hairlines** — steel mixed into the surface so structure whispers. Steel at full
strength is a 3.47:1 border, far too loud for the ~74 `border-line` surfaces in
the app.

| Token | Light | Dark |
|---|---|---|
| `--c-line` | `#D9DFE4` | `#293646` |
| `--c-line-soft` | `#E7EBEE` | `#1F2B3A` |

**Signal (Deep Navy ramp)**

| Token | Light | Dark | Role |
|---|---|---|---|
| `--c-signal-50` | `#EEF1F4` | `#1B2839` | Selected rows, active nav |
| `--c-signal-100` | `#DCE3E9` | `#263A4A` | Hover fills, focus rings |
| `--c-signal-300` | `#A9B8C6` | `#5F7889` | Disabled borders |
| `--c-signal-400` | `#7E93A7` | `#7E97AD` | Steel Blue — secondary marks |
| `--c-signal-500` | **`#101C2C`** | **`#F7F7F3`** | **Primary fill** |
| `--c-signal-600` | `#1B2B3E` | `#E4E6E1` | Primary hover |
| `--c-signal-700` | `#263B51` | `#CFD4D0` | Primary active |
| `--c-signal-900` | `#0A121C` | `#F7F7F3` | Deepest fill |

`--c-on-signal` supplies the foreground on a signal fill: white in light, Deep
Ink in dark. **Use `text-onSignal`, never `text-white`** on a signal fill —
signal-500 is navy in light but warm white in dark, so a hardcoded white
foreground vanishes in dark mode.

**Status ramp** — the only place rose, amber and moss may appear.

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--c-moss-500` | `#3E9A6D` | `#58B585` | Positive, healthy, on track |
| `--c-amber-500` | `#C68A2E` | `#D9A04C` | Needs attention |
| `--c-rose-500` | `#B5433A` | `#C55048` | Failure, loss, destructive |
| `…-100` | tinted surface | dark tint | Backgrounds for status pills |

**Chart palette** — five series, chosen from RIVA semantics so they sit naturally
on both surfaces: `chart-1` navy, `chart-2` moss, `chart-3` steel, `chart-4`
amber, `chart-5` rose. `recharts` writes raw SVG attributes and cannot resolve CSS
variables, so `components/reports/chartColors.ts` mirrors these as hex in light
and dark. **That file is the one place a hex is expected — keep it in sync with
`tokens.css`.**

### 2.3 Layer 2 — Semantic tokens

Use these for all new UI. They name a *meaning*, so re-theming never requires
touching a component. Each maps to a Tailwind name in `tailwind-preset.ts`.

**Surfaces** — an ordered elevation ramp:
`sunken (0) < paper (1) < surface (2) < inset (3) < raised (4) < overlay (5)`

| Tailwind | CSS token | Use |
|---|---|---|
| `bg-paper` / `bg-background` | `--c-bg` | The page |
| `bg-surface` / `bg-card` | `--c-surface-1` | Cards and bars |
| `bg-surfaceInset` / `bg-muted` | `--c-surface-2` | Wells, table headers, code blocks |
| `bg-surfaceRaised` / `bg-popover` | `--c-surface-3` | Menus, popovers, dialogs |
| `bg-surfaceSunken` | `--c-surface-sunken` | Recessed areas behind a control |
| `bg-scrim` | `--c-overlay-scrim` | Modal / sheet backdrop |

**Text**

| Tailwind | Token | Use |
|---|---|---|
| `text-ink` / `text-foreground` | `--c-text` | Primary text, amounts, headings |
| `text-ink-soft` / `text-ink-soft` | `--c-text-soft` | Body copy, descriptions |
| `text-ink-faint` / `text-muted-foreground` | `--c-text-faint` | Labels, captions, axis text, metadata |
| `text-text-inverse` | `--c-text-inverse` | Text on an inverted surface |

`ink-faint` clears AA at **3.81:1 in light mode**. It is legal for text at 12px+
and for non-text (dividers, disabled glyphs). It is **not** legal for body copy.

**Borders** — `border-line` (default), `border-line-soft` (inner dividers),
`border-line` + `signal-300` (active/selected), and `border-transparent`
(removing a border without changing layout).

**Primary action**

| Tailwind | Token |
|---|---|
| `bg-primary` | `--c-primary` |
| `hover:bg-primary/90` | alpha, or `--c-primary-hover` |
| `text-primary-foreground` | `--c-primary-fg` |
| `bg-primary-soft` | `--c-primary-soft` (selected nav, active tab) |
| `ring-ring` | `--c-ring` (focus outline) |

**Accent** — `bg-accent` / `text-accent-foreground`. RIVA has exactly **one**
accent and it is the brand navy. "Accent" means emphasis on a neutral surface, a
second brand colour.

**Status** — each has a text-safe value, a `-fill` for solid backgrounds and
chart series, a `-surface` for pill backgrounds, and a `-fg` for text on a fill.

| Tailwind | Meaning | Typical trigger |
|---|---|---|
| `success-*` (`moss`) | Good news | Transaction recorded, budget met, positive margin |
| `warning-*` (`amber`) | Needs attention | Low runway, 80% of budget used, overdue soon |
| `danger-*` (`rose`) | Action required / failure | Unbalanced entry, failed request, destructive confirm |
| `info-*` (`slate`) | Neutral system messaging | Explanations, tips, informational banners |

**Financial semantics** — see §9 for the full treatment.

| Tailwind | Meaning |
|---|---|
| `text-fin-positive` | The business gained |
| `text-fin-negative` | The business lost |
| `text-fin-caution` | Pressure building |
| `text-fin-neutral` | Simply a number, no change |
| `text-fin-revenue` | Revenue series / line |
| `text-fin-expense` | Expense series / line |
| `text-fin-cash` | Cash and equivalents (stays brand-neutral) |
| `text-fin-debt` | Debt (caution, not danger, until late) |

**Advisor semantics** — see §8.

| Tailwind | Meaning |
|---|---|
| `advisor-insight` | RIVA stating something, informational |
| `advisor-recommendation` | RIVA asking you to do something, positive |
| `advisor-forecast` | Projected / uncertain — the coolest of the five |
| `advisor-risk` | Needs attention |
| `advisor-critical` | Act now |

### 2.4 Dark mode

Dark mode is **its own design, not an inversion.** The page becomes near-black
Ink and cards step *up* into Deep Navy, so elevation moves in the same direction
it does in light mode.

Contrast audit against its own background:

| Pair | Ratio | Verdict |
|---|---|---|
| `--c-ink` on `--c-paper` (light) | 16.9:1 | AAA |
| `--c-ink-soft` on `--c-paper` (light) | 5.29:1 | AA body ✓ |
| `--c-ink-faint` on `--c-paper` (light) | 3.81:1 | AA large / ≥19px only |
| `--c-ink` on `--c-paper` (dark) | 17.1:1 | AAA |
| `--c-ink-soft` on `--c-paper` (dark) | 9.4:1 | AAA |
| `--c-ink-faint` on `--c-paper` (dark) | 5.6:1 | AA body ✓ |
| `--c-on-signal` on `--c-signal-500` (both) | ~17:1 | AAA |

**Dark-mode rules**

- Class-based, not media-query-based: `.dark` is toggled on `<html>` by
  `lib/theme/ThemeProvider` and set before first paint by
  `THEME_BOOTSTRAP_SCRIPT` to avoid a flash. **Do not add a `prefers-color-scheme`
  listener.**
- Shadows get deeper and cooler in dark mode (`--shadow-*` has a `.dark`
  override). With no paper to separate from, the shadow alone has to do the work.
- Steel at full strength is *lighter* than the dark card surface, so every
  bordered card would read as a glowing outline. `--c-line` is therefore steel
  mixed into navy, not steel.
- `ink-soft` must stay **brighter** than `ink-faint`. Getting that backwards
  inverts the entire emphasis ramp — this has happened before.
- Do not use pure `#000000` or pure `#FFFFFF` in dark mode. The surfaces are
  deliberately off-black and off-white.

### 2.5 Rules

1. Never hardcode a hex or RGB triplet for a brand or semantic colour.
2. Never write `dark:` for a token-backed colour.
3. `text-white` on a signal fill is a bug; use `text-onSignal`.
4. Status colour is never decorative. A green border means "good", not "nice".
5. One accent. If a screen needs a second accent hue, the hierarchy is wrong.
6. Verify a new colour in both themes before shipping it.
---

## 3. Typography

### 3.1 Families

RIVA loads four faces. Which one applies is decided **once**, by locale, in
`app/globals.css` — never per component.

| Locale | UI (`font-sans`) | Display (`font-display`) | Money (`font-mono`) |
|---|---|---|---|
| **fa** — Persian | **Vazirmatn** | Vazirmatn | JetBrains Mono → Vazirmatn |
| **en** — English | **Inter** | **Manrope** | JetBrains Mono |

The mechanism:

```
html[data-locale="fa"] { --font-ui: var(--font-vazirmatn), … }
html[data-locale="en"] { --font-ui: var(--font-inter), … }

tailwind:  sans: ["var(--font-ui)", …]   display: ["var(--font-ui-display)", …]
```

**This is the single seam that keeps bilingual typography correct.** Components
write `font-sans` and `font-display` and stay right in both languages.

> **Never hardcode `Vazirmatn`, `Inter` or `Manrope` in a component.** Doing so
> fights English typography and leaves numeric contexts without a Persian
> fallback. If a font seems "wrong", fix `tokens.css`/`layout.tsx`, not the
> component.

**Why these faces**

- **Vazirmatn** — a genuine RTL-native Persian typeface with proper Persian
  glyph forms and diacritic positioning. Not a Latin font with Arabic fallback
  glyphs, which is what happens if you let an English face render Persian.
- **Inter** — quiet, high x-height, extremely legible at 12–14px in dense
  financial tables. The workhorse.
- **Manrope** — geometric but friendly, for display headings only. Avoids both
  the "serif premium" cliché and the "generic grotesk SaaS" cliché.
- **JetBrains Mono** — money. Tabular by construction.

*(Note: RIVA Main previously loaded IBM Plex Sans and no mono face at all, which
silently resolved `font-mono` to the UI font. It now loads the same stack as RIVA
Web. If you find an IBM Plex reference, it is legacy — see `AGENT.md`.)*

### 3.2 Weights

| Weight | Use |
|---|---|
| 400 (Regular) | Body copy, table cells, helper text. The default. |
| 500 (Medium) | Labels, nav items, buttons, table headers |
| 600 (SemiBold) | Card titles, emphasis in dense data, mobile tab labels |
| 700 (Bold) | Page titles, display headings, amounts in KPI cards |

Do not use 800+. RIVA has no need for it.

### 3.3 Scale

RIVA's real type floor is **11px**, and most UI sits in a tight 11–17px band
because financial tables are dense. Display sizes are deliberately modest —
huge typography is one of the ways a finance product starts to look like a
startup landing page.

| Token / class | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text-[10px]` | 10 | 1.3 | 600 | Eyebrows, `uppercase tracking-wider` micro-labels only |
| `text-[11px]` | 11 | 1.4 | 600 | Stat card labels, timestamps, tab bar labels (9.5px) |
| `text-[11.5px]` | 11.5 | 1.5 | 500 | Secondary metadata, transaction subtitles |
| `text-[12.5px]` | 12.5 | 1.55 | 400–600 | Helper text, descriptions, badge text |
| `text-[13px]` | 13 | 1.5 | 500 | **Default UI text**, nav items, table cells |
| `text-[14px]` | 14 | 1.55 | 400–600 | Chat message body, emphasised cells |
| `text-[15px]` | 15 | 1.45 | 600 | Card titles, modal titles |
| `text-[17px]` | 17 | 1.3 | 700 | Page title in the top bar |
| `text-[21px]` | 21 | 1.25 | 700 | Section heading (mobile) |
| `text-[24px]` | 24 | 1.2 | 700 | Section heading (desktop) |
| `text-[26px]` | 26 | 1 | 600 | The amount on a transaction receipt card |
| `text-[28px]` | 28 | 1.25 | 700 | Auth screen welcome |

**Rules**

- Page titles are 17px/700 in the sticky top bar — not 32px. The top bar is a
  persistent fixture; it must not shout on every scroll.
- Section headings are 21–24px. **Never exceed 32px anywhere except the auth
  screen.**
- Line height is at least `1.4` for anything below 14px, and `1.5` for body copy.
- Letter-spacing: `tracking-tight` on headings ≥15px, `tracking-wider` only on
  uppercase micro-labels ≤11px. Nothing in between.

### 3.4 Numeric and financial typography

This is the part that makes RIVA feel like a ledger rather than a website.

```css
.font-figures {          /* in globals.css */
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

- **Every rendered amount uses tabular figures.** Apply `.font-figures` and
  almost always `font-mono` as well. In a column of amounts, digits must align
  vertically or the column is unreadable.
- **Never** use proportional figures for money.
- **Negative amounts** keep the minus sign inside the formatted number
  (`formatCurrency` emits U+2212 `−`, not a hyphen) so the alignment is exact.
- **Signed values** (`formatCurrency(x, cur, locale, { signed: true })`) prefix
  `+` or `−`. Do not build this by hand in a component.
- **Compact axis values** (`۸۴.۵M`) belong on charts only — never in a table cell
  or a KPI card where the exact figure matters.
- **Account IDs** are monospace and truncated (`account.id.slice(0, 9)`).

### 3.5 Persian typography

- **Vazirmatn, never a fallback.** See §3.1.
- **Persian digits** (`۰۱۲۳۴۵۶۷۸۹`) are produced by `lib/currency/index.ts`
  (`toPersianDigits`) and only in the `fa` locale. **Never** hand-write Persian
  digits in a component or a string.
- Persian numerals are *not* decimal-separated the same way: `toLocaleString` is
  always called with `"en-US"` and the digits are converted afterwards, so
  grouping stays `1,234,567` in both locales.
- **ZWNJ (half-space)** is correct in compounds like `هزینه‌ها`, `لوازم و
  ملزومات`, `می‌شود`. Do not replace it with a regular space.
- Persian copy is **not** a transliteration of English copy. It must read as
  natural Persian written by a Persian speaker. Ask rather than machine-translate
  financial terminology.
- Line height needs roughly 10% more room than English: use `leading-relaxed`
  for Persian body copy inside cards.

### 3.6 Rules

1. `font-sans` for UI, `font-display` for headings, `font-mono` + `font-figures`
   for money.
2. Never name a font family in a component.
3. Never exceed 32px type except on the auth screen.
4. Never mix two type sizes closer than 1px apart in the same block.
5. Uppercase + `tracking-wider` is for 11px-and-under micro-labels only. Persian
   has no uppercase — those labels must be `normal-case` in `fa`.

---

## 4. Layout

### 4.1 Page structure

Every page in RIVA follows the same skeleton. Deviating is a bug.

```
┌──────────────────────────────────────────────────────────────┐
│ Topbar  h-16, sticky, border-b, bg-paper/90, backdrop-blur   │  desktop & mobile
├───────────┬──────────────────────────────────────────────────┤
│           │  Page content                                    │
│  Sidebar  │  max-w-content (1120px), px-4 sm:px-6            │
│  248px    │  Page header: eyebrow + title + optional action   │
│  (76px    │  Content sections separated by --section-gap     │
│  rail)    │                                                  │
│           │  pb-[safe-area + 80px] on mobile                  │
├───────────┴──────────────────────────────────────────────────┤
│        Floating Liquid Glass tab bar (mobile only)            │
└──────────────────────────────────────────────────────────────┘
```

- **Sidebar** — desktop only (`lg:flex`), inset as a rounded card
  (`m-2 rounded-xl bg-sidebar`), animates 248 ↔ 76px on hover with a spring.
- **Topbar** — each page renders its own `Topbar`; it is not mounted at shell
  level. 64px, sticky, translucent paper with a backdrop blur.
- **Content column** — `max-w-content` (1120px), centred, `px-4 sm:px-6`.

### 4.2 Containers

| Token | Value | Use |
|---|---|---|
| `max-w-content` | 1120px | Every page's content column, the desktop top bar |
| `max-w-4xl` | 896px | Auth screen split layout |
| `max-w-2xl` | 672px | Dialogs, settings modal |
| `max-w-sm` | 384px | Modals, add-transaction sheet |
| `max-w-[360px]` | 360px | Chat bubbles, transaction receipt card |

The 1120px figure is shared deliberately between the Tailwind token and the
glass top bar so the bar's content aligns with the page beneath it.

### 4.3 Grid

| Pattern | Classes | Use |
|---|---|---|
| KPI row | `grid gap-3 sm:grid-cols-2 lg:grid-cols-4` | 4 stat cards |
| Card grid | `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` | Advisor, accounts |
| Feature grid | `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` | Insights |
| Transaction table | `grid-cols-[1fr_140px_110px_120px_32px] min-w-[600px]` | Desktop table |
| Money row | `flex items-center justify-between` | Every amount row |
| Tab bar | `grid w-fit grid-cols-5 items-end` | Mobile navigation |

**Gap vocabulary:** `gap-2` inside a component, `gap-3` between related cards,
`gap-4` between card groups, `space-y-6` between page sections.

### 4.4 Spacing scale

A 4px base grid. Tailwind's full scale remains available; these are the values
RIVA actually uses.

| Token | px | Use |
|---|---|---|
| `1` | 4 | Icon-to-label inside a tight control |
| `2` | 8 | Between a label and its value, chip padding |
| `3` | 12 | Card internal padding (mobile), grid gaps |
| `4` | 16 | Card padding (desktop), `--gutter`, page `px-4` |
| `5` | 20 | Large card padding |
| `6` | 24 | `--section-gap`, page `sm:px-6` |
| `8` | 32 | Between major blocks |
| `10` | 40 | Empty-state vertical rhythm |
| `12` | 48 | Empty-state padding (`py-12 sm:py-16`) |
| `16` | 64 | Rare |

**Rules**

- Page horizontal padding is always `px-4 sm:px-6`.
- Card padding is `p-3.5 sm:p-4` for stat cards, `p-4` / `p-5` for content cards,
  `p-6` for dialogs.
- Between page sections: `space-y-6`.
- Never use a spacing value that is not a multiple of 4 (or 2 for icon nudges).

### 4.5 Breakpoints

RIVA uses Tailwind defaults and nothing custom:

| Prefix | Width | RIVA's behaviour |
|---|---|---|
| *(base)* | < 640 | Single column. Floating glass tab bar. Sheets instead of side panels. |
| `sm:` | ≥ 640 | Two-column grids. `sm:px-6` gutters. |
| `md:` | ≥ 768 | **RIVA Web only** — desktop sidebar and desktop bar replace the mobile ones. |
| `lg:` | ≥ 1024 | **RIVA Main only** — desktop sidebar replaces the drawer + bottom bar. |
| `xl:` | ≥ 1280 | Rarely used. |

> **Note the divergence.** RIVA Main switches at `lg`, RIVA Web at `md`. This is
> deliberate and pre-existing — do not "fix" it casually, but do keep a feature's
> breakpoint consistent *within* an app.

### 4.6 Responsive rules

- **Mobile is the primary target.** RIVA is a PWA; the phone layout is not a
  degraded desktop layout.
- Touch targets are **≥ 40px**, ideally 44px (`--touch-min`, the iOS HIG
  minimum). Inputs must be ≥ 16px font or iOS zooms on focus.
- Tables become cards below `md`/`lg`. `TransactionRow` ships both a grid row and
  a stacked card variant rather than hiding data.
- Charts that cannot compress gracefully must switch to a simpler form
  (a `MiniBarChart` instead of a line chart), not shrink illegibly.
- `overflow-x-auto` on a table is a last resort, not a layout strategy.
- Never rely on hover for anything essential — it does not exist on touch.
  Hover states are enhancements only.

### 4.7 PWA layout

- `viewportFit: "cover"` plus `env(safe-area-inset-*)` padding on every fixed
  element. This is why the glass bar can float flush to the bottom edge.
- The mobile nav is `pointer-events-none` with pointer events restored on the
  pill, so the transparent gutter never blocks content scrolling.
- Content bottom padding clears the floating bar:
  `pb-[calc(env(safe-area-inset-bottom)+80px)]`.
- The chat composer uses a similar offset so it never sits under the bar or the
  keyboard. See `MOBILE_ASSISTANT_IMPROVEMENTS.md` for the reasoning.
- The service worker (`public/sw.js`) deliberately caches **nothing**. Financial
  data must always come from the network. Do not add a cache without an explicit
  product decision about staleness.

---

## 5. Motion

Motion in RIVA is **short, physical and purposeful**. The governing rule:

> If an animation does not communicate something, delete it.

This is an accounting app, not a marketing site. Anything past ~320ms reads as
sluggish on a phone.

### 5.1 Tokens

Canonical values live in `lib/motion/tokens.ts` (TypeScript, for Framer Motion)
and mirror the CSS custom properties in `tokens.css` (for CSS transitions).

| Token | Value | Use |
|---|---|---|
| `DURATION.fast` | 120ms | Colour/opacity changes, hover |
| `DURATION.base` | 180ms | Dropdowns, tooltips, tabs |
| `DURATION.moderate` | 240ms | Page headers, card entrances |
| `DURATION.slow` | 320ms | Sheets, large panels — the ceiling |
| `EASE_OUT` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances — fast out, gentle settle |
| `EASE_STANDARD` | `cubic-bezier(0.4, 0, 0.2, 1)` | Two-way transitions |
| `SPRING_SNAPPY` | stiffness 500, damping 32 | Buttons, tap feedback |
| `SPRING_SOFT` | stiffness 300, damping 26 | Panels, sidebar width, sheets |

**Always import from `lib/motion/tokens.ts`.** Do not inline a duration or an
easing curve. (Several components have historically re-declared `EASE_OUT`
locally; that is drift, not a pattern.)

### 5.2 Motion vocabulary

| Interaction | Treatment |
|---|---|
| Page/section entrance | `fadeUp` — fade + 6–10px rise, 240ms, `EASE_OUT` |
| List entrance | `staggerContainer(0.05)` + `staggerItem` |
| Card hover | `hoverLift` — scale 1.015, y −2px |
| Button press | `whileTap={{ scale: 0.97 }}`, `SPRING_SNAPPY` |
| Dropdown / popover | opacity + `y: -6px` + `scale: 0.98` → rest, 180ms |
| Sheet / bottom sheet | Spring `y`, or `stiffness 300, damping 30` |
| Sidebar collapse | `SPRING_SOFT` on width |
| Active nav pill | Shared `layoutId` — a sliding pill, not a colour swap |
| Thinking indicator | 3 dots, `animate-pulse-dot`, 0/150/300ms offsets |
| Number change | `AnimatedNumber` — counts to the new value |
| Theme toggle icon | Rotate ±90° + scale 0.6, 120ms |

### 5.3 Rules

1. **Everything respects `prefers-reduced-motion`.** `globals.css` neutralises
   all animation globally. Do not opt out with `!important`.
2. **No parallax, no scroll-jacking, no looping background animation.**
3. **No motion on numbers that the user is reading.** `AnimatedNumber` is for
   KPI cards only, and it must be short.
4. **Directional transitions must be direction-agnostic.** A hover that lifts
   works in both LTR and RTL; a slide that assumes "from the left" does not.
5. **Entrances happen once.** Nothing re-animates on every re-render.
6. **Sheets slide; modals scale.** A bottom sheet uses vertical spring travel; a
   centred dialog scales from 0.98.

---

## 6. Components

Rules below are binding. Sizes are the ones actually used in the codebase.

### 6.1 Buttons — `components/ui/Button.tsx`

Variants:

| Variant | Appearance |
|---|---|
| `primary` (= `default`) | `bg-primary text-primary-foreground shadow-subtle` |
| `secondary` | `bg-secondary border border-line text-ink` |
| `ghost` | Transparent, `text-ink-soft`, hover `bg-surface-muted` |
| `outline` | Transparent with a `border-line` outline |
| `danger` (= `destructive`) | `bg-danger-fill text-danger-foreground` |
| `link` | Text only, underline on hover |

Sizes: `sm h-8 px-3 text-[12px]` · `md h-10 px-4` · `lg h-12 px-5` ·
`icon size-9`.

- Radius `rounded-md` (12px). **Never `rounded-full` except for a circular FAB.**
- Hover `scale: 1.015`; tap `scale: 0.97`; both `SPRING_SNAPPY`.
- Mobile: `min-h-[44px] sm:min-h-0` — the base height is too short for a thumb.
- Icons sit at `gap-2` from the label, 16px.
- `disabled` reduces to `opacity-50 pointer-events-none` — never hide a disabled
  button, because a layout shift is worse than a dimmed control.
- **One primary button per view.** If you need two, one of them is secondary.
- Destructive actions require a confirmation step (`AlertDialog` pattern), not
  just a `danger` button.

### 6.2 Inputs — `components/ui/Input.tsx`, `Textarea.tsx`, `Label.tsx`

- Height `h-9` desktop / `min-h-[44px]` touch. Radius `rounded-sm` (8px).
- `bg-surface border border-line`; focus:
  `border-signal-400 shadow-card ring-4 ring-signal-100/60`.
- Placeholder is `text-ink-faint`. Label sits above at `text-[12.5px] font-medium`.
- **Text inputs must be ≥ 16px on mobile** or iOS zooms on focus. This is not
  optional.
- Error state: `border-danger` + a `danger` message below at `text-[11.5px]`.
  Never colour the border alone — colour alone fails accessibility.
- Money inputs use `AnimatedAmountInput` + `NumericKeypad`, not a plain `Input`.

### 6.3 Selects — `components/ui/Select.tsx`

Custom listbox (button + `motion.ul role="listbox"`), **not** a native `<select>`,
so it can be styled and translated.

- Trigger matches input styling. Chevron at `end`, 16px, `text-ink-faint`.
- Options: `py-2 px-3`, `text-[13px]`, hover `bg-surface-muted`,
  selected `bg-signal-50 text-signal-700`.
- Closes on outside `mousedown` and on `Escape`.
- Always include a `placeholder` in the app's language, never an empty state.

### 6.4 Dropdowns & popovers — `DropdownMenu.tsx`, `Popover.tsx`

- Surface `bg-surface-raised`, `border border-line`, `rounded-md`,
  `shadow-raised`, `py-1`.
- Item: `px-3 py-2 text-[13px]`, icon 14px at `gap-2`.
- Enter/exit: opacity + `y: -6px` + `scale: 0.98`, 180ms, `EASE_OUT`.
- Close on outside pointerdown and on `Escape`. **Every** dropdown.
- Positioned with logical properties (`start-0` / `end-0`), never `left`/`right`.
- `Popover` centres itself on its trigger and mirrors under RTL.

### 6.5 Modals & dialogs — `Modal.tsx`, `Dialog.tsx`

- Centred, `max-h-[85vh]`, `rounded-lg` (16px) — `Dialog` uses `rounded-2xl`,
  `Modal` uses `rounded-xl`; prefer `Modal` for new work.
- Backdrop `bg-ink/25` light, `bg-black/40` dark.
- Enter: `pop-in` (`scale 0.98 → 1`). Exit: same, 200ms.
- `Escape` closes; body scroll is locked while open.
- Title at `text-[15px] font-semibold`; actions bottom-right, `gap-2`.
- **Never more than one modal open.**

### 6.6 Sheets & bottom sheets — `Sheet.tsx`, `WebappSettingsModal`, More sheet

- Edge-anchored panels: `w-[340px]`, `border-s`, `shadow-raised`.
- Bottom sheets: `max-h-[85vh]`, `rounded-t-3xl`, spring `y` travel,
  `pb-[max(env(safe-area-inset-bottom),12px)]`, with a grabber
  (`h-1 w-10 rounded-full`).
- Full-screen on mobile (`h-[90vh]`), centred card from `sm:` up.
- Sheets are the mobile replacement for a side panel. Prefer them over
  squeezed desktop layouts.

### 6.7 Cards — `components/ui/Card.tsx`

Slots: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
`CardContent`, `CardFooter`.

- `bg-card text-card-foreground rounded-2xl shadow-subtle ring-1 ring-line`.
- Padding `p-4`, header `pb-2`. Radius 16px — RIVA's default card radius.
- Internal gap `gap-3`; a title plus value plus trend is the standard KPI card.
- **Card count discipline.** A page should have 2–4 cards, not a wall of them.
  Prefer a list, a table, or plain text on a surface. This is the single most
  common way RIVA pages go wrong.
- The signal ramp is used deliberately so severity is readable *before* the text
  is. A risk card is `amber`, a critical card is `rose` — never both.
- Cards that are not interactive get no hover state and no shadow change.

### 6.8 Tables — `Table.tsx`, `TransactionRow`

- Header row: `bg-muted/50`, `text-[11.5px] font-semibold uppercase tracking-wider text-ink-faint`.
- Row height ≥ 44px for touch. Rows: `border-b`, hover `bg-muted/50`,
  selected `bg-primary-soft`.
- **Right-align amounts.** Always. Amounts are the only right-aligned content.
- Amount cells: `font-mono font-figures text-[14px] font-semibold`.
- Dates and categories are `text-ink-faint`; the description carries the weight.
- Mobile: the row becomes a stacked card (`TransactionRow` ships both variants).
  Never hide a column without moving its value somewhere visible.
- Row click opens a detail surface — a row that looks clickable must be.

### 6.9 Tabs & segmented controls — `Tabs.tsx`, `TransactionTypeTabs`

- Segmented pill: active `bg-surface text-ink shadow-subtle`,
  inactive `text-ink-soft hover:text-ink`.
- Sliding indicator via a shared `layoutId` — a moving pill, not a colour swap.
- Height `h-8`, label `text-[12.5px] font-medium`, radius `rounded-md`.
- `role="tablist"` / `role="tab"` with `aria-selected`.
- Never more than 5 tabs. If there are more, use the More sheet.

### 6.10 Navigation

**Sidebar (desktop).** Inset rounded card, 248px → 76px rail on hover
(`SPRING_SOFT`). Sections in order: Operate → Financials → Intelligence →
Plan → System. Active item gets the sliding `layoutId` pill plus
`font-semibold`. Bottom of the rail holds Quick Actions, then the business
switcher, then the profile menu. Below `lg` it is replaced entirely by the
drawer + floating bar.

**Floating mobile navigation.** `MobileNav.tsx` (RIVA Main) /
`MobileTabBar.tsx` (RIVA Web). Exactly five items, the Assistant centred and
rendered as the raised inverted hero tab (`scale-[1.07]`), labels 9.5px/600,
`pb-[max(env(safe-area-inset-bottom),12px)]`, `pointer-events-none` wrapper.
Full navigation lives in the More sheet / drawer.

**Topbar.** `h-16`, sticky, `border-b border-line bg-paper/90 backdrop-blur`,
`px-4 sm:px-6`. Left: mobile menu button. Centre: title + subtitle
(`text-[17px] font-bold`, subtitle hidden below `sm`). Right: theme toggle,
language switcher, profile avatar (`h-9 w-9 rounded-full bg-primary`).

### 6.11 Business switcher & profile menu

- Trigger: `rounded-md`, `hover:bg-sidebar-accent`, avatar tile `h-8 w-8
  rounded-md`, name `text-[13px] font-medium`, currency `text-[11.5px]
  text-ink-faint`, `ChevronsUpDown` at `end`.
- **It must be a real list**, not a cycle-on-click. Cycling silently mutates
  state the user cannot see coming. (Both apps currently cycle in the sidebar —
  see `AGENT.md` Known Issues.)
- Profile menu: `w-56 rounded-md border border-line bg-surface shadow-raised`,
  header block with name + email, then Edit profile, then Log out in
  `text-danger`.
- Log out always routes to an existing sign-in route.

### 6.12 Toasts — `Toast.tsx`

- Bottom-anchored (or top-right on desktop), `rounded-lg`, `shadow-raised`,
  `max-w-sm`, `gap-2.5`.
- `auto-dismiss` at ~4s; success auto-dismisses, error **persists** until
  dismissed — an error the user missed is an error that happened twice.
- Types: `success` (moss), `error` (rose), `info` (slate), `warning` (amber).
- Never toast for something the user must act on — use an inline message.
- One toast at a time per type; new messages replace, they do not queue up.

### 6.13 Alerts / banners — `Alert.tsx`, `WebappNotice.tsx`

- Variants: `default`, `success`, `warning`, `destructive`.
- Left icon 16px, `rounded-md`, tinted background (`*-surface`) with a
  `*-700` icon and text, `border-line` or no border.
- Used for persistent, page-level context (demo-data notice, currency locked,
  connectivity problem). Not for transient feedback — that is a toast.
- `WebappNotice` renders **only** for `variant="demo"`. Any other variant is a
  silent no-op; that is a trap, prefer `Alert` unless the notice is the demo
  banner.

### 6.14 Empty, loading & error states — `StateViews.tsx`, `Skeleton.tsx`

Every data surface needs all three. This is not optional.

- **Loading** — `SkeletonCard` with `animate-pulse bg-muted`. Skeletons must
  approximate the real layout's shape, otherwise the page jumps on load. Never a
  spinner where a list will appear.
- **Empty** — `EmptyState`: icon 32–48px in `bg-primary-soft`, title
  `text-[15px] font-semibold`, body `text-[13px] text-ink-soft`, and **one**
  primary action. Explain *why* it is empty and what to do next.
- **Error** — `ErrorState`: `danger` icon, what failed, and a retry action.
  Never a raw error message.
- **Demo** — a visible `WebappNotice variant="demo"`. RIVA never shows fake data
  without saying so.

### 6.15 Tooltips — `Tooltip.tsx`

- Delay 400ms, `rounded-md bg-primary text-primary-foreground px-2.5 py-1.5
  text-[12px] font-medium shadow-raised`.
- Supplementary only. Never put information *only* in a tooltip — it is
  unreachable on touch.
- No tooltip on a touch-primary control.

### 6.16 Skeleton, avatar, badge, progress, separator

- `Skeleton` — `animate-pulse rounded-md bg-muted`.
- `Avatar` — initials only, `rounded-full`, sizes `sm/md/lg`. Fall back to the
  initial when an account logo fails to load.
- `Badge` — `rounded-full px-2 py-0.5 text-[10px] font-semibold`, tinted
  background with a `-700` text. For status words only, never for long labels.
- `Progress` — 4px track, `rounded-full`, `bg-primary` fill, no label inside.
- `Separator` — `bg-line`, 1px, `border-s` or `border-b` depending on axis.

### 6.17 Charts — `Chart.tsx`, `components/reports/*`, `components/analytics/*`

- **Palette comes from one place.** Recharts writes raw SVG attributes and
  cannot resolve CSS variables, so the chart palette is mirrored as explicit
  light/dark hex values in `components/reports/chartColors.ts`. Never pass a
  raw hex to a chart component — use `useChartColors()` (or `CHART_COLORS` as a
  non-component fallback). The five series are `chart-1…5` (navy, moss, steel,
  amber, rose), kept in sync with `tokens.css`.
- **Semantics drive hue, not brand.** Revenue / positive flows are moss;
  expenses / negative flows are rose; brand navy is reserved for neutral,
  non-polarised elements. Never colour a series green just because it is "a
  line on a chart".
- **Container.** Wrap every chart in `ChartContainer` with a `config` mapping
  series keys → labels; it handles theme, unique ids and `ResponsiveContainer`
  sizing. Charts sit on `bg-card ring-1 ring-line rounded-2xl p-4` like any
  other card — no glass, no gradient backgrounds.
- **Axes and grid.** Grid: `rgba(113,135,155,.18)` light / `.25` dark — one
  hairline weight, no axis borders. Axis labels: `ink-faint`, `text-[11px]`.
  Compact values (`۸۴.۵M`) are allowed on axes only, never in table cells.
- **Tooltip.** Use `ChartTooltip` from `components/reports/ChartTooltip`:
  `bg-surface border border-line shadow-raised rounded-md px-3 py-2`,
  `font-mono font-figures` for values, no arrow gimmicks.
- **RTL exception.** Charts render `dir="ltr"` deliberately — time flows
  left-to-right in both locales (§10.3). Do not mirror them.
- **Accessibility.** Every chart needs a text equivalent (a table, a summary
  sentence, or `aria-label` with the same figures) — a chart alone is not an
  accessible representation (§11.1).
- **Degradation.** Below the mobile breakpoint, compress rather than shrink:
  fewer ticks, a simpler chart form (`MiniBarChart` instead of a line chart),
  or horizontal scroll with a visible affordance — never an illegible squint.
- **Aggregations are backend truth.** Charts plot numbers returned by the
  backend/reports API (or the page's existing derived data). Do not recompute
  totals client-side (§9.3 profit rule applies to all series).

### 6.18 Financial metric displays — `StatCard`, KPI rows, money cells

- **`StatCard` anatomy:** label (`text-[12.5px] text-ink-faint`) + tone icon
  chip (`h-8 w-8 rounded-lg`, `*-100` bg / `*-700` fg) on the top row; value in
  `font-mono font-figures text-[23–25px] font-semibold`; optional trend chip
  beneath; a 1px tonal gradient accent along the card's top edge. Tones:
  `default` (signal), `positive` (moss), `negative` (rose) — tone follows
  **meaning**, not raw sign (`invertTrendColor: true` for e.g. expenses, where
  an increase is unfavourable).
- **Trend chip** carries arrow + percentage + comparison label ("vs last
  month"). Colour follows favourability; the arrow always shows the raw
  direction so colour is never the only signal.
- **Values animate** via `AnimatedNumber` (count-up on mount/change). Under
  `prefers-reduced-motion` the animation is killed globally — the value must
  still render correctly as its final number.
- **Money anywhere:** `font-mono font-figures`, tabular figures, localized via
  `lib/currency` (Persian digits under `fa`), IRR shown as Toman per §9.1.
  Negative amounts use `fin-negative` and a leading minus (never parentheses
  unless the Reports export already uses them).
- **KPI rows / metric strips:** max 4 metrics per row on desktop, 2-up on
  mobile; each cell is a Card, never a glass panel; never place more than one
  animated number in the same visual focal point.
- **Percentages:** one decimal place (`12.4%`), always paired with direction
  and period. Percent change of a near-zero base is omitted, not shown as
  ±9999%.

---

## 7. Liquid Glass

Liquid Glass is RIVA's one indulgence. It is what makes the phone experience
feel like a native app rather than a desktop layout squeezed onto a small
screen.

### 7.1 The rules

1. **Navigation only.** The floating tab bar, the mobile top bar, the desktop
   top bar, the More sheet. Cards, tables, forms and money surfaces stay
   **opaque and crisp** — blurring a table makes numbers harder to read, and a
   financial product that blurs its numbers has failed.
2. **One material.** Top bar and tab bar share the same recipe so the app reads
   as a single physical system.
3. **It does not invert.** Under `.dark` only the *tint* changes. Blur,
   translucency and border strength are properties of the material, not of the
   theme.
4. **It carries its own text.** Because the fill is a fixed brand material,
   content on it uses the fixed `deep-ink` / `warm-white` constants, not the
   theme-dependent `ink` / `onSignal` tokens.
5. **Floating, not welded.** Inset from the edges with a visible gap, rounded,
   with a shadow that separates it from content. Never a full-bleed strip.

### 7.2 The material

Defined once in `design-system/glass.ts`:

| Token | Light | Dark |
|---|---|---|
| Background | `white/65` | `surface/52` |
| Border | `white/50` | `white/10` |
| Blur | `20px` (18px top bar) | same |
| Shadow | `0 16px 40px -12px rgba(16,28,44,.22)` | `0 12px 32px -10px rgba(0,0,0,.45)` |
| Specular | white @ 45% | warm white @ 15% |

The **specular glow** is a soft radial highlight along the top edge standing in
for light catching a curved glass edge. It is the detail that separates "blurred
rectangle" from "glass". Keep it subtle — anything stronger reads as plastic.

Radius is `rounded-3xl` (28px) for the floating bar, which is the one place RIVA
is genuinely generous with rounding.

Usage:

```tsx
import { GLASS } from "@/components/webapp/glass";   // webapp
import { GLASS } from "@/components/layout/glass";   // frontend

<div className={cn("relative rounded-3xl", GLASS.base, GLASS.glow)} />
```

> **These are literal class strings, not dynamic ones.** Tailwind's JIT scans
> source text, so the class names must remain statically present in `glass.ts`.
> Never build them at runtime.

---

## 8. RIVA Advisor

### 8.1 What Advisor is

RIVA Advisor is the **intelligence layer**. Its purpose is to transform
financial data into meaning:

- business health · trends · risks · cash pressure · declines
- opportunities · recommendations · forecasts · actionable insights

It must **not** feel like a generic chatbot. The distinction is concrete:

| A chatbot | RIVA Advisor |
|---|---|
| Answers the question you asked | Tells you what you did not know to ask |
| Text in a bubble | Severity-ranked, structured findings |
| Says "revenue is up 12%" | Says "revenue is up 12% — but costs rose 31%, so margin fell" |
| Generic purple/cyan | Brand navy and the status ramp |

Advisor's authority comes from **being grounded in the real ledger**. Every
figure it shows must come from a tool call against the authenticated
business — never from the model's memory. The backend enforces this: tools
always execute with the authenticated `business.id` and the model is
instructed never to invent figures.

### 8.2 Severity model

Five levels, and the visual treatment must escalate monotonically — a
higher-severity finding must never look calmer than a lower one.

| Level | Token | Colour | Meaning | Example |
|---|---|---|---|---|
| `insight` | `--c-advisor-insight` | Brand navy | Informational | "Sales are concentrated in 2 clients" |
| `recommendation` | `--c-advisor-recommendation` | Moss | Do this | "Renegotiate the supplier contract" |
| `forecast` | `--c-advisor-forecast` | Steel | Projected | "Cash covers 6 weeks at the current burn" |
| `risk` | `--c-advisor-risk` | Amber | Needs attention | "Expenses up 31% while revenue is flat" |
| `critical` | `--c-advisor-critical` | Rose | Act now | "Runway under 3 weeks" |

Forecast is deliberately the **coolest** of the five, and forecast series are
additionally drawn with a **dashed stroke** in charts. A projection must never
look as certain as a fact.

### 8.3 Anatomy of an insight

```
┌──────────────────────────────────────────────┐
│ ◆ Risk        Expenses +31% vs revenue +4%   │  ← severity chip + headline
│                                              │
│ Costs grew far faster than revenue this      │  ← the "why", 2–3 lines max
│ quarter, compressing margin by 9 points.     │
│                                              │
│ Last 30 days · 41 transactions              │  ← grounding: metric + period
│                                              │
│ [ Review expenses ]            Disregard    │  ← optional action
└──────────────────────────────────────────────┘
```

Rules:

- **Lead with the finding, not with the framing.** "Expenses up 31%" beats
  "I've noticed a trend in your expenses".
- **Always cite the metric and the period.** "Revenue is down" is useless;
  "Revenue is down 12% over the last 30 days" is actionable.
- **Severity is visual first.** The chip colour must be readable before the text.
- **One recommendation per card.** A card that lists five actions has none.
- **Never state a number without its basis.** If Advisor cannot ground it, it
  must say the data is unavailable rather than estimate.

### 8.4 Component language

| Surface | Treatment |
|---|---|
| Insight card | `rounded-2xl bg-card ring-1 ring-line p-4`, severity chip top-start, optional action bottom |
| Severity chip | `rounded-full px-2 py-0.5 text-[10px] font-semibold`, `*-surface` background, `*-700` text |
| Health score | Semicircular SVG gauge + per-factor ring breakdown. Score is a number `0–100`, never a bare colour. |
| Recommendation | `advisor-recommendation` chip + a single primary action button |
| Forecast band | Steel fill at low opacity with a **dashed** boundary line; label carries the confidence |
| AI message | `rounded-bl-sm border border-line bg-surface`, `text-[14px]`, max width 360px |
| Thinking state | Three pulsing dots, `animate-pulse-dot`, staggered 0/150/300ms. **No typing animation, no fake progress bar.** |

### 8.5 Prohibited

- Purple, cyan, or any "AI gradient". Ever.
- Sparkle icons on every element (one sparkle marks the Assistant; that is enough).
- Avatar-with-a-robot-face.
- Typing character-by-character animations.
- Confidence expressed as a percentage with no basis.
- A recommendation the user cannot act on inside RIVA.

---

## 9. Financial UX

Financial data is where RIVA earns trust. These rules are the highest-priority
part of the system.

### 9.1 Currency model

This is business logic, not styling — but it dictates how amounts must render.

**Supported currencies:** `IRR`, `TOMAN`, `USD`, `EUR`, `GBP`
(`SUPPORTED_CURRENCIES` in `backend/schemas.py`, mirrored in
`lib/currency/index.ts`).

**The rules**

1. **A business has exactly one base currency, chosen at signup and permanent.**
   It is locked in three places: the schema (`BusinessCreate.base_currency` is
   required with no default; `BusinessUpdate` sets `extra="forbid"` so sending a
   new currency is a 422, not a silent ignore), the endpoint (every write
   overwrites the caller's currency with the business's), and the engine
   (`create_journal_entry` re-checks it so no future caller can bypass it).
2. **There is no currency conversion anywhere in the app.** No FX rates, no
   conversion table. Every amount is displayed in the base currency, as-is.
3. **Toman and Rial are distinct ledger units, not two names for one.** They are
   the same real-world currency at a fixed, exact 10:1 ratio, but RIVA treats
   `10,000 تومان` and `10,000 ریال` as genuinely different amounts rather than
   silently converting. The 10:1 scaling exists **only** in the AI's
   natural-language parser (`ai_service.normalize_amount`), so that a user who
   says "۵۰ هزار تومان" into a Rial business is understood correctly. It is
   **unit scaling, not an exchange rate**, and it is deliberately not applied to
   USD/EUR/GBP.
4. **Non-integral conversions are rejected**, not rounded. A Toman→Rial divide
   that yields a fractional Rial amount must fail loudly rather than quietly
   lose money.
5. The AI is explicitly forbidden from converting currencies
   (`ai_service` system-prompt rules).

**Formatting — `formatCurrency(amount, currency, locale, opts)` in
`lib/currency/index.ts`. This is the only sanctioned way to render an amount.**

| Currency | `en` | `fa` |
|---|---|---|
| `IRR` | `2,000,000 IRR` | `۲,۰۰۰,۰۰۰ ریال` |
| `TOMAN` | `2,000,000 TOMAN` | `۲,۰۰۰,۰۰۰ تومان` |
| `USD` | `$2,000.00` | ‎$۲٬۰۰۰٫۰۰ |
| `EUR` / `GBP` | `€2,000.00` / `£2,000.00` | symbol form |

Rules:

- **Never format an amount by hand** in a component. No `toLocaleString` on a
  money value, no manual thousand separators, no manual currency symbol.
- IRR and TOMAN are always rounded to a whole unit — they have no meaningful
  minor unit. USD/EUR/GBP always show exactly two decimals.
- Persian shows the natural Persian name (`تومان` / `ریال`); English shows the
  ISO code. Do not show `IRR` to a Persian user.
- `signed: true` prefixes `+` or U+2212 `−` for deltas.
- The business currency is the default currency for new businesses per locale:
  `fa → TOMAN`, `en → USD` (`defaultCurrencyFor`). Persian users think in Toman.

### 9.2 Sign, colour and meaning

> **Sign alone must never decide colour.**

A rising expense is bad news. A falling debt is good news. That is why
`StatCard` exposes `invertTrendColor`.

| Value | Colour | Token |
|---|---|---|
| Profit, surplus, positive cash flow | moss | `text-fin-positive` |
| Loss, deficit, negative cash flow | rose | `text-fin-negative` |
| 80%+ budget used, low runway, overdue soon | amber | `text-fin-caution` |
| A number with no directional meaning | slate | `text-fin-neutral` |
| Cash and cash equivalents | brand-neutral | `text-fin-cash` |
| Debt | amber until late, then rose | `text-fin-debt` / `text-fin-negative` |

**Negative values**

- Keep the minus sign inside the formatted number so the column aligns.
- Never render a negative as `(1,234)` in a user-facing surface; accounting
  parentheses belong in exported reports only.
- Never colour a negative red merely because it is negative. Colour follows
  meaning, and meaning follows direction *of the business*, not of the number.

**Percentages**

- One decimal place, always (`12.4%`). Never round a change to a whole percent
  when the change is small — `0.4%` is information, `0%` is a lie.
- `calc_change` returns `None` when both periods are zero and `"100.0"` when the
  previous period was zero and the current is not. Do not divide by zero to
  produce `Infinity` or `NaN` in the UI.
- Always state the period a percentage refers to.

### 9.3 Display rules per entity

**Revenue / Expenses**

- Always paired — a revenue figure without its expense counterpart is
  meaningless. Show both, and the resulting margin.
- Expenses are shown as positive magnitudes in expense contexts and as negative
  in net/cash contexts. Be consistent within a view.
- The trend chip (`StatCard`) carries the arrow, the percentage, and the
  comparison label ("vs last month").

**Cash**

- Cash is brand-neutral (`fin-cash`), never green. Cash is not a performance
  metric; colour-coding it green implies the business is doing well.
- Always show cash *and* a runway indicator ("≈ 6 weeks at the current burn").
  A cash number without runway is a number nobody can act on.

**Profit**

- Always show the margin next to the absolute figure. £4,000 profit means
  something completely different on £40,000 revenue than on £4M.
- Profit is `revenue − expenses` (i.e. `net_income`), computed by the backend.
  Never recompute it in the frontend.

**Transactions**

- `description` carries the visual weight; `category` and `date` are
  `text-ink-faint` metadata beneath it.
- Amount: `font-mono font-figures`, right-aligned, semantic colour.
- Income and expense rows use the **same component** with an inverted amount, so
  the two are visually comparable. Do not build a separate "expense row".
- Status is a badge, never colour alone.

**Accounts**

- Grouped by account type (`asset`, `liability`, `equity`, `revenue`, `expense`),
  ordered by account code.
- Show the account `code` (`1000`, `5100`) — it is how an accountant thinks.
- Balances are `font-mono font-figures`.
- Show `0.00` rather than hiding zero balances. An account that exists and is
  empty is information.

### 9.4 Trust signals

- **Every derived figure is inspectable.** A user must be able to see which
  transactions produced a number.
- **Never show an estimate as if it were a fact.** Forecasts are labelled,
  coloured `advisor-forecast`, and drawn dashed.
- **Never show fabricated comparison data.** If a prior period is unavailable,
  omit the comparison rather than synthesising one.
- **Timestamps and periods are always visible** on anything that can change.
- An empty result says "no data", never renders as zero without explanation.

---

## 10. Localisation and RTL

### 10.1 The model

Two locales, both fully supported: `en` (LTR) and `fa` (RTL).

| Concern | Implementation |
|---|---|
| Dictionaries | `lib/i18n/dictionaries/{en,fa}.ts`, both statically imported |
| Lookup | `t("nav.overview")` via `I18nProvider` |
| Direction | `html[dir]` written by the provider |
| Persistence | `localStorage["ledgerai.locale"]` |
| Digits | `toPersianDigits` in `lib/currency` |
| Fonts | `html[data-locale]` swaps `--font-ui` / `--font-ui-display` |

`fa.ts` is typed as `Dictionary`, so a key missing from Persian **fails
`tsc`**. This is the enforcement mechanism — do not loosen it.

### 10.2 Rules

1. **Never hardcode user-facing copy.** No string literals in JSX. If it needs
   translating, it belongs in a dictionary.
2. **Never hardcode a font family.** See §3.1.
3. **Never hardcode Persian digits.** Use `formatCurrency` / `formatNumber`.
4. **The locale is not the currency.** Persian users may run a USD business and
   vice versa. Language and money are independent.
5. **Adding a locale** means one dictionary file plus one `localeMeta` entry.
   No other file changes.

### 10.3 RTL

Persian is RTL and the whole layout must mirror. The rules:

**Always use logical properties.** Tailwind's directional utilities mirror
automatically under `[dir=rtl]`:

| Instead of | Use |
|---|---|
| `ml-2` / `mr-2` | `ms-2` / `me-2` |
| `pl-3` / `pr-3` | `ps-3` / `pe-3` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |

**Never** use physical `left`/`right` for layout, alignment or positioning.
They will not mirror.

**Direction-dependent artwork** needs explicit handling:

- Arrows, chevrons, trend arrows → `flip-rtl` class (mirrored by `globals.css`).
- The transaction-card flow arrow is chosen from `dir` explicitly
  (`dir === "rtl" ? ArrowLeft : ArrowRight`).
- Sliders/switches mirror their thumb travel.
- Off-canvas panels choose their offscreen offset from `dir`
  (`rtl ? -340 : 340`).
- **Charts are the exception:** they render `dir="ltr"` deliberately. Time flows
  left-to-right in both locales, and a mirrored revenue chart reads as
  declining-when-growing.

**Corner radii** must use logical corner utilities where the shape is
directional: `rounded-ss-sm`, `rounded-se-*`, not `rounded-tl-*`/`rounded-tr-*`.

**Numerals** stay LTR inside RTL text. Amounts, dates and percentages must not
be reordered by bidi. Where a number could be confused with surrounding text,
isolate it.

### 10.4 Known gaps

`useChat`'s fallback error strings are hardcoded Persian and therefore render in
Persian even in the English locale. This is a bug, not a pattern — see
`AGENT.md` → Known Issues.

---

## 11. Accessibility, performance, PWA

### 11.1 Accessibility

RIVA's density makes accessibility a discipline, not an afterthought.

- **Contrast** — body text ≥ 4.5:1, large text and UI boundaries ≥ 3:1.
  `ink-soft` (5.29:1) is the floor for body copy; `ink-faint` (3.81:1) is for
  labels ≥ 12px and non-text only. See the audit table in §2.4.
- **Never encode meaning in colour alone.** Status always carries an icon, a
  label, or both. This is especially true for financial direction.
- **Focus is always visible.** `:focus-visible` gives a 2px `--c-ring` outline
  with 2px offset globally. Never `outline: none` without a replacement.
- **Touch targets ≥ 44px** (`--touch-min`); no exceptions for icon buttons.
- **Inputs ≥ 16px on mobile** or iOS zooms on focus.
- **Semantic HTML first.** `<nav>`, `<main>`, `<header>`, `<button>`. A
  `<div onClick>` is a defect.
- **ARIA where it carries meaning:** `aria-current="page"` on the active nav
  item, `aria-expanded` on disclosures, `aria-live="polite"` on toasts and the
  thinking indicator, `role="tablist"`/`aria-selected` on tabs,
  `aria-label` on every icon-only button.
- **Charts are not accessible alone.** Every chart needs a text equivalent — a
  summary, a table, or a labelled insight.
- **Reduced motion** is respected globally and must not be overridden.
- Persian copy must use correct ZWNJ in compounds and natural phrasing, not
  machine translation.

### 11.2 Performance

- **The finance hot path is the budget.** The backend already caps analytics
  hot-path queries at one per function (`test_query_performance.py` asserts
  this). Do not reintroduce N+1 patterns in report generation.
- **AI calls are rate-limited and expensive.** Never call `/api/chat` in a loop,
  on mount, or speculatively. The rate limiter is per-user and per-IP.
- **Bundle discipline.** Both apps share ~88 kB of first-load JS. Charts,
  `xlsx`, `jspdf` and `jszip` are heavy — import them **dynamically** at the
  point of use (export flows), never at module top level.
- **`AnimatedNumber` is for KPI cards only**, never for long lists.
- **List rendering** — transactions can grow large. Paginate or virtualise
  before adding a hundred rows to the DOM.
- **Images** — RIVA has very few. Icons are `lucide-react` (tree-shaken) or the
  SVG brand assets via `next/image`.
- **No layout thrashing.** Animate `transform` and `opacity`, never
  `width`/`height`/`top`.
- **Respect `prefers-reduced-motion`** for anything non-essential.

### 11.3 PWA

RIVA is a **premium financial PWA**, not a marketing website. That means:

- **Installable** — `app/manifest.ts` (`display: "standalone"`, brand theme
  colour `#F7F7F3`, 192/512/maskable icons) plus a service worker. Both apps
  ship this; keep them in sync apart from `start_url` (`/overview` vs `/home`).
- **The service worker caches nothing.** `public/sw.js` registers and does not
  intercept requests. **Financial data must always come from the network.**
  Adding a cache is a product decision about staleness, not a performance tweak.
- **`viewportFit: "cover"`** with `env(safe-area-inset-*)` on every fixed
  element. This is what lets the glass bar float flush to the bottom edge.
- **Floating navigation** — the tab bar floats with a visible gap; it is not a
  strip welded to the bottom of the content.
- **Standalone mode has no browser chrome**, so the app owns its own safe areas
  and its own back navigation expectations.
- **Keyboard resilience** — the chat composer must sit above the virtual
  keyboard without layout jumps. 16px input text is what prevents the iOS zoom
  that causes most of those jumps.

---

## Appendix A — Quick reference

**Most-used classes**

```
bg-paper        text-ink          border-line
bg-surface      text-ink-soft     border-line-soft
bg-surface-muted text-ink-faint   ring-ring
bg-primary      text-primary-foreground  text-onSignal
text-fin-positive / -negative / -caution / -neutral
bg-advisor-insight-surface / -risk-surface / -recommendation-surface
rounded-sm (8)  rounded-md (12)  rounded-lg (16)  rounded-2xl (16 card)  rounded-3xl (28 nav)
shadow-subtle  shadow-card  shadow-raised  shadow-nav
font-sans  font-display  font-mono  font-figures
text-[13px] (UI)  text-[15px] (card title)  text-[17px] (page title)  text-[21-24px] (section)
max-w-content (1120px)  px-4 sm:px-6  space-y-6
```

**Before you commit**

```
npm run typecheck        # tsc --noEmit
npm run design:check     # design-system integrity
npm run build            # both apps
```

## Appendix B — Design system change log

| Date | Change |
|---|---|
| 2026-10 | Established `design-system/` as the single source of truth. Extracted the token layer out of two duplicated `globals.css` files and two duplicated `tailwind.config.ts` files into `design-system/tokens.css` + `design-system/tailwind-preset.ts`. Added the semantic layer (surfaces, text, borders, primary, accent, status, financial, advisor), non-colour tokens (elevation, radius, spacing, motion, layout), and dark-mode shadows. Unified the Liquid Glass material into `design-system/glass.ts`. Added `design-system/validate.mjs` to enforce token/theme parity and prevent the system from forking again. |
| 2026-10 | RIVA Main: aligned the font stack with RIVA Web (Inter / Manrope / JetBrains Mono / Vazirmatn), added the PWA manifest + service worker registration + viewport, and replaced the static bottom nav with the floating Liquid Glass bar. |
| 2026-10 | Fixed the missing `labels.*` i18n namespace, which caused raw dotted key paths (`labels.categories.rent`) to render in transaction rows, the overview table and expense charts. |
| 2026-10-07 | Added §6.17 Charts and §6.18 Financial metric displays (StatCard/KPI/money-cell rules, `chartColors.ts` contract, RTL chart exception, trend-favourability semantics). Added root `AGENT.md` as the companion working document (product, architecture, rules); this document remains the visual/behavioral source of truth. |
