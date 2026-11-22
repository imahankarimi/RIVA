# RIVA Webapp Feature Parity — Detailed Gap Analysis Matrix

**Status:** Phase 3 Complete — Feature-by-feature gap analysis  
**Created:** 2026-11-11  
**Investigation Complete:** ✅

---

## Feature Parity Status Summary

| Category | Frontend | Webapp | Status | Gap Count |
|----------|----------|--------|--------|-----------|
| Auth & Tenancy | 8/8 ✅ | 8/8 ✅ | COMPLETE | 0 |
| Overview/Home | 8/8 ✅ | 2/8 🔴 | CRITICAL | 6 |
| Transactions | 5/5 ✅ | 3/5 🟡 | PARTIAL | 2 |
| Accounts | 4/4 ✅ | 4/4 ✅ | COMPLETE | 0 |
| Reports | 6/6 ✅ | 6/6 ✅ | COMPLETE | 0 |
| Income Page | 1/1 ✅ | 1/1 ✅ | COMPLETE | 0 |
| Expenses Page | 1/1 ✅ | 1/1 ✅ | COMPLETE | 0 |
| AI Assistant | 8/8 ✅ | 8/8 ✅ | COMPLETE | 0 |
| Settings | 6/6 ✅ | 6/6 ✅ | COMPLETE | 0 |
| Advisor Page | 1/1 ✅ | 0/1 ❌ | MISSING | 1 |
| Planning (Demo) | 5/5 🟡 | 5/5 🟡 | COMPLETE (demo) | 0 |
| Help (Placeholder) | 1/1 🟡 | 1/1 🟡 | COMPLETE (placeholder) | 0 |
| **TOTAL** | **53/53** | **45/53** | **85% COMPLETE** | **8 GAPS** |

---

## Detailed Feature Matrix

### ✅ COMPLETE FEATURES (45/53)

#### A. Authentication & Tenancy (8/8)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Signup | ✅ | ✅ | Identical flow |
| Login | ✅ | ✅ | Identical flow |
| Email Verification | ✅ | ✅ | Identical flow |
| Password Reset | ✅ | ✅ | Identical flow |
| Change Password | ✅ | ✅ | Identical implementation |
| Logout | ✅ | ✅ | Identical |
| Multi-business switching | ✅ | ✅ | Identical |
| Session management | ✅ | ✅ | JWT + refresh token |

#### B. Accounts (4/4)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| List accounts | ✅ | ✅ | Same `AccountsGrid` component |
| View account details | ✅ | ✅ | Same display |
| Create account | ✅ | ✅ | Same form |
| Edit/Delete account | ✅ | ✅ | Same modals |

#### C. Income & Expenses Pages (2/2)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Income list | ✅ | ✅ | Filtered transactions (amount > 0) |
| Expenses list | ✅ | ✅ | Filtered transactions (amount < 0) |

#### D. Reports / Analytics (6/6)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Financial Activity Heatmap | ✅ | ✅ | Same component |
| Category Donut Chart | ✅ | ✅ | Same component |
| Month Comparison | ✅ | ✅ | Same component |
| Recurring Detector | ✅ | ✅ | Same component |
| AI Insights | ✅ | ✅ | Same component |
| Period selector (3/6/12 months) | ✅ | ✅ | Same implementation |

#### E. AI Assistant (8/8)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Chat interface | ✅ | ✅ | Same `AssistantChatView` |
| Conversation history | ✅ | ✅ | Same sidebar |
| New conversation | ✅ | ✅ | Same |
| Delete conversation | ✅ | ✅ | Same |
| Transaction recording | ✅ | ✅ | Same preview/confirm flow |
| Tool calls (13 tools) | ✅ | ✅ | Backend provides all |
| Message streaming | ✅ | ✅ | Same |
| Rate limiting | ✅ | ✅ | Backend enforces |

#### F. Settings (6/6)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Profile tab (name, email) | ✅ | ✅ | Same |
| Password change | ✅ | ✅ | Same |
| Business settings | ✅ | ✅ | Same |
| AI preferences | ✅ | ✅ | Same |
| Appearance (theme) | ✅ | ✅ | Same |
| Language selection | ✅ | ✅ | Same |

#### G. Planning Pages (5/5 — Both Demo)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Budgets | 🟡 | 🟡 | Demo data only |
| Goals | 🟡 | 🟡 | Demo data only |
| Debts | 🟡 | 🟡 | Demo data only |
| Subscriptions | 🟡 | 🟡 | Demo data only |
| Calendar | 🟡 | 🟡 | Demo data only |

#### H. Help (1/1 — Both Placeholder)
| Feature | Frontend | Webapp | Implementation Notes |
|---------|----------|--------|----------------------|
| Help page | 🟡 | 🟡 | Coming Soon placeholder |

---

### 🔴 CRITICAL GAPS (8 GAPS TOTAL)

