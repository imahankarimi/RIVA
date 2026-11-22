# RIVA Feature Parity — Comprehensive Discovery Matrix

**Status:** Phase 1-2 Investigation (Frontend + Webapp mapping)  
**Created:** 2026-11-11

---

## Executive Summary

The webapp requires systematic feature parity with the frontend. Both apps use shared component libraries via physical copy and consume the same backend APIs. Key differences:

| Aspect | Frontend | Webapp |
|--------|----------|--------|
| **Port** | 3000 | 3001 |
| **Auth Entry** | `/overview` | `/home` |
| **Route Group** | `(app)/` | `(shell)/` |
| **Header** | `Topbar` | `WebappHeader` |
| **Nav** | Sidebar + floating pill | Liquid Glass topbar + bottom bar |
| **Mobile-first** | No | Yes (PWA) |
| **UI Size** | Desktop-optimized | Mobile-first (375px+) |

---

## PHASE 1: FRONTEND FEATURE INVENTORY

### ✅ Fully Implemented Features

#### A. Authentication & Tenancy
- ✅ Login/Signup (`/login`, `verify-email`)
- ✅ Password reset (`/reset-password`)
- ✅ JWT + refresh token flow
- ✅ Multi-business switching
- ✅ Session management

**Backend Endpoints:**
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
POST /api/auth/switch-business
```

#### B. Dashboard / Overview
**Route:** `/overview` → `HomeLayout` + multiple components

**Components:**
- `StatCard` — KPI cards (4-column grid on desktop)
- `FinancialOverview` — Multi-metric summary
- `MoneyMovement` — Account flow visualization
- `HealthScoreCard` — Business health metric
- `AccountCards` — Account list with balances
- `RecentTransactionsTable` — Transaction summary (5-10 rows)
- `ExpenseCategoryChart` — Pie/donut chart

**Data Displayed:**
```
stats: {
  balance: number,          // assets - liabilities
  revenue: number,          // sum of revenue accounts
  expenses: number,         // sum of expense accounts
  cashFlow: number          // revenue - expenses
}
recentTransactions: Transaction[]  // sorted by date, desc
accounts: Account[]                 // by type
```

**API:** `GET /api/businesses/{id}/accounts` + `GET /api/businesses/{id}/transactions`

**Calculations:**
- Balance = Σ(asset.balance) - Σ(liability.balance)
- Revenue = Σ(revenue account.balance) [if > 0]
- Expenses = Σ(expense account.balance) [if > 0]
- Cash Flow = Revenue - Expenses

#### C. Transactions
**Route:** `/transactions`

**Features:**
- ✅ Transaction list with search
- ✅ Type tabs (Income / Expense / All)
- ✅ Category filtering
- ✅ Date range filtering (`all`, `today`, `thisWeek`, `thisMonth`, `thisYear`)
- ✅ Add Income modal (numeric keypad)
- ✅ Import/Export (CSV/XLSX/PDF)
- ✅ Transaction details modal
- ✅ Delete transaction
- ✅ Edit transaction

**API Endpoints:**
```
GET /api/businesses/{id}/transactions
POST /api/businesses/{id}/transactions
PUT /api/businesses/{id}/transactions/{id}
DELETE /api/businesses/{id}/transactions/{id}
POST /api/businesses/{id}/transactions/import
POST /api/businesses/{id}/reports/export
```

#### D. Accounts
**Route:** `/accounts`

**Features:**
- ✅ Chart of accounts (account type grouping)
- ✅ Account balance display
- ✅ Account type labels (Asset, Liability, Equity, Revenue, Expense)
- ✅ Account code (e.g., 1000, 1010, 1100)
- ✅ Create account
- ✅ Edit account
- ✅ Delete account
- ✅ Account details modal

**Default Accounts Created:**
- 1000: Cash
- 1010: Bank
- 1100: Accounts Receivable
- 2000: Accounts Payable
- 3000: Equity
- 4000: Sales/Revenue
- 5000+: Expenses (by category)

**API:**
```
GET /api/businesses/{id}/accounts
POST /api/businesses/{id}/accounts
PUT /api/businesses/{id}/accounts/{id}
DELETE /api/businesses/{id}/accounts/{id}
```

#### E. Income & Expenses
**Routes:** `/income`, `/expenses`

**Features:**
- ✅ Income transaction list (filtered by amount > 0)
- ✅ Expense transaction list (filtered by amount < 0)
- ✅ Transaction details
- ✅ Search by description
- ✅ Category breakdown
- ✅ Add transaction button
- ✅ Delete transaction

**Data:**
- Same transaction data as Transactions page
- Filtered by sign
- Aggregations by category

#### F. Reports / Analytics
**Route:** `/reports` (frontend) or `/insights` (webapp label?)

**Components:**
- ✅ `FinancialActivityHeatmap` — Monthly expense heatmap
- ✅ `CategoryDonut` — Expense by category pie chart
- ✅ `MonthComparison` — Month-over-month bar chart
- ✅ `RecurringDetector` — Recurring transaction detection
- ✅ `AiInsights` — Rule-based heuristic insights

**Features:**
- ✅ Period selection (3mo, 6mo, 12mo)
- ✅ Client-side analytics (`lib/analytics.ts`)
- ✅ Export reports (CSV/XLSX/PDF)

**Analytics Derived:**
```
deriveAnalytics(transactions, windowStart) → {
  totalExpense: number,
  totalIncome: number,
  categoryBreakdown: Record<string, number>,
  monthlyTotals: Record<string, number>,
  insights: string[]  // heuristic-driven
}

