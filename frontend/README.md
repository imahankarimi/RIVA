# RIVA AI — frontend

An AI-first accounting assistant UI. Talk to it in Persian or English; it
turns what you say into a plain-language transaction confirmation, and
posts the actual debit/credit entry to the accounting engine underneath —
without ever making the user think in accounting terms.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · lucide-react

## Getting started

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your FastAPI backend
npm run dev
```

Open http://localhost:3000 — it redirects to `/overview`.

If `NEXT_PUBLIC_API_URL` isn't reachable, the **AI Assistant** page falls
back to a small local simulator (`lib/mock/mockChat.ts`) so the product is
demoable without a running backend. The moment `/api/chat` responds
successfully, the real backend takes over — no code changes needed. Remove
`lib/mock/mockChat.ts` and the fallback branch in `lib/hooks/useChat.ts`
once the backend is always available.

## Structure

```
app/
  (app)/            route group for the authenticated shell (sidebar + bottom nav)
    assistant/       the AI Assistant — the product's primary screen
    overview/        dashboard
    transactions/    searchable transaction history
    accounts/        chart of accounts, grouped and expandable
    reports/         P&L / cash flow / revenue / expenses
    settings/        business, language, currency, AI + account prefs
  layout.tsx         fonts, html dir/lang plumbing
  providers.tsx      I18nProvider + BusinessProvider

components/
  layout/            Sidebar, MobileNav, Topbar
  chat/               message bubble, transaction card, input, thinking state
  dashboard/          stat cards, recent transactions
  transactions/       filters, row (table row on desktop, card on mobile)
  accounts/           expandable account-type group
  reports/            minimal inline bar chart (no charting lib dependency)
  settings/           section/row primitives
  ui/                 Button, Card, Badge, Chip, Switch

lib/
  i18n/               locale context + en/fa dictionaries — add a language
                       by dropping in a new dictionary + one localeMeta entry
  currency/           formatCurrency — hides raw IRR, always shows Toman
  api/                typed client for /api/chat, /api/chat/confirm,
                       /api/businesses, /api/businesses/{id}/accounts
  hooks/useChat.ts     chat orchestration: send → confirm → post
  mock/               demo data + the chat fallback simulator described above
  types.ts            shared domain types
```

## Design system

See the tokens in `tailwind.config.ts` (`ink`, `paper`, `signal`, `line`,
`amber`, `rose`, `moss`) and the notes in `DESIGN.md` for the reasoning
behind the palette, type pairing, and the receipt-tear motif used on the
transaction card.

## i18n / RTL

`<html dir>` and `lang` are set from `I18nProvider` on the client. All
spacing in components uses Tailwind's logical-property utilities
(`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) rather than `ml-`/`mr-`/`left-`/`right-`,
so the layout mirrors correctly for Persian without per-component RTL
overrides. Numbers are rendered as Persian digits in `fa` and Latin digits
in `en` via `lib/currency`.

## Currency

`formatCurrency(amount, currency, locale)` — IRR is always shown to the
user as Toman (rials ÷ 10), never as raw IRR. USD/EUR/GBP use their
symbols. The accounting engine can keep working in rials/cents internally;
this utility is the single seam where that gets translated for humans.