#### GAP #1: Overview/Home Missing 6 Visualization Components
**Severity:** CRITICAL  
**Impact:** Users cannot understand business health; missing core intelligence

**Frontend `/overview` Components:**
```
1. FinancialOverview (area chart: cash flow trend, year vs. projected)
2. HealthScoreCard (business health metric)
3. AccountCards (account type summaries)
4. MoneyMovement (revenue/expense bar chart)
5. ExpenseCategoryChart (top 5 expense categories, donut)
6. RecentTransactionsTable (full table view, 5-10 rows)
```

**Webapp `/home` Current:**
```
✅ Stat cards (4 KPIs)
✅ RIVA AI hero card
✅ Recent transactions (inline list, limited)
❌ FinancialOverview — MISSING
❌ HealthScoreCard — MISSING
❌ AccountCards — MISSING
❌ MoneyMovement — MISSING
❌ ExpenseCategoryChart — MISSING
❌ RecentTransactionsTable — MISSING
```

**Files to Add:**
- Copy `frontend/components/dashboard/FinancialOverview.tsx` → `webapp/components/dashboard/`
- Copy `frontend/components/dashboard/HealthScore.tsx` → `webapp/components/dashboard/`
- Copy `frontend/components/dashboard/AccountCards.tsx` → `webapp/components/dashboard/`
- Copy `frontend/components/dashboard/MoneyMovement.tsx` → `webapp/components/dashboard/`
- Copy or reference `frontend/components/reports/ExpenseCategoryChart.tsx`
- Update `webapp/app/(shell)/home/page.tsx` to render these components

**Implementation Approach:**
1. Copy missing dashboard components to webapp
2. Restructure home page layout to accommodate all sections
3. Adjust responsive grid (mobile-first layout)
4. Verify all data flows from same API calls
5. Test on 375px viewport

**Estimated Effort:** 2-3 hours (components already exist, need mobile adaptation)

---

#### GAP #2: Transaction List Organization
**Severity:** HIGH  
**Impact:** UI/UX fragmentation; users unclear where to find transactions

**Frontend Approach:**
```
/transactions — unified list with type tabs (All / Income / Expense)
/income — filtered view (income transactions only)
/expenses — filtered view (expense transactions only)
```

**Webapp Approach:**
```
/cash — main transaction hub with filter tabs (All / In / Out)
/income — separate dedicated page
/expenses — separate dedicated page
```

**Analysis:**
- Both apps have all three views available
- Webapp uses segmented naming (/cash vs /transactions)
- Data sources are identical (same filtering logic)
- No parity gap in functionality — both provide same operations

**Decision:** No implementation required — architectural choice is different but functionally equivalent.

---

#### GAP #3: Transaction Filters
**Severity:** MEDIUM  
**Impact:** Users cannot filter transactions by date range on mobile

**Frontend `/transactions` Features:**
```
✅ Search by description
✅ Category filter
✅ Date range filter (all, today, thisWeek, thisMonth, thisYear)
✅ Type tabs
```

**Webapp `/cash` Current:**
```
✅ Search by description
✅ Type filter (All / In / Out)
❌ Date range filter — MISSING
❌ Category filter — MISSING
```

**Implementation:**
- Add date range chips to `/cash` page
- Add category filter modal/dropdown
- Use same `DATE_RANGES` constant from frontend

**Files to Update:**
- `webapp/app/(shell)/cash/page.tsx` — add date range selector
- Add category selector

**Estimated Effort:** 45 minutes (UI already exists, add filtering logic)

---

#### GAP #4: Advisor Page
**Severity:** MEDIUM  
**Impact:** Users cannot access advisor/intelligence features on mobile

**Frontend `/advisor`:**
- Foundation page with 5 empty cards
- Sections: Business Health, Key Insights, Recommendations, Forecasts, Reports
- Labeled as "Coming Soon" (dashed boxes)

**Webapp:**
- Page does not exist

**Implementation:**
- Copy `frontend/app/(app)/advisor/page.tsx` to `webapp/app/(shell)/advisor/page.tsx`
- Adapt styling for mobile
- Ensure no UI/UX changes (just port placeholder)

**Estimated Effort:** 15 minutes (direct copy + mobile styling)

---

#### GAP #5: Import/Export on Income/Expenses Pages
**Severity:** LOW  
**Impact:** Users on income/expenses pages cannot export data

**Frontend:**
```
/income — includes Import/Export button
/expenses — includes Import/Export button
```

**Webapp:**
```
/income — ✅ has Import/Export button
/expenses — ✅ has Import/Export button (verified in code)
```

**Status:** Actually COMPLETE — already implemented

---

#### GAP #6: Recent Transactions Table vs. List
**Severity:** LOW  
**Impact:** Display format differs but data is identical

**Frontend `/overview`:**
- `RecentTransactionsTable` — full table format (desktop optimized)

