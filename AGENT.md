# AGENT.md — Working on RIVA

This is the single entry-point document for AI coding agents (and new human contributors) working on this repository. Read it before making any change. The companion design document is [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — this file tells you **what the product is and how to work on it**; that file tells you **how it looks and behaves**.

Status of this document: written from the actual codebase on 2026-10-07 (branch `main`). Where something is *planned but not implemented*, it says so explicitly. Do not assume a feature works because it appears in the nav or in the README.

---

## 0. Operating procedure (mandatory, every task)

Follow this sequence before writing any code. It is not advice — skipping steps is how this codebase has been broken before (blank screens, language overrides, CORS login failures).

1. **Read this file first.** No task starts without it. If `CLAUDE.md` or a session hook pointed you here, treat everything below as binding.
2. **UI/UX tasks: also read the relevant sections of [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).** Component work → §6; new/changed colors, type, spacing, shadows, radius, motion → §2–§5; Advisor surfaces → §8; money display → §9; RTL → §10; accessibility/PWA → §11. Do not invent visual values — if the spec doesn't cover it, extend `design-system/` tokens, don't hardcode.
3. **Inspect the existing implementation before deciding how to implement.** Find the actual code paths, the component/hook/utility that already does the job, and how similar features are built. Assume your first idea already has a house style somewhere.
4. **Classify the target feature before touching it** — is it *implemented*, *demo/mock* (hardcoded data with a banner), *placeholder* (Coming Soon / dashed cards), or *planned-only*? Use §3's status matrix; verify against code, not docs or nav labels.
5. **Documentation is not proof.** README, root `*_FIX.md` notes, and even sections of this file can be stale (§11). A feature mentioned in docs may not exist; a "fix" note may describe an unapplied change. Verify in the working tree.
6. **Scope discipline.** Implement what the task asks — do not rewrite working architecture, restructure routes/nav, migrate patterns, or "improve" adjacent code to ship a small feature. Preserve backend, auth, accounting invariants, API contracts, transaction flows, and business logic (§9) unless the task *explicitly* requires changing them.
7. **Report pre-existing problems; don't silently absorb them.** If you discover a bug, broken import, or stale doc in an area you're about to modify (§11 lists known ones), surface it in your response *before or alongside* your change — never "fix" it as a drive-by unless the user asks. One task, one diff.
8. **Reuse before creating.** Existing `components/ui/*` primitives, design tokens, `lib/` utilities, hooks, and established patterns beat new ones. No new libraries, no duplicate components, no parallel versions of things that exist.
9. **After changing, verify before claiming done** with the checks appropriate to the change (§12): `design:check` + `tsc --noEmit` + `next lint` for any frontend/webapp work; backend tests for backend work; and for UI also confirm RTL, responsive (375 px), accessibility, dark mode, and PWA behavior are unbroken where relevant. Never report a task complete on unverified assumptions.
10. **Ambiguity → inspect, don't guess.** If requirements conflict with the repo or leave a gap, look at how the code actually behaves and how like features are built, then ask — don't invent semantics for money, language, or navigation.

---

## 1. What RIVA is

**RIVA** is AI-powered accounting and financial intelligence for **businesses** (not personal budgeting). Proprietary software by Mahan Karimi; the public repo is for demonstration only — no open-source license.

Product vision (from `README.md`): don't just show numbers — answer the questions behind them:

> **What is happening? Why does it matter? What should I do next?**

Four layers, in order of maturity:

1. **Accounting foundation** — real double-entry bookkeeping (journal entries, chart of accounts, balances, periods).
2. **Transactions & money movement** — income/expenses recorded against real accounts.
3. **Financial intelligence** — reports, trends, analytics, export (CSV/XLSX/PDF).
4. **RIVA Advisor / AI** — natural-language interaction with the books; insights, alerts, recommendations; eventually forecasts.

### Target users and use cases

- **Primary:** small-to-medium business owners and their accountants, in Iran and internationally, who want to record transactions quickly and understand business health without being accountants.
- **Secondary:** bookkeepers managing multiple business workspaces (multi-business switching is built in).
- **Language audiences:** English and Persian (Farsi) speakers; Persian is a first-class RTL experience, not an afterthought.

### Core product principles

1. **Calm before clever.** Premium, modern, calm, intelligent, minimal, trustworthy — Apple-like where appropriate. Never noisy, never "crypto dashboard".
2. **Numbers must be trustworthy.** Financial data is never fabricated, rounded silently, or shown in a misleading color. The ledger must always balance.
3. **Intelligence is grounded.** The AI answers from the user's real financial context via deterministic tools — it never invents figures. Rule: *the LLM interprets; the code computes.*
4. **Record → Understand → Decide.** Recording must be fast; understanding must be visual; deciding must be supported by the Advisor.
5. **Bilingual by default.** Every user-facing string is localized (en/fa), layout is RTL-safe, and currency display follows the business's rules.
6. **The app, not a website.** RIVA is primarily a premium financial **PWA** experience — especially on mobile.

---

## 2. Repository architecture

```
ledger-ai/
├── AGENT.md               ← you are here
├── CLAUDE.md              ← tiny pointer that forces Claude Code sessions to read AGENT.md
├── README.md              ← public product README (marketing tone)
├── start-riva.sh          ← opens 3 Terminal windows: backend :8000, frontend :3000, webapp :3001
├── design-system/         ← SHARED design tokens (single source of truth)
│   ├── tokens.css         ← all color/space/radius/shadow/motion tokens, light + dark
│   ├── tailwind-preset.ts ← rivaPreset consumed by BOTH apps' tailwind.config.ts
│   ├── glass.ts           ← Liquid Glass material (navigation only)
│   ├── validate.mjs       ← `npm run design:check` token/rule validator
│   └── README.md
├── docs/
│   ├── DESIGN_SYSTEM.md   ← the full design system spec (11 sections + appendices)
│   └── RIVA-Production-Readiness-Report.md
├── frontend/              ← "RIVA Desktop" — main web app, Next.js 14, port 3000
├── webapp/                ← "RIVA App" — mobile-first PWA, Next.js 14, port 3001
├── backend/               ← FastAPI + SQLAlchemy + PostgreSQL, port 8000
├── frontend-backup/ frontend_old/ frontend-before-final/   ← legacy copies, NEVER edit
└── *.md                   ← historical fix/verification notes (root clutter, mostly stale)
```

### The two frontends

| | `frontend/` (RIVA Desktop) | `webapp/` (RIVA App) |
|---|---|---|
| Port | 3000 | 3001 (`next dev -p 3001`) |
| Purpose | Full desktop app | Mobile-first premium PWA |
| Auth entry after login | `/overview` | `/home` |
| Route group | `app/(app)/` | `app/(shell)/` |
| Nav | Sidebar + floating `MobileNav` pill | Liquid Glass topbar + `MobileTabBar` (Home, Cash, Sparkle/Assistant, Reports, More) + `WebappSidebar` |
| Production | riva-snowy-beta.vercel.app | riva-app-inky.vercel.app |
| Code sharing | — | **Physical copy** of `lib/`, `components/ui/`, `components/motion/` and selected feature components from `frontend/`. No monorepo tooling. `webapp/node_modules` is a symlink to `frontend/node_modules`. |

**Critical implication:** there is no shared package. When you change a shared primitive (`components/ui/*`, `lib/api/*`, `lib/i18n/*`, `lib/motion/*`), you must **apply the same change to both copies** and keep their public APIs in sync. The dictionaries intentionally diverge (webapp has `webapp.*` keys; frontend has `advisor.*` etc.) — only add keys to the app that needs them, but never break the shared `Dictionary` type.

### Backend (`backend/`)

- FastAPI monolith — **all ~33 routes live in `main.py`** (no routers). SQLAlchemy 2.0 typed models (`models.py`), Alembic migrations (`alembic/`), PostgreSQL (psycopg v3; local `.env` points at `postgresql+psycopg://localhost/ledgerai`).
- Key modules: `accounting_service.py` (double-entry core), `account_service.py` (default chart of accounts), `analytics_service.py` / `report_service.py` (reports + export), `ai_provider.py` / `ai_service.py` / `ai_tools.py` (AI layer), `transaction_recorder.py` (intent → journal entry), `conversation_service.py` (chat persistence), `permissions.py` (**new, not yet wired in**), `rate_limiter.py`, `timeout_middleware.py`.
- Run: `backend/run-backend.sh` (requires `backend/.venv`) → uvicorn on `0.0.0.0:8000`.
- Tests: `backend/test_*.py` (59+ tests, incl. query-performance regressions). Run with the venv's pytest.

### How the pieces connect

```
frontend (3000) ─┐
                 ├─► FastAPI backend (8000) ─► PostgreSQL
webapp   (3001) ─┘        │
                          └─► OpenAI-compatible LLM API (OPENAI_BASE_URL / OPENAI_API_KEY)
```

Both frontends read `NEXT_PUBLIC_API_URL` from `.env.local` (dev: `http://localhost:8000`; prod: `https://riva-kwbg.onrender.com`). **If this var is missing in Vercel, login silently breaks** (requests go to Vercel itself) — see `PRODUCTION_FIX.md`.

---

## 3. Features: implemented vs planned

### Implemented and functional

- **Auth** — signup/login/logout, JWT access tokens (15–30 min) + refresh tokens (30 days, in-memory JTI replay guard), bcrypt, email verification & password-reset flows (endpoints exist), profile setup modal.
- **Multi-business** — a user can own/belong to several businesses; `POST /api/auth/switch-business`; settings CRUD; **base currency is locked at creation** (backend rejects changes; UI shows `CurrencyLockWarning`).
- **Dashboard** (`/overview`) — stat cards, expense chart, financial overview, health score, money movement, accounts, recent transactions. Falls back to demo data with a visible banner when the API is empty/unreachable.
- **Transactions** (`/transactions`) — real list with search, type tabs, filters; Add-income modal with numeric keypad.
- **Accounts** (`/accounts`) — chart of accounts (Cash 1000, Bank 1010, A/R 1100, A/P 2000, Equity 3000, Sales 4000, expense 5000s seeded by `create_default_accounts`).
- **Reports** (`/reports`) — period tabs, heatmap, category donut, month comparison, recurring detector, AI insights (client-side heuristics in `lib/analytics.ts`, not LLM). Export CSV/XLSX/PDF via backend `POST /api/businesses/{id}/reports/export`.
- **Income / Expenses** — real transaction lists filtered by sign.
- **AI Assistant** (`/assistant`, webapp `/assistant`) — full chat: `POST /api/chat` → optional `resolve` (user picks account) → `confirm` (server re-validates and posts journal entries). Conversation history persisted server-side, auto-titled. Transaction confirmation cards use the `.receipt-tear` motif. Report download from chat.
- **Settings** — profile, business workspaces, AI preferences, appearance, language, import/export.
- **i18n** — en + fa, persisted in `localStorage["ledgerai.locale"]`, sets `dir`/`lang`/`data-locale` on `<html>`; `labels.ts` localizes backend free-text categories.
- **PWA (both apps)** — manifest + service worker + icons; `viewportFit: "cover"`, theme color `#F7F7F3`.
- **Backend AI tooling** — 13 deterministic tools (`get_financial_analytics`, `get_profit_loss`, `record_transactions`, …), max 3 tool rounds per question, financial context injection (balances, 30-day totals, chart of accounts, owner `context_text`), Persian amount parsing (هزار/میلیون/میلیارد, Persian digits), 10:1 toman↔rial normalization.

### Demo-only (hardcoded data, visible "demo" banner)

`/budgets`, `/goals`, `/debts`, `/subscriptions`, `/calendar` — these contain local demo arrays (`demoBudgets`, `demoData` etc.). **There is no backend budget/goal/debt/subscription model.** Do not pretend otherwise in UI copy or docs.

### Placeholder / foundation

- **`/advisor` (RIVA Advisor page)** — a "Foundation" screen with 5 empty cards (Business Health, Key Insights, Recommendations, Forecasts, Reports), each a dashed "coming soon" box. The intelligence itself does not exist yet on this page; the closest real implementations are the Assistant, `analytics_service.generate_recommendations` (rule-based), and the Reports page's heuristics.
- **`/help`** — `ComingSoonPage`.

### Planned but NOT implemented (do not fake as done)

- Cash-flow / revenue **forecasting** (zero `forecast` code in the backend).
- Budgets, goals, debts, subscriptions as real data (backend + UI are demo).
- Advisor dashboard with real insights/recommendations/forecasts.
- Role-based access enforcement — `permissions.py` defines owner/accountant/viewer RBAC but **`main.py` never imports it** (routes only check business ownership; a `# Future: add role-based access checks here` marker exists).
- Backend email sending (verification/reset tokens exist; delivery mechanism is not wired to a real mail provider).

### Product IA (target navigation)

```
Operate       → Dashboard, Transactions, Accounts            [implemented]
Financials    → Reports, Income, Expenses                    [implemented]
Intelligence  → RIVA Advisor
                ├ Business Insights / Recommendations        [planned]
                ├ Ask RIVA                                   [implemented as /assistant]
                └ Financial Analysis                         [planned]
Planning      → Budgets, Goals, Debts, Subscriptions         [demo UI only]
System        → Help [placeholder], Settings [implemented]
```

Actual nav lives in `frontend/components/layout/nav-items.ts` and `webapp/components/webapp/nav-items.ts` (different groupings per app — see §2). The desktop sidebar also lists Calendar under Plan and AI Assistant under Operate; don't restructure nav without the owner's explicit direction.

---

## 4. Domain concepts

- **User** — email + bcrypt password hash. May belong to many businesses.
- **Business** — the tenancy boundary. Has `name`, `language` (signup path passes `"en"`; the `models.py` column default is still `"fa"` — signup is what runs in practice), `base_currency` (default `"IRR"`, **immutable after creation**), `context_text` (free-text background the AI uses), `owner_id`. All financial data is scoped to a business.
- **BusinessMember** — user↔business with `role` ∈ `owner | accountant | viewer` (table + migration exist; enforcement not wired).
- **Account** — chart-of-accounts node with `account_type` and a `code`.
- **JournalEntry / JournalLine** — the heart of the ledger. **A "transaction" in the UI is a journal entry** (typically 2 lines: debit + credit). Every entry must satisfy Σdebits = Σcredits; each line has exactly one of debit/credit > 0; currency must equal the business `base_currency`.
- **AuditLog** — append-only who/what/when for sensitive writes.
- **ChatConversation / ChatMessageRow** — persisted assistant conversations (`role`, `msg_type`, `content`, `action_json`).

### Authentication model

- Access JWT (HS256, 15–30 min, `JWT_ACCESS_TOKEN_EXPIRES_MINUTES`) + separate refresh JWT (default 30 days, `JWT_REFRESH_SECRET_KEY`, JTI replay protection — in-memory; swap to Redis before scaling).
- Frontend stores tokens in `localStorage` (`ledgerai.access_token`); `lib/api/client.ts` attaches `Authorization: Bearer`, enforces a **60 s request timeout**, throws typed `ApiError`.
- `AuthGate` (`components/auth/`) gates both apps; `AuthProvider` in `app/providers.tsx` exposes login/signup/logout/switchBusiness/… and `needsProfileSetup`.
- Backend CORS is an **explicit origin allowlist** in `main.py` (localhost:3000–3002 + the two Vercel domains) with a custom exception handler that re-adds CORS headers to `HTTPException` responses. **Production origins must stay in this list or login breaks.**

---

## 5. Currency and localization rules

### Currency model (financial correctness — read twice)

- Supported: **IRR, TOMAN, USD, EUR, GBP** (`schemas.SUPPORTED_CURRENCIES`; DB `CheckConstraint`).
- A business has exactly one **base currency**; every journal entry must be in it (no FX translation exists).
- **Toman vs Rial:** they are the *same unit scaled 10:1*, not an FX rate. `ai_service.normalize_amount` converts spoken تومان ↔ ledger IRR with exact 10:1. The UI convention: **IRR amounts are displayed as Toman (÷10)** — see `frontend/lib/currency` and `docs/DESIGN_SYSTEM.md §9.1` before touching any amount formatting.
- Money is stored `Numeric(20,2)`; rendered with tabular figures (`.font-figures` / JetBrains Mono). Never use floats for money in new code.
- Negative values are meaningful (expenses, negative cash flow) and have dedicated semantic tokens (`--c-fin-negative` etc.). Follow `DESIGN_SYSTEM.md §9.2` for sign/color rules — red/green are **semantic only**, never decorative.

### Localization and RTL

- Two locales: `"en"` (LTR) and `"fa"` (RTL). Default is **English**; user choice persists in `localStorage["ledgerai.locale"]` and is **not** overridden by `business.language` after login.
- `I18nProvider` (`lib/i18n/index.tsx`) sets `document.documentElement.dir / lang / data-locale`. This drives:
  - **fonts** — `html[data-locale="fa"]` swaps `--font-ui`/`--font-ui-display` to **Vazirmatn**;
  - **direction** — all layout must use **logical CSS utilities** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start/end`, `border-s/e`), never physical `ml/mr/pl/pr/left/right` for layout.
- Translations: `lib/i18n/dictionaries/en.ts` + `fa.ts` (typed `Dictionary`), accessed via `t("dot.path", {vars})`. **Every new user-facing string must be added to both dictionaries of the app you're editing.** Missing keys render the raw path — that's a bug.
- Backend AI replies follow the **language of the user's current message** (`language_detect.detect_language`), not the business locale. Backend report rows carry `label_fa` fields.
- Persian typography: Vazirmatn; Persian digits handled by `lib/currency`. Do not force Latin fonts on Persian text.
- **Known gap:** the frontend `useChat` error strings are hardcoded Persian — see §11 Known Issues.

---

## 6. RIVA Advisor / AI — role and rules

The AI layer is the product's differentiator. Its job is to **transform financial data into meaning**: business health, trends, risks, cash pressure, declines, opportunities, recommendations, forecasts, actionable insights.

### How it actually works today

1. `POST /api/chat` → `ai_service.process_message` classifies *question* vs *transaction request*.
2. Deterministic financial context is injected (business, currency, chart of accounts, 30-day totals, balances, recent transactions, owner `context_text`, last 12 chat turns).
3. An OpenAI-compatible LLM (`OPENAI_MODEL`, default `gpt-4o`; any compatible `OPENAI_BASE_URL`) is called with **13 deterministic tools**; up to 3 tool rounds; temperature 0.2. Tools execute real SQL-backed analytics — **the LLM never computes money**.
4. For money-moving requests the model produces a **preview** only (`record_transactions` → `transaction_recorder.resolve_action` against real accounts). **Nothing is written until the client calls `POST /api/chat/confirm`**, which re-validates (`validation_service`) and posts journal entries + audit logs. Multi-account ambiguity goes through `POST /api/chat/resolve`.
5. Rate-limited: burst 5/10 s + 30/min per user (429 + `Retry-After`).

### Rules for AI features

- **Never** let the model be the source of a number shown as fact. Every figure in AI output must come from a tool or be explicitly framed as an estimate.
- **Never** auto-commit financial writes — always preview → explicit confirm.
- Advisor UI must follow the **severity model** in `DESIGN_SYSTEM.md §8` (insight / recommendation / forecast / risk / critical, each with its own token) — Advisor must never look like a generic chatbot: no robot avatars, no purple AI gradients, no sparkle-cliché overload.
- Forecasts must be labeled as projections, never presented as recorded facts.
- Failures must be localized and honest (no silent mock fallback — the old `mockChat` path is dead code; do not resurrect it).

---

## 7. Design system rules

**Single source of truth:** `docs/DESIGN_SYSTEM.md` (spec) + `design-system/` (code). Both apps consume it:

- `design-system/tokens.css` is `@import`ed at the top of each app's `app/globals.css`.
- `design-system/tailwind-preset.ts` is spread into each app's `tailwind.config.ts` via `presets: [rivaPreset]`.
- `components/layout/glass.ts` (frontend) and `components/webapp/glass.ts` (webapp) both re-export `design-system/glass`.

### Non-negotiable rules

1. **Never hardcode hex/rgb colors in app CSS or components.** Use Tailwind classes backed by tokens (`bg-surface`, `text-ink`, `border-line`, `bg-signal-500`, …) or CSS vars (`var(--c-…)`). The only allowed literal is `#F7F7F3` where a manifest/PWA theme color requires it. Enforced by `design-system/validate.mjs`.
2. **Never add `dark:` variants for token-based colors.** Tokens already flip under `.dark`; `dark:` duplications double-maintain and drift. (Layout-only `dark:` utilities are acceptable.)
3. **Never fork the design system.** No new color ramps, no app-local token files, no one-off palettes. Extend `tokens.css` + `tailwind-preset.ts` (both layers together), then run the validator.
4. **Brand palette is fixed:** Warm White `#F7F7F3`, Steel Blue `#71879B`, Deep Navy `#101C2C`, Deep Ink `#10131A`, Slate Blue `#607D94`, plus desaturated status amber/rose/moss. Do not introduce purples, cyans, "AI gradients", or the old teal accent.
5. **Liquid Glass is navigation-only** (`design-system/glass.ts`): the floating mobile nav, topbar, tab bar. It does not invert in dark mode — only tint. Content surfaces stay crisp (`bg-surface` + `ring-line`). Do not spray glassmorphism across cards/sections.
6. **Type:** Manrope (display), Inter (UI), JetBrains Mono (money/tabular figures), Vazirmatn (Persian). IBM Plex Sans is a legacy fallback — if you find a reference it's stale.
7. **Motion:** tokens `--dur-fast/base/moderate/slow` (120/180/240/320 ms) and `--ease-riva` / `--ease-standard`; framer-motion uses `lib/motion/tokens.ts`. Respect `prefers-reduced-motion` (already killed globally in `globals.css`).
8. **Signature motif:** `.receipt-tear` on transaction confirmation surfaces — use it, don't overuse it elsewhere.
9. **Run the validator** after any token/style change: `npm run design:check` in either app (→ `node ../design-system/validate.mjs`).

Full component specs (sizes, states, spacing, mobile behavior), color semantics, financial UX, Advisor visual language, and RTL rules: **`docs/DESIGN_SYSTEM.md`**. Read the relevant section before building any new UI.

### PWA and mobile experience

- RIVA is a **premium financial PWA**, not a website. Mobile nav is a **floating liquid-glass bar** (frontend: 5-item pill with raised center Assistant hero; webapp: `MobileTabBar`) — never a static bar glued to the bottom of page content, and never a plain white sticky header.
- Safe areas: `viewportFit: "cover"` is set; use `env(safe-area-inset-*)` and keep the measured ~76 px clearance above the floating tab bar (chat composer pattern).
- Mobile touch: ≥ 40 px controls (44 px ideal), 16 px input font size (prevents iOS zoom), `touch-manipulation`.
- **Service worker (`sw.js`) must remain network-only for data** — it exists to make the app installable; caching financial responses is forbidden.
- Avoid: excessive cards, gradients, AI visual clichés, huge typography, over-rounded corners, desktop-style glass everywhere, visual clutter.

### Accessibility (minimum bar)

- Visible `:focus-visible` ring (already tokenized as `--c-ring`); never remove outlines without a replacement.
- Semantic landmarks/headings; buttons are `<button>`; icon-only buttons carry `aria-label`.
- Color never the sole signal — pair with text/icon (critical for financial states).
- Localized `aria-label`s for icon buttons in both languages.
- `prefers-reduced-motion` respected (global kill switch exists — don't opt elements out of it).

---

## 8. Coding conventions

### Frontend / webapp (TypeScript, React 18, Next.js 14 App Router, Tailwind 3)

- **Stack constraints (deliberate):** no Radix, no CVA, no styled-components — RIVA uses **hand-rolled UI primitives** in `components/ui/`. Follow their API shape when extending. framer-motion ^11, recharts, lucide-react.
- **Files:** components PascalCase (`AssistantChatView.tsx`); hooks `useX.ts`; i18n dictionaries typed and exhaustive; one component per file, feature folders (`components/chat/`, `components/dashboard/`, …) over deep nesting.
- **Naming:** routes are lowercase single segments (`/overview`, `/transactions`); i18n keys are dot-namespaced (`sidebar.overview`, `webapp.nav.home`, `assistant.*`); CSS classes come from Tailwind tokens, not ad-hoc names (exceptions: `.font-figures`, `.receipt-tear`, `.flip-rtl` — defined in `globals.css`).
- **Data:** all network calls go through `lib/api/client.ts` (`apiRequest` — timeout, auth header, `ApiError`). Never `fetch` directly from components. Keep the 60 s default timeout unless there's a measured reason.
- **State:** server state via the existing hooks (`useAccounts`, `useReports`, `useChat`, …) — no new global state library.
- **i18n:** no hardcoded user-facing English/Persian strings in components; always `t(...)`.
- **Both copies:** shared-component edits are applied to `frontend/` **and** `webapp/` (except app-specific keys/components noted in §2).
- **Comments:** only for non-obvious *why*; no narrating comments or task references.

### Backend (Python, FastAPI, SQLAlchemy 2.0)

- Routes live in `main.py`; services do the work in dedicated modules. New business logic belongs in a service, not in route handlers.
- All money math via `Decimal`/`Numeric(20,2)`; enforce Σdebits = Σcredits in `create_journal_entry` — never bypass it with direct ORM writes.
- Every financial write path validates: business ownership, currency == base_currency, account existence, permission intent.
- Endpoints that do I/O stay **sync `def`** (FastAPI threadpool) — converting to `async def` blocks the event loop and was an explicitly avoided regression (see Production Readiness Report).
- New tables need Alembic migrations; keep `models.py` import-clean (see Known Issues).
- Tests: add/extend `backend/test_*.py`; the query-performance suite (`test_query_performance.py`) guards against N+1 regressions — any new analytics function should follow the `joinedload` pattern.
- Rate limits and timeouts apply to new endpoints — reuse `rate_limiter.py` / `timeout_middleware.py` conventions.

### Git / workflow

- Branch history: `main` plus feature branches (e.g. `shadcn-fintech-ui-merge`, `riva-production-scalability-audit`). Commit style: conventional prefixes (`fix:`, `feat:`, `chore:`, `docs:`), lowercase, imperative.
- End commits with:
  ```
  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- **Never commit** `.env`, `.env.local`, `node_modules/`, `.next/`, `.venv/`, or the legacy `frontend-backup/`/`frontend_old/`/`frontend-before-final/` trees.
- Root is cluttered with session fix-notes (`*_FIX.md`, `VERIFICATION_COMPLETE.md`, zips). Treat them as historical records, not instructions; don't create more of them — put durable knowledge in `docs/` or this file.
- The repo is public but **proprietary** — don't add licenses, don't publish secrets, don't assume open-source norms.

---

## 9. What must NOT be changed or broken

1. **The ledger invariants** — debits = credits, single base currency per business, no floats for money, per-business advisory lock on journal writes (`pg_advisory_xact_lock`). Data corruption is the one unrecoverable failure.
2. **Auth & tenancy** — JWT flow, bcrypt, business-scoped queries (`business_id` filters), CORS origin allowlist, rate limits. Never widen CORS to `*`, never log tokens/passwords, never store secrets client-side.
3. **The preview → confirm AI write flow** — AI must never write to the ledger without server-side re-validation and explicit user confirmation.
4. **Route-level `AnimatePresence` around routed children** — this caused a full blank-screen regression. Keep `AnimatePresence` strictly scoped to individual UI elements (sidebar, modals, messages). `PageTransition` exists but is intentionally **not mounted** in `(app)/layout.tsx`.
5. **The design-system wiring** — `@import tokens.css`, `presets: [rivaPreset]`, `design:check` passing. Don't re-inline tokens into app configs.
6. **Liquid Glass scope** — navigation only; content stays crisp.
7. **Both apps' ports/entry contracts** — 3000 (`/overview` after login) and 3001 (`/home` after login); don't swap routes between apps.
8. **Service worker stays network-only** for data.
9. **Base currency immutability** and the IRR→Toman display convention.
10. **The legacy directories** — never edit `frontend-backup/`, `frontend_old/`, `frontend-before-final/`; ideally never even open them (stale duplicates cause confusion).
11. **Existing working features listed in §3** — demo banners, localization, export, chat confirm, business switching.

---

## 10. Rules for modifying and adding features

### Modifying an existing feature

1. Find every copy: grep both `frontend/` and `webapp/` (and `backend/` if it touches API/data).
2. Read the relevant `docs/DESIGN_SYSTEM.md` section first (components, financial UX, Advisor, RTL).
3. Preserve behavior contracts: i18n keys in both languages, RTL-safe logical properties, token colors only, localized AI/error strings.
4. Don't "clean up" adjacent code — scoped diffs. The repo has a history of regressions from well-intentioned broad refactors (blank screen, language override, CORS).
5. Verify: `./node_modules/.bin/tsc --noEmit` + `next lint` per app (see §11), `npm run design:check`, and backend tests if API touched.
6. If the change alters user-visible behavior, update the relevant dictionary keys and any doc section that describes it.

### Adding a new feature

1. **Decide the layer first:** real data (backend model + migration + service + routes + tests) vs demo/placeholder (must be visibly labeled as demo).
2. Backend: service module → routes in `main.py` → Alembic migration → tests. Scope every query by `business_id`. Apply rate limiting for anything expensive.
3. Frontend: add the route in the correct app(s), add it to `nav-items.ts`, add `t()` keys to **both** dictionaries, build UI from `components/ui/` primitives with token classes, handle loading/empty/error states (`StateViews.tsx`), verify RTL, verify mobile at 375 px.
4. New *design* elements (new color need, new radius, new motion) require extending `design-system/` (tokens.css + preset together), not ad-hoc values.
5. Follow the existing IA (§3) — don't invent parallel navigation structures.
6. For AI features: deterministic tool + context injection + preview/confirm — never free-form model writes.

### Environment / configuration notes

- Frontends: `NEXT_PUBLIC_API_URL` (the single most common production break — see `PRODUCTION_FIX.md`).
- Backend: `DATABASE_URL`, `JWT_SECRET_KEY` (≥32 chars), `JWT_REFRESH_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` (clamped 15–30), `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`, `HOST`/`PORT`/`RELOAD`. Template: `backend/.env.example`.
- AI degrades gracefully when unconfigured (`ai_provider.is_configured()`), with a user-facing message — keep that path working.
- Production: frontends on Vercel, backend on Render (`https://riva-kwbg.onrender.com`), DB Neon Postgres (pooler quirks — see `test_neon_pooler_fix.py`, `DATABASE_FIX.md`).

---

## 11. Known issues and traps (as of 2026-10-07)

Verified against the working tree — treat as live landmines:

1. **Backend working tree does not import.** Uncommitted changes: `auth.py` **removed `get_current_user`** while `main.py:32` still imports it, and `models.py` uses `UniqueConstraint` without importing it (and defines `BusinessMember` twice — lines ~153 and ~514). `import models` raises `NameError`; the server cannot start. Likely another session mid-refactor (a `permissions.py` RBAC layer exists but is unwired and itself references an undefined `user.id`). **Do not build on top of this state — confirm it's resolved before backend work.**
2. **`next build` fails in sandboxed environments** — `next/font/google` fetches (Manrope, Inter, JetBrains Mono, Vazirmatn) are blocked by network egress. This is *not* a code regression. Verify with `./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/next lint` (use local binaries — `npx` tries to fetch from npm). `next dev` works.
3. **Authenticated visual QA needs the real backend + login** — in a sandbox the auth gate shows the login screen and the authenticated shell can't be reached. Full QA (light/dark/RTL/mobile) requires the owner to run all three processes and log in.
4. **Stale docs:** `frontend/DESIGN.md` was rewritten (2026-10-07) as a pointer to the design system — if you find an older copy describing "Signal teal #0E7C6B" or paper `#F7F7F4`, it's superseded (primary is Deep Navy `#101C2C`, paper is `#F7F7F3`). `frontend/README.md` still references a removed `lib/mock/mockChat.ts` fallback and says tokens live in `tailwind.config.ts`. **`docs/DESIGN_SYSTEM.md` + this file win over both.**
5. **`useChat` hardcoded Persian error strings** (frontend) — error bubbles don't follow locale; fix by routing through `t()`.
6. **Duplicate i18n dictionaries** (frontend vs webapp) drift by design; when you fix a shared string, check both apps.
7. **`webapp/lib 2/` and `webapp/webapp/`** — stray duplicate directories; ignore/do not import from them.
8. **`switch-business` endpoint defined twice in `main.py`** — later definition wins; harmless but confusing.
9. Root `.md` fix-notes describe point-in-time states (CORS, production login, PWA icons) — always re-verify against code rather than trusting a fix-note.

---

## 12. Quick reference — commands

```bash
# All three services (macOS, opens Terminal windows)
./start-riva.sh

# Backend
cd backend && ./run-backend.sh          # needs .venv; uvicorn :8000
cd backend && .venv/bin/python -m pytest test_*.py

# Frontend (desktop, :3000) — note local binaries, not npx
cd frontend && npm run dev
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/next lint
cd frontend && npm run design:check     # design-system validator

# Webapp (mobile PWA, :3001)
cd webapp && npm run dev
cd webapp && ./node_modules/.bin/tsc --noEmit
cd webapp && npm run design:check
```

**Before you finish any UI change:** design:check → tsc → lint → (if possible) visual check in light **and** dark, en **and** fa (RTL), desktop **and** 375 px mobile.
