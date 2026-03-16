# UX Redesign Plan: Defaults Governance & App Simplification

**Version**: 3.0 (scoped to defaults only — no engineering reference, no research restructure)
**Date**: 2026-03-16
**Planned by**: Claude Code Opus 4.6 (Anthropic) in collaboration with the project owner

---

## For Replit Agent

This plan covers ONE thing: **consolidating all financial defaults into a single "Model Defaults" admin section and simplifying what non-admin users see.** That's it.

For other initiatives, see the companion documents:
- `MARCELA-ISOLATION.md` / `MARCELA-RESTORATION.md` — voice agent management
- `ADMIN-SYSTEM-CLEANUP.md` — Diagrams and Integrations tab cleanup
- `APP-UX-ROADMAP.md` — optimizing existing features (no new code)
- `NEW-FEATURES-BACKLOG.md` — new feature ideas (not approved)

**Replit Task #166** covers Phases 1 + 2 + 5 of this plan (schema, Model Defaults UI, property creation pre-fill).

Use your judgement. Ask the owner when in doubt. Verify after every change (`npm run test:summary`, `npm run verify:summary`).

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Design Principles](#2-design-principles)
3. [What Changes for Users](#3-what-changes-for-users)
4. [Model Defaults — The New Admin Section](#4-model-defaults)
5. [Governed Fields](#5-governed-fields)
6. [Page Changes](#6-page-changes)
7. [Field Migration Map](#7-field-migration-map)
8. [Data Flow](#8-data-flow)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. The Problem

Financial defaults are scattered across 4 locations with no clear mental model:

| Location | What's There | Who Accesses |
|----------|-------------|-------------|
| `/settings` ("General Settings") | Acquisition/refi financing defaults, inflation, fiscal year, display toggles | Management users |
| `/company/assumptions` | Company identity, funding, fees, compensation, overhead, tax, exit, expense rates | Management users |
| `/admin` various tabs | Navigation toggles, AI agents, research config | Admin only |
| Code constants (`shared/constants.ts`) | `DEPRECIATION_YEARS = 27.5`, `DAYS_PER_MONTH = 30.5`, all `DEFAULT_*` values | No one (hardcoded) |

A user asking "where do I set the default interest rate?" has to guess. Exit cap rate is under Company Assumptions, but acquisition financing defaults are under Settings. Depreciation years is invisible — buried in code.

**The fix:** One place for all defaults (Admin > Model Defaults), three scoped tabs, every value visible and configurable by someone.

---

## 2. Design Principles

1. **All defaults in one place** — Admin > Model Defaults with 3 tabs: Market & Macro, Company Operations, Property Underwriting
2. **Every calculated value traces to a configurable default** — No code constants. If it affects a number, someone can see and change it.
3. **Defaults are starting points, not live bindings** — They pre-fill entities at creation. Changing a default does NOT retroactively change existing properties.
4. **Non-admin users get a clean operational view** — No settings pages. Every sidebar item is something they use daily.
5. **Governed values inform, not block** — IRS/GAAP values are editable but carry a shield icon + authority citation + caution text.
6. **Config switches are not defaults** — Sidebar toggles, AI settings, display preferences stay in their admin tabs, not in Model Defaults.
7. **If no one can change a value, it shouldn't be stored** — It's dead code.

### Default vs Config Switch

| Type | What It Is | Where It Lives | Example |
|------|-----------|---------------|---------|
| **Default** | Starting value that flows into an entity field a user can change | Admin > Model Defaults | Exit cap rate, depreciation years, staff salary |
| **Config switch** | Platform behavior toggle — no user-facing field it pre-fills | Stays in relevant admin tab | Sidebar visibility, preferred LLM, tour prompt |

---

## 3. What Changes for Users

### Non-Admin Users

**Before:** Sidebar has "General Settings" with 15 fields. Company Assumptions page has 63+ fields. User can change values that affect the entire model.

**After:**
- "General Settings" is **gone** from sidebar
- Company Assumptions page **redirects to `/company`** (read-only Model Inputs panel)
- Every remaining sidebar item is operational — something they use daily
- Property Edit still fully editable (property owns its values after creation)

**Sidebar before → after:**
```
Before:                          After:
HOME                             HOME
  Dashboard                        Dashboard
  Properties                       Properties
  Mgmt Company                     Mgmt Company
TOOLS                            TOOLS
  Simulation                       Simulation
  Property Finder                  Property Finder
  Map View                         Map View
SETTINGS                         ACCOUNT
  My Profile                       My Profile
  My Scenarios                     My Scenarios
  General Settings  ← REMOVED
```

### Admin Users

**Before:** Defaults scattered across Settings, Company Assumptions, and code constants. Admin sidebar has no "defaults" section.

**After:**
- New **"Model Defaults"** as first item in Business group of admin sidebar
- Three tabs: Market & Macro, Company Operations, Property Underwriting
- All financial defaults in one place
- Company identity fields (name, logo, contact) also here (since CompaniesTab manages external companies, not the management company)

---

## 4. Model Defaults — The New Admin Section

Single source of truth for all financial defaults. Three tabs. Located first in the Business group of the admin sidebar.

### Tab 1: Market & Macro

*"These values provide economic context for research and benchmarking across the platform."*

#### Economic Environment

| Field | Type | Default | Governed? |
|-------|------|---------|-----------|
| Macro inflation rate | % | 3.0% | No |
| Cost of equity | % | 18.0% | No |
| Days per month | number | 30.5 | **Yes** — Industry standard (365/12) |

#### Fiscal Calendar

| Field | Type | Default |
|-------|------|---------|
| Fiscal year start month | select 1-12 | 1 (January) |

---

### Tab 2: Company Operations

*"These values drive the management company pro-forma. Changes take effect immediately."*

Since there's only one management company, these ARE the values (not templates).

#### Company Identity

| Field | Type | Default |
|-------|------|---------|
| Company logo | selector | (from logo pool) |
| Company name | text | "Hospitality Business" |
| Email, Phone, Website | text | — |
| Tax ID / EIN | text | — |
| Founding year | number | — |
| Street address | text | — |
| Country → State → City → Zip | cascading selects | — |

*These move here from Company Assumptions (CompanySetupSection). Admin > Companies tab manages external "Companies of Interest", not the management company.*

#### Company Timeline

| Field | Type | Default |
|-------|------|---------|
| Model start date | date | 2026-04-01 |
| Company operations start date | date | 2026-06-01 |
| Projection years | number | 10 |

#### Funding Structure

| Field | Type | Default |
|-------|------|---------|
| Funding source label | text | "Funding Vehicle" |
| Tranche 1 amount | $ | 1,000,000 |
| Tranche 1 date | date | 2026-06-01 |
| Tranche 2 amount | $ | 1,000,000 |
| Tranche 2 date | date | 2027-04-01 |
| Valuation cap | $ | 2,500,000 |
| Discount rate | % | 20% |
| Interest rate | % | 8% |
| Payment frequency | select | Accrues only |

#### Revenue Model

| Field | Type | Default |
|-------|------|---------|
| Base management fee | % | 8.5% |
| Incentive management fee | % | 12.0% |

#### People & Compensation

| Field | Type | Default |
|-------|------|---------|
| Staff salary per FTE | $ | 75,000 |
| Salary escalation rate | % | 3.0% |
| Payroll burden rate | % | 25% |
| Staffing tier 1: max properties | number | 3 |
| Staffing tier 1: FTE count | number | 2.5 |
| Staffing tier 2: max properties | number | 6 |
| Staffing tier 2: FTE count | number | 4.5 |
| Staffing tier 3: FTE count | number | 7.0 |

**Partner compensation table** (Years 1-10): count + annual comp per year.

#### Fixed Overhead

| Field | Type | Default |
|-------|------|---------|
| Fixed cost escalation rate | % | 3.0% |
| Office lease (Year 1) | $ | 36,000 |
| Professional services (Year 1) | $ | 24,000 |
| Technology infrastructure (Year 1) | $ | 18,000 |
| Business insurance (Year 1) | $ | 12,000 |

#### Variable Costs

| Field | Type | Default |
|-------|------|---------|
| Travel cost per client | $ | 12,000 |
| IT license per client | $ | 3,000 |
| Marketing rate | % | 5.0% |
| Miscellaneous ops rate | % | 3.0% |

#### Company Tax

| Field | Type | Default |
|-------|------|---------|
| Company income tax rate | % | 30% |
| Company inflation rate | % | 3.0% |

---

### Tab 3: Property Underwriting

*"These values will be applied as starting assumptions for the next property added to the portfolio. Existing properties are not affected."*

**On save, show toast:** *"Property defaults saved. These will apply to new properties. {N} existing properties retain their current values."*

#### Revenue Assumptions

| Field | Type | Default |
|-------|------|---------|
| Default starting ADR | $ | 250 |
| Default ADR growth rate | % | 3.0% |
| Default starting occupancy | % | 55% |
| Default stabilized occupancy | % | 85% |
| Default stabilization months | number | 36 |
| Default F&B revenue share | % | 18% |
| Default catering boost | % | 22% |
| Default event revenue share | % | 30% |
| Default other revenue share | % | 5% |

#### Operating Cost Rates

| Field | Type | Default |
|-------|------|---------|
| Rooms department | % | 20% |
| F&B department | % | 9% |
| Admin & General | % | 8% |
| Marketing | % | 1% |
| Property Ops & Maintenance | % | 4% |
| Utilities | % | 5% |
| Property Taxes | % | 3% |
| IT & Telecom | % | 0.5% |
| FF&E Reserve | % | 4% |
| Other Operating | % | 5% |
| Insurance | % | 1.5% |
| Event expense rate | % | 65% |
| Other expense rate | % | 60% |
| Utilities variable split | % | 60% |

#### Acquisition Financing

| Field | Type | Default |
|-------|------|---------|
| Default LTV | % | 75% |
| Default interest rate | % | 9.0% |
| Default term (years) | number | 25 |
| Default closing cost rate | % | 2.0% |

#### Refinance Terms

| Field | Type | Default |
|-------|------|---------|
| Default refi LTV | % | 75% |
| Default refi interest rate | % | 7.0% |
| Default refi term (years) | number | 25 |
| Default refi closing cost rate | % | 3.0% |

#### Depreciation & Tax

| Field | Type | Default | Governed? |
|-------|------|---------|-----------|
| Depreciation years | number | 27.5 | **Yes** — IRS Publication 946 |
| Default property income tax rate | % | 25% | No |
| Default property inflation rate | % | 3.0% | No |

#### Disposition

| Field | Type | Default |
|-------|------|---------|
| Default exit cap rate | % | 8.5% |
| Default sales commission | % | 5.0% |
| Default real estate commission | % | 5.0% |

#### Working Capital & Accounting

| Field | Type | Default |
|-------|------|---------|
| Accounts receivable days | number | 30 |
| Accounts payable days | number | 45 |
| Reinvestment rate | % | 5.0% |
| Day count convention | select | 30/360 |
| Escalation method | select | Annual |

#### Cost Segregation (Advanced)

| Field | Type | Default |
|-------|------|---------|
| Cost segregation enabled | toggle | Off |
| 5-year property % | % | 15% |
| 7-year property % | % | 10% |
| 15-year property % | % | 5% |

#### Default Acquisition Package

| Field | Type | Default |
|-------|------|---------|
| Default purchase price | $ | 3,800,000 |
| Default building improvements | $ | 1,200,000 |
| Default pre-opening costs | $ | 200,000 |
| Default operating reserve | $ | 250,000 |
| Default months to operations | number | 6 |

---

## 5. Governed Fields

A governed field is any value backed by regulation, tax law, or industry standard. Editable but carries authority citation.

### Registry

| Field | Authority | Location(s) |
|-------|-----------|-------------|
| Depreciation years (27.5) | IRS Publication 946 | Model Defaults > Property Underwriting AND Property Edit |
| Days per month (30.5) | Industry convention (365/12) | Model Defaults > Market & Macro |

### Visual Design

```
┌──────────────────────────────────────────────────┐
│  Depreciation Years                🛡 IRS Pub 946│
│  ┌──────────┐                                    │
│  │  27.5    │                                    │
│  └──────────┘                                    │
│  ▸ 27.5 years: residential rental property.      │
│    39 years: nonresidential real property.        │
│    Changing this deviates from standard tax       │
│    depreciation. Consult your tax advisor.        │
└──────────────────────────────────────────────────┘
```

- Shield icon (not warning triangle) — conveys authority, not danger
- Collapsible helper text — expanded on first view, collapsible after
- Muted amber background — `bg-amber-50 border-amber-200` (light), `bg-amber-900/20` (dark)
- Same treatment on Property Edit — governance info travels with the field

---

## 6. Page Changes

### 6.1 Settings Page → ELIMINATED

The `/settings` page is removed. Its 15 fields move to:

| Current Field | Current Tab | Moves To |
|--------------|-------------|----------|
| Disposition commission | Property Defaults | Model Defaults > Property Underwriting > Disposition |
| Acquisition LTV, rate, term, closing | Property Defaults | Model Defaults > Property Underwriting > Acq Financing |
| Refi LTV, rate, term, closing, years-after | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Fiscal year start month | Macro | Model Defaults > Market & Macro |
| Inflation escalator | Macro | Model Defaults > Market & Macro |
| Show company calc details | Other | Admin > Navigation & Display |
| Show property calc details | Other | Admin > Navigation & Display |
| Auto-refresh research | Other | Admin > Research Center |
| Show tour prompt | Other | Admin > Navigation & Display |

"General Settings" removed from sidebar. `/settings` redirects.

### 6.2 Company Assumptions Page → Admin Only

**Current state:** 12 sections, 63+ fields, accessible to management users.

**New state:**
- All financial inputs move to Model Defaults > Company Operations tab
- Company identity fields (name, logo, contact, address) move to Model Defaults > Company Operations > Identity
- Exit/expense rate fields move to Model Defaults > Property Underwriting
- `/company/assumptions` redirects to `/company` for non-admins, `/admin?section=model-defaults` for admins

### 6.3 Company Page (`/company`) — New Model Inputs Panel

Add a **read-only expandable accordion** below the tab bar:

```
▸ Model Inputs                           Set by administrator

(when expanded:)
┌─────────────────────────────────────────────────────┐
│ Revenue: Base fee 8.5% · Incentive fee 12.0%        │
│ Funding: Tranche 1 $1.0M · Tranche 2 $1.0M         │
│ People: 3 partners · $75K/FTE · Tier 1: 2.5 FTE    │
│ Overhead: $36K office · $24K prof svc · 3%/yr esc   │
│ Tax: 30%                                            │
│                                                     │
│ [If admin: "Edit in Admin > Model Defaults" link]   │
└─────────────────────────────────────────────────────┘
```

### 6.4 Property Edit — Pre-fill from Defaults

When a user creates a new property, all fields are pre-filled from Model Defaults > Property Underwriting. The user sees real numbers in every field on day one, edits what they want, saves. The property then owns its values.

**Current state (from audit):** The server route `POST /api/properties` already calls `buildPropertyDefaultsFromGlobal()` for cost rates, financing, exit, and fees. But revenue defaults (ADR, occupancy, ramp) are pre-filled on the **client side** from constants. This redesign unifies both into a single server-side flow reading everything from the database.

### 6.5 Admin Panel — Model Defaults Added

"Model Defaults" added as first item in Business group. Navigation tab renamed to "Navigation & Display" and gains display toggle + tour toggle fields from eliminated Settings page.

---

## 7. Field Migration Map

### From Settings Page (15 fields)

| Field | Settings Tab | Moves To |
|-------|-------------|----------|
| Real estate commission | Property Defaults | Model Defaults > Property Underwriting > Disposition |
| Acquisition LTV | Property Defaults | Model Defaults > Property Underwriting > Acq Financing |
| Acquisition interest rate | Property Defaults | Model Defaults > Property Underwriting > Acq Financing |
| Acquisition term | Property Defaults | Model Defaults > Property Underwriting > Acq Financing |
| Acquisition closing cost | Property Defaults | Model Defaults > Property Underwriting > Acq Financing |
| Refi years after acq | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Refi LTV | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Refi rate | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Refi term | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Refi closing cost | Property Defaults | Model Defaults > Property Underwriting > Refi Terms |
| Fiscal year start month | Macro | Model Defaults > Market & Macro |
| Inflation escalator | Macro | Model Defaults > Market & Macro |
| Show company calc details | Other | Admin > Navigation & Display |
| Show property calc details | Other | Admin > Navigation & Display |
| Auto-refresh research | Other | Admin > Research Center |
| Show tour prompt | Other | Admin > Navigation & Display |

### From Company Assumptions Page (63+ fields)

| Section | Fields | Moves To |
|---------|--------|----------|
| Company Setup (identity) | Logo, name, contact, address, EIN, founding year | Model Defaults > Company Operations > Identity |
| Company Setup (model) | Ops start date, projection years, company inflation | Model Defaults > Company Operations > Timeline / Tax |
| Funding | All SAFE fields (13 + toggles) | Model Defaults > Company Operations > Funding |
| Management Fees | Base %, incentive % | Model Defaults > Company Operations > Revenue |
| Compensation | Staff salary, tiers, partner comp | Model Defaults > Company Operations > People |
| Fixed Overhead | Escalation + 4 overhead items | Model Defaults > Company Operations > Fixed Overhead |
| Variable Costs | 4 items | Model Defaults > Company Operations > Variable Costs |
| Tax | Company tax rate | Model Defaults > Company Operations > Tax |
| Exit Assumptions | Cost of equity, exit cap rate, sales commission | Model Defaults > Property Underwriting > Disposition |
| Property Expense Rates | Event, other, utilities split | Model Defaults > Property Underwriting > Operating Costs |
| Catering | Catering boost % | Model Defaults > Property Underwriting > Revenue |

### From Code Constants

| Constant | Value | Moves To |
|----------|-------|----------|
| `DEPRECIATION_YEARS` | 27.5 | Model Defaults > Property Underwriting (governed) |
| `DAYS_PER_MONTH` | 30.5 | Model Defaults > Market & Macro (governed) |
| `DEFAULT_*` client-side (ADR, occupancy, ramp) | various | Model Defaults > Property Underwriting > Revenue |
| All remaining `DEFAULT_*` | various | Corresponding Model Defaults field |

### Config Switches (NOT defaults — stay in current admin tabs)

| Switch | Stays In |
|--------|----------|
| Sidebar visibility toggles (×10) | Admin > Navigation & Display |
| Show calc details (×2) | Admin > Navigation & Display (moved FROM Settings) |
| Show tour prompt | Admin > Navigation & Display (moved FROM Settings) |
| Auto-refresh research | Admin > Research Center (moved FROM Settings) |
| Preferred LLM | Admin > Research Center (already there) |
| Rebecca enabled/config | Admin > AI Agents |

---

## 8. Data Flow

```
┌─────────────────────────────────────────────────────┐
│              ADMIN > MODEL DEFAULTS                  │
│  ┌─────────────┐ ┌────────────────┐ ┌────────────┐ │
│  │ Market &    │ │ Company        │ │ Property   │ │
│  │ Macro       │ │ Operations     │ │ Underwr.   │ │
│  └──────┬──────┘ └───────┬────────┘ └─────┬──────┘ │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          ▼                ▼                ▼
    Research &        Company page     New property
    benchmarks        (direct edit —   creation
                      singleton)           │
                           │               ▼
                           ▼          Property Edit
                      /company        (pre-filled,
                      (results +       user edits
                       read-only       and saves)
                       input panel)        │
                                           ▼
                                      Property OWNS
                                      its values
```

**When admin changes a Property Underwriting default** → only affects next property created. Existing properties unchanged.

**When admin changes a Company Operations value** → immediately affects company pro-forma (singleton).

**When admin changes a Market & Macro value** → immediately affects research context and calculations reading this global value.

---

## 9. Implementation Phases

### Phase 1: Schema & Database
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Add missing columns to `globalAssumptions` for fields that don't have DB columns yet (revenue defaults, cost segregation, AR/AP days, cost of equity, payroll burden rate). Write idempotent migration. Runs on next server start.

### Phase 2: Admin Model Defaults UI
**Effort:** Medium | **Risk:** Medium | **Depends on:** Phase 1

Create `ModelDefaultsTab.tsx` with 3 sub-tabs. Follow existing admin tab patterns. Wire to `PATCH /api/global-assumptions`. Add to admin sidebar as first item in Business group.

**Replit Task #166 covers Phases 1 + 2 + 5.**

### Phase 3: Governed Field Component
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Create `GovernedField.tsx` component with shield icon, authority badge, collapsible helper text. Apply to depreciation years and days per month.

### Phase 4: Company Page Read-Only Panel
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Create `ModelInputsPanel.tsx` — read-only expandable accordion on `/company` page.

### Phase 5: Extend Property Creation Pre-fill
**Effort:** Small | **Risk:** Medium | **Depends on:** Phase 1

**Already exists:** `buildPropertyDefaultsFromGlobal()` fills cost rates, financing, exit, fees. Extend it to include revenue defaults (ADR, occupancy, ramp) from database instead of client constants. Update `AddPropertyDialog` to read from API.

### Phase 6: Eliminate Settings Page
**Effort:** Small | **Risk:** Low | **Depends on:** Phase 2

Remove `/settings` route and sidebar item. Add redirect. Move display toggles to Navigation & Display. Move research auto-refresh to Research Center. Move tour toggle to Navigation & Display.

### Phase 7: Company Assumptions Consolidation
**Effort:** Medium | **Risk:** Medium | **Depends on:** Phase 2, 4

Move company identity fields to Model Defaults > Company Operations > Identity. Move exit/expense fields to Property Underwriting. Redirect `/company/assumptions` for non-admins.

### Phase 8: Code Constants Migration
**Effort:** Large | **Risk:** High | **Depends on:** Phase 1, 5

**Scope:** `DEPRECIATION_YEARS` referenced in 42 files. `DAYS_PER_MONTH` in 48 files. 30+ test files import these constants.

Migrate one constant at a time. Start with `DEPRECIATION_YEARS`. Then `DAYS_PER_MONTH`. Then remaining `DEFAULT_*`. Full test suite after each.

### Phase 9: Testing & Documentation
**Effort:** Medium | **Risk:** Low | **Depends on:** All phases

New tests: model-defaults proof test, governed-fields engine test, settings-elimination test. Run `npm run verify:summary` → UNQUALIFIED. Run `npm run health`.

### Summary

```
Phase 1: Schema (no deps)
    ├── Phase 2: Model Defaults UI (depends on 1)
    ├── Phase 3: Governed Fields (no deps)
    ├── Phase 4: Company Read-Only Panel (no deps)
    ├── Phase 5: Property Creation Pre-fill (depends on 1)
    │
    ├── Phase 6: Eliminate Settings (depends on 2)
    ├── Phase 7: Company Assumptions Consolidation (depends on 2, 4)
    │
    ├── Phase 8: Code Constants Migration (depends on 1, 5) ← HIGHEST RISK
    │
    └── Phase 9: Testing & Documentation (depends on all)
```

| Phase | Work | Effort | Risk | Depends On |
|-------|------|--------|------|------------|
| 1 | Schema & Database | Small | Low | — |
| 2 | Admin Model Defaults UI | Medium | Medium | 1 |
| 3 | Governed Field Component | Small | Low | — |
| 4 | Company Page Read-Only Panel | Small | Low | — |
| 5 | Extend Property Creation Pre-fill | Small | Medium | 1 |
| 6 | Eliminate Settings Page | Small | Low | 2 |
| 7 | Company Assumptions Consolidation | Medium | Medium | 2, 4 |
| 8 | Code Constants Migration | **Large** | **High** | 1, 5 |
| 9 | Testing & Documentation | Medium | Low | All |

**Parallelizable:** Phases 3, 4, 5 can run in parallel after Phase 1.

**Phase 8 warning:** Highest-risk phase. 90+ files reference the constants. Migrate one at a time, full test suite after each.

---

*This document covers only the defaults governance redesign. For other initiatives see the companion documents in `.claude/plans/`.*