**Webapp `/home`:**
- Inline transaction list (mobile optimized)

**Analysis:**
- Webapp displays same data, just in different format
- No data gaps, only visual presentation differs
- Mobile-first UX choice is intentional

**Decision:** No implementation required — intentional design difference

---

### 🟡 PARTIAL / NEEDS VERIFICATION (0 confirmed)

All major features have been verified as either complete or identified as gaps above.

---

## Implementation Roadmap (Priority Order)

### Phase 1: Critical Fixes (Est. 3 hours)
1. **Gap #1: Add Dashboard Visualizations to Home** (2.5 hrs)
   - Copy dashboard components
   - Adapt responsive layout
   - Verify data accuracy
   - Test mobile view
   
2. **Gap #4: Add Advisor Page** (15 min)
   - Port placeholder page
   - Mobile styling

### Phase 2: High Priority (Est. 1 hour)
3. **Gap #3: Add Transaction Filtering** (45 min)
   - Date range selector
   - Category filter
   - Update /cash, /income, /expenses pages

### Phase 3: Verification (Est. 2 hours)
4. Verify all components work with real data
5. Test on actual mobile devices
6. Dark mode verification
7. Persian/English localization check
8. Responsive behavior (375px+)

---

## Files Requiring Changes

### New Components to Copy
```
frontend/components/dashboard/FinancialOverview.tsx
frontend/components/dashboard/HealthScore.tsx
frontend/components/dashboard/AccountCards.tsx
frontend/components/dashboard/MoneyMovement.tsx
frontend/components/reports/ExpenseCategoryChart.tsx (reference)
```

### Pages to Create/Modify
```
webapp/app/(shell)/advisor/page.tsx (NEW)
webapp/app/(shell)/home/page.tsx (MODIFY - add components)
webapp/app/(shell)/cash/page.tsx (MODIFY - add filters)
webapp/app/(shell)/income/page.tsx (VERIFY filters)
webapp/app/(shell)/expenses/page.tsx (VERIFY filters)
```

### Potential Helper Updates
```
webapp/lib/hooks/useOverview.ts (verify data structure)
webapp/lib/analytics.ts (verify calculation parity)
webapp/lib/dateRange.ts (for date filtering)
```

---

## Data Accuracy & Parity Checks

### Overview Stats Verification
```typescript
// Both apps must calculate identically:
balance = Σ(asset.balance) - Σ(liability.balance)
revenue = Σ(revenue account.balance)
expenses = Σ(expense account.balance)
cashFlow = revenue - expenses

// Month-over-month trends must match
momTrend(months, metric) — same calculation both sides
```

### Transaction Filtering
```typescript
// Same logic, both apps:
income = transactions.filter(tx => tx.amount > 0)
expenses = transactions.filter(tx => tx.amount < 0)
dateRange = withinDateRange(tx.date, range)
```

### Currency & Localization
```typescript
// All monetary values use same handler:
formatCurrency(value, business.currency, locale, opts)

// Both apps support:
en, fa (Persian)
IRR, TOMAN, USD, EUR, GBP
Light, dark modes
RTL, LTR
```

---

## Acceptance Criteria

### ✅ Must Have (Blocking)
- [ ] Overview/home displays all 8 visualization components
- [ ] All KPIs calculate identically to frontend
- [ ] Charts render with correct data
- [ ] Account summaries match frontend totals
- [ ] Recent transactions list is current
- [ ] Advisor page exists (placeholder matches frontend)
- [ ] All filters work (date, category, type)
- [ ] No UI/UX regression on either app

### ✅ Should Have (High Priority)
- [ ] Mobile responsive (375px minimum)
- [ ] Dark mode works
- [ ] Persian text renders correctly
- [ ] All animations smooth
- [ ] Pull-to-refresh works (unique to webapp)

### ✅ Nice to Have
- [ ] Performance optimized
- [ ] Accessibility verified
- [ ] Visual regression tests pass

---

## Known Constraints (Must Preserve)

1. **No UI/UX changes** to either app
2. **Shared components** must be identical (physical copy, not monorepo)
3. **Ledger integrity** must be preserved
4. **Auth/tenancy** security unchanged
5. **Backend API** contracts unchanged
6. **Localization** complete (en/fa)
7. **Service worker** network-only for data

---

## Next Session Instructions

1. Start with Gap #1 (Overview components)
2. Copy components, adapt responsive layout
3. Test with real data
4. Then address Gap #4 (Advisor page)
5. Then address Gap #3 (Filtering)
6. Run full verification suite

---

## Session Log

### 2026-11-11 — Phase 3 Complete
- ✅ Mapped all frontend pages and features
- ✅ Mapped all webapp pages and features
- ✅ Identified 8 specific gaps
- ✅ Created implementation roadmap
- **Next:** Start Phase 5 implementation

