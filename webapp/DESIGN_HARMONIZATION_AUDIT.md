# RIVA Webapp Design Harmonization Audit

**Date:** 2026-11-04  
**Scope:** Complete visual consistency pass across entire webapp/  
**Goal:** Unified RIVA + Glisse product identity

---

## Current State Analysis

### Glisse Integration Status
✓ TabBar — MobileTabBar (main navigation)
✓ Button — Settings page, 14 components
✓ Input — Settings page, multiple forms
✓ Switch — Settings page
✓ SearchField — Cash page
✓ SegmentedControl — Cash page
⚠️ Menu — Not yet used
⚠️ Slider — Not yet used
⚠️ Glass — Not yet used beyond TabBar

### Pages Requiring Harmonization
1. /home — Dashboard (StatCards, charts, overview)
2. /cash — Transactions list (SearchField ✓, SegmentedControl ✓)
3. /income — Income transactions
4. /expenses — Expense transactions
5. /assistant — AI chat interface
6. /reports — Analytics and charts
7. /accounts — Chart of accounts
8. /settings — Settings panels (Button ✓, Input ✓, Switch ✓)
9. /budgets, /goals, /debts, /subscriptions — Demo pages
10. /calendar, /help, /more — Utility pages

### Component Categories Requiring Audit

**Buttons (CRITICAL — Global Application Required):**
- Primary actions
- Secondary actions
- Tertiary/ghost buttons
- Icon-only buttons
- Form submit buttons
- Cancel/close buttons
- Action menu triggers
- Filter buttons
- Export buttons
- Sidebar buttons (EXCEPTION — preserve existing)

**Inputs & Forms:**
- Text inputs
- Search fields
- Number inputs
- Textareas
- Select dropdowns
- Date pickers

**Navigation:**
- TabBar (✓ using Glisse)
- Sidebar links
- Breadcrumbs
- Pagination

**Feedback:**
- Toasts
- Alerts
- Modals
- Empty states
- Error states
- Loading skeletons

**Data Display:**
- Cards
- Tables
- Lists
- Stat displays
- Charts

---

## Identified Inconsistencies

### Typography Issues
- [ ] Mixed font sizes across similar components
- [ ] Inconsistent heading hierarchy
- [ ] Varied line heights
- [ ] Mixed font weights for same purpose

### Spacing Issues
- [ ] Inconsistent padding in cards
- [ ] Varied gaps between elements
- [ ] Mixed margins
- [ ] Inconsistent form field spacing

### Visual Treatment Issues
- [ ] Mixed border styles (solid vs none)
- [ ] Varied border radii (some rounded-lg, some rounded-xl, some rounded-2xl)
- [ ] Inconsistent shadows
- [ ] Mixed background treatments

### Interactive States
- [ ] Inconsistent hover states
- [ ] Varied active/pressed states
- [ ] Mixed focus ring styles
- [ ] Inconsistent disabled states

### Glisse vs Legacy
- [ ] Some buttons use old RIVA Button, some use Glisse
- [ ] Mixed input styles
- [ ] Inconsistent glass effects
- [ ] Some areas lack Glisse integration

---

## Harmonization Strategy

### Phase 1: Foundation (Design Tokens)
1. Audit current token usage
2. Establish consistent application rules
3. Document token-to-component mapping

### Phase 2: Global Button Migration
1. Replace ALL buttons with Glisse Button (except sidebar)
2. Map button purposes to Glisse variants
3. Preserve all functionality and states

### Phase 3: Form Controls
1. Standardize all inputs to Glisse Input
2. Apply SearchField consistently
3. Replace custom controls with Glisse equivalents

### Phase 4: Navigation & Interaction
1. Apply SegmentedControl to all tab-like interfaces
2. Integrate Menu for dropdowns and actions
3. Ensure consistent TabBar behavior

### Phase 5: Layout & Surfaces
1. Standardize card treatments
2. Consistent spacing throughout
3. Apply Glass where appropriate

### Phase 6: Verification
1. Light mode consistency
2. Dark mode consistency
3. RTL layout check
4. Mobile responsiveness
5. Tablet layouts
6. Desktop layouts

---

## Design Rules

### Button Mapping
- **Primary action** → Glisse Button variant="filled"
- **Secondary action** → Glisse Button variant="glass"
- **Destructive action** → Glisse Button destructive={true}
- **Icon-only** → Glisse Button with icon prop only
- **Sidebar buttons** → PRESERVE EXISTING (exception)

### Typography Scale
- Page title: text-2xl font-display
- Section heading: text-lg font-semibold
- Card title: text-sm font-semibold
- Body text: text-sm
- Caption/meta: text-xs
- Maintain IBM Plex Sans for display

### Spacing Scale
- Card padding: p-4 sm:p-5
- Section gap: space-y-4 sm:space-y-5
- Form field gap: space-y-3
- Inline gap: gap-2 sm:gap-3

### Border Radius
- Cards: rounded-xl
- Buttons: (Glisse handles)
- Inputs: (Glisse handles)
- Modals: rounded-2xl
- Small elements: rounded-lg

### Shadows
- Cards: shadow-subtle
- Elevated: shadow-card
- Glisse glass: (built-in)

---

## Exclusions (Do Not Change)
- ❌ Sidebar component styling
- ❌ Backend API responses
- ❌ Database schemas
- ❌ Authentication flows
- ❌ Business logic
- ❌ frontend/ directory
- ❌ Existing route structure