detectRecurring(transactions) → {
  patterns: Array<{
    description: string,
    frequency: string,
    amount: number,
    nextDue?: Date
  }>
}
```

**API:** `GET /api/businesses/{id}/transactions` (client-side processing)

#### G. AI Assistant / Chat
**Route:** `/assistant`

**Features:**
- ✅ Chat interface with conversation history
- ✅ Conversation sidebar (ChatGPT-style)
- ✅ Conversation grouping by date
- ✅ New conversation button
- ✅ Delete conversation
- ✅ Message streaming
- ✅ Transaction recording preview + confirm
- ✅ Tool calls (13 deterministic tools)
- ✅ Rate limiting (5/10s burst, 30/min)

**Tool Set:**
```
get_financial_analytics
get_profit_loss
get_account_balances
get_transactions_by_category
record_transactions (preview only)
get_recurring_expenses
analyze_spending_trends
get_top_expenses
forecast_cash_flow (planned)
... (13 total)
```

**API:**
```
POST /api/chat                    → process message
POST /api/chat/confirm            → confirm transaction
POST /api/chat/resolve            → select account
GET /api/conversations            → list
GET /api/conversations/{id}       → get
POST /api/conversations           → create
DELETE /api/conversations/{id}    → delete
```

#### H. Settings
**Route:** `/settings`

**Tabs:**
- ✅ Profile (name, email, password change)
- ✅ Business (name, currency, context)
- ✅ AI Preferences
- ✅ Appearance (light/dark/auto)
- ✅ Language (en/fa)
- ✅ Data (import/export)

**Features:**
- ✅ Edit profile
- ✅ Change password
- ✅ Switch business
- ✅ Manage business members (placeholder)
- ✅ Theme selection
- ✅ Language selection
- ✅ Import/export data (CSV/XLSX)
- ✅ Currency locked indicator
- ✅ Business context for AI

**API:**
```
PUT /api/users/profile
POST /api/auth/change-password
PUT /api/businesses/{id}
GET /api/users
POST /api/auth/switch-business
```

### 🟡 Demo / Placeholder Features (Hardcoded Data)

- 🟡 **Budgets** (`/budgets`) — Demo array, no backend model
- 🟡 **Goals** (`/goals`) — Demo array, no backend model
- 🟡 **Debts** (`/debts`) — Demo array, no backend model
- 🟡 **Subscriptions** (`/subscriptions`) — Demo array, no backend model
- 🟡 **Calendar** (`/calendar`) — Demo array, no backend model
- 🟡 **Advisor** (`/advisor`) — Foundation page with 5 empty cards (dashed "coming soon")

### ❌ Planned but NOT Implemented

- ❌ Role-based access control (permission model exists in code but unwired)
- ❌ Cash flow forecasting (zero forecast logic)
- ❌ Advisor dashboard with real insights
- ❌ Real email sending for verification/reset
- ❌ Budget tracking with real backend
- ❌ Goal tracking with real backend

---

## PHASE 2: WEBAPP FEATURE INVENTORY

### Current State (from code inspection)

#### Routes Mapped
| Frontend | Webapp | Status | Notes |
|----------|--------|--------|-------|
| `/overview` | `/home` | 🟡 PARTIAL | Similar structure but possibly incomplete data |
| `/transactions` | `/cash` | 🟡 PARTIAL | Renamed to "Cash" with summary cards |
| — | `/income` | 🔴 CHECK | Income-specific view |
| — | `/expenses` | 🔴 CHECK | Expense-specific view |
| `/accounts` | `/accounts` | 🟢 SAME | Same component |
| `/reports` | `/reports` | 🟡 PARTIAL | Label says "insights", verify completeness |
| `/assistant` | `/assistant` | 🟢 SAME | Same implementation |
| `/income` | — | 🟡 NO MAPPING | Income page vs income subnav in cash |
| `/expenses` | — | 🟡 NO MAPPING | Expense page vs expense subnav in cash |
| `/budgets` | `/budgets` | 🟢 DEMO | Both demo |
| `/goals` | `/goals` | 🟢 DEMO | Both demo |
| `/debts` | `/debts` | 🟢 DEMO | Both demo |
| `/subscriptions` | `/subscriptions` | 🟢 DEMO | Both demo |
| `/calendar` | `/calendar` | 🟢 DEMO | Both demo |
| `/advisor` | — | ❓ MISSING | Check if exists in webapp |
| `/settings` | `/settings` | 🟡 PARTIAL | Verify content parity |
| `/help` | `/help` | 🟢 PLACEHOLDER | Both placeholder |
| — | `/more` | 🆕 UNIQUE | Webapp-specific nav menu page |

#### Home Page Inspection (`/home`)
```
Components Used:
- WebappHeader (custom title/action)
- WebappNotice (demo data indicator)
- Pull-to-refresh functionality
- Welcome greeting (hardcoded "Good morning/afternoon/evening")
- StatCard (same as frontend)
- KpiSkeleton
- Recent transactions list
- useOverview hook (same as frontend)
- useReports hook

Data Shown:
- stats (balance, revenue, expenses) ✓
- recent transactions ✓
- Pull-to-refresh ✓

Missing (compared to frontend /overview):
- FinancialOverview component (need to verify)
- MoneyMovement component
- HealthScoreCard
- AccountCards
- ExpenseCategoryChart
- (possibly more)
```

#### Cash Page Inspection (`/cash`)
```
Components Used:
- WebappHeader with action button (+ icon)
- WebappNotice
- Summary cards (Balance, Income, Expense)
- Search field
- SegmentedControl (All / In / Out tabs)
- Transaction list
- ImportExportModal

Data Shown:
- Cash balance (asset account)
- Total income (Σ amounts > 0)
- Total expenses (Σ amounts < 0)
- Filtered transactions by direction
- Search by description

Features:
- Search ✓
- Type filtering (all/in/out) ✓
- Import/export button ✓
- Add button ✓
- (NO date range filtering observed)
```

#### Reports Page Inspection (`/reports`)
```
Components Used:
- WebappHeader
- WebappNotice
- FinancialActivityHeatmap ✓
- CategoryDonut ✓
- MonthComparison ✓
- RecurringDetector ✓
- AiInsights ✓
- Period selector (3/6/12 months) ✓

Data & Features:
- Period selection ✓
- All analytics charts ✓
- Seems feature-complete vs frontend
```

#### Settings Page Inspection (`/settings`)
```
Uses custom tabs (probably subset of frontend)
Need to verify all tabs are present
```

#### More Page (`/more`)
```
Unique to webapp:
- Account card with avatar
- Grouped navigation sections
- Settings modal
- Logout button
- Links to all pages

Similar to mobile menu / navigation drawer
```

---

## PHASE 3: GAP ANALYSIS (Preliminary)

### Critical Gaps to Verify

#### A. Overview / Home Data Completeness
**Status:** ✅ VERIFIED — CRITICAL GAPS FOUND

**Frontend `/overview` displays:**
- ✅ Stat cards (4 KPIs) with monthly trends
- ✅ FinancialOverview (area chart: current year vs. projected prior year cash flow)
- ✅ HealthScoreCard (business health metric)
- ✅ AccountCards (account type summaries)
- ✅ MoneyMovement (monthly revenue/expense bar chart)
- ✅ ExpenseCategoryChart (top 5 expense categories, pie/donut)
- ✅ RecentTransactionsTable (full transaction table with 5-10 rows)

**Webapp `/home` displays:**
- ✅ Stat cards (4 KPIs) with monthly trends
- ✅ RIVA AI hero card (unique to webapp, not in frontend)
- ✅ Recent transactions (inline, limited display)
- ✅ Pull-to-refresh (mobile UX feature)
- ❌ FinancialOverview component — MISSING
- ❌ HealthScoreCard component — MISSING
- ❌ AccountCards component — MISSING
- ❌ MoneyMovement component — MISSING
- ❌ ExpenseCategoryChart component — MISSING
- ❌ RecentTransactionsTable component — MISSING

**Gap Summary:** Webapp home is missing 6 major data visualization components that provide critical business intelligence. Only 2/8 major sections implemented.

**Components to Port:** 
- `frontend/components/dashboard/FinancialOverview.tsx`
- `frontend/components/dashboard/HealthScore.tsx`
- `frontend/components/dashboard/AccountCards.tsx`
- `frontend/components/dashboard/MoneyMovement.tsx`
- `frontend/components/dashboard/RecentTransactionsTable.tsx`
- Possibly `frontend/components/reports/ExpenseCategoryChart.tsx`

**Priority:** CRITICAL — Users cannot understand business health without these visualizations

#### B. Transactions View Fragmentation
**Status:** 🟡 NEEDS CLARIFICATION

Frontend: `/transactions` (unified with type tabs)
Webapp: `/cash`, `/income`, `/expenses` (separate pages)

Issues:
- Are there dedicated income/expenses pages in frontend?
- Is the fragmentation intentional for mobile?
- Do all three pages exist in webapp?
- Do they display the same filtering options?

**Priority:** HIGH — Transaction model is accounting core

#### C. Income / Expenses Dedicated Pages
**Status:** 🟡 UNCLEAR

Frontend has: `/income`, `/expenses` (transaction list filtered by sign)
Webapp has: 
- `/income` (exists, inspected)
- `/expenses` (assume exists)
- `/cash` (seems to be the main transaction hub)

**Issue:** Redundancy — do users access both `/cash` AND `/income`? If yes, data must stay in sync.

#### D. Transaction Import/Export
**Status:** 🟢 LIKELY COMPLETE

Both pages reference `ImportExportModal` — need to verify it's the same component with same functionality.

#### E. Chart Components in Home
**Status:** 🟡 NEEDS INSPECTION

Frontend home has `ExpenseCategoryChart`
Webapp home may be missing visualization

**Files to inspect:**
- `/webapp/app/(shell)/home/page.tsx` — full content
- `/webapp/components/dashboard/*` — check what components exist

#### F. Account Details / Operations
**Status:** 🟡 NEEDS INSPECTION

- Account creation form
- Account editing form
- Account deletion confirmation
- Are these modals or separate pages?

#### G. Settings Tabs
**Status:** 🟡 NEEDS COMPARISON

Both have settings pages but:
- Are all tabs present?
- Is content identical?
- Are features parity?

#### H. Advisor Page
**Status:** ❓ CHECK IF EXISTS

Webapp may not have `/advisor` page at all.

#### I. Authentication Pages
**Status:** 🟡 NEEDS VERIFICATION

Webapp has: `/login`, `/verify-email`, `/forgot-password`, `/reset-password`
Frontend has: `/login`, `/verify-email`, `/reset-password`

**Gap:** Webapp may have extra forgot-password route? Or both have it?

---

## PHASE 4: DETAILED COMPARISON PLAN

### Investigation Checklist

- [ ] Read full `/webapp/app/(shell)/home/page.tsx`
- [ ] List all components used on webapp home
- [ ] List all components used on frontend overview
- [ ] Compare data structures (`OverviewStats`, etc.)
- [ ] Verify Income page exists and is complete
- [ ] Verify Expenses page exists and is complete
- [ ] Inspect `/webapp/components/dashboard/*` directory
- [ ] Inspect `/webapp/components/analytics/*` directory
- [ ] Verify all shared `components/ui/*` and `components/motion/*` are identical
- [ ] Check if `/advisor` exists in webapp
- [ ] Verify import/export functionality is complete
- [ ] Confirm settings page content parity
- [ ] Test all API endpoints are accessible from both apps
- [ ] Verify all hooks (`useOverview`, `useReports`, etc.) work identically

### Data Accuracy Verification

For every data display, verify:
1. API endpoint is called
2. Data is fetched (not mocked)
3. Calculations match between apps
4. Currency handling is identical
5. Localization works (en/fa)

---

## Phase 5: Implementation Priority

### Tier 1: Critical (Accounting Correctness)
1. [ ] Verify all transaction CRUD operations work identically
2. [ ] Verify double-entry integrity on both platforms
3. [ ] Verify account balance calculations match
4. [ ] Verify currency handling matches

### Tier 2: Core UX (First-Page Experience)
1. [ ] Home page data parity (all KPIs and visualizations)
2. [ ] Recent transactions display
3. [ ] Account summaries
4. [ ] Quick actions (+ button, etc.)

### Tier 3: Data Access
1. [ ] Transactions list, search, filter, sort
2. [ ] Income/expenses breakdown
3. [ ] Reports and analytics
4. [ ] Category tracking

### Tier 4: Operations
1. [ ] Add transaction
2. [ ] Edit transaction
3. [ ] Delete transaction
4. [ ] Add account
5. [ ] Edit account
6. [ ] Delete account

### Tier 5: Intelligence
1. [ ] AI assistant functionality
2. [ ] Chat history
3. [ ] Transaction recording via AI
4. [ ] Insights and recommendations

### Tier 6: Metadata
1. [ ] Settings completeness
2. [ ] Profile management
3. [ ] Business settings
4. [ ] Import/export
5. [ ] Preferences

---

## Phase 6: Verification Strategy

### Automated Checks
```bash
cd webapp
npm run typecheck    # Type safety
npm run design:check # Design system compliance
npm run build        # Production build (non-sandboxed)
npm run lint         # Code quality
```

### Manual Verification
1. **Data parity:** Side-by-side comparison of same business data
2. **Calculations:** Verify KPIs match exactly
3. **Responsive:** 375px mobile viewport
4. **Localization:** Both en and fa
5. **Theme:** Light and dark modes
6. **Accessibility:** Keyboard navigation, screen readers
7. **Interaction:** All buttons, forms, modals work

### Test Coverage
- Unit tests for hooks
- Integration tests for API calls
- Visual regression tests (screenshots)

---

## Known Constraints

### Architecture Rules (Must Preserve)
1. Double-entry ledger integrity
2. Business-scoped data queries
3. JWT authentication flow
4. Design system tokens
5. Liquid Glass navigation scope
6. Both apps' ports and entry routes
7. Service worker network-only for data
8. Base currency immutability
9. All existing working features

### Backend Limitations
- No role-based access enforcement yet
- No email sending configured
- No forecasting logic
- Budget/goal/debt models don't exist

### Frontend Limitations
- `next build` fails in sandboxed environments (font fetching)
- Auth testing requires real backend
- UI/UX must not change

---

## Next Steps

1. **Complete Phase 1:** Deep-dive into all frontend pages
2. **Complete Phase 2:** Deep-dive into all webapp pages
3. **Document Phase 3:** Create feature-by-feature gap matrix
4. **Prioritize Phase 4:** Rank implementation tasks
5. **Execute Phase 5:** Build missing functionality
6. **Verify Phase 6:** Test all features and data parity
7. **Document Phase 7-8:** Final reports and handoff

---

## Session Log

### 2026-11-11 — Initial Investigation
- Started with routing analysis
- Inspected key pages: home, cash, accounts, reports, settings, more
- Created this discovery document
- **Next:** Continue detailed component inspection

