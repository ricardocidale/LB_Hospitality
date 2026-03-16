# UX Redesign Plan: Defaults Governance & App Simplification

**Version**: 1.0
**Date**: 2026-03-16
**Status**: Draft for approval
**Planned by**: Claude Code Opus 4.6 (Anthropic) in collaboration with the project owner

---

## Instructions for Replit Agent

This document was authored by **Claude Code Opus 4.6** through an extended conversation with the project owner. It represents a comprehensive analysis of the current application, its UX problems, and a proposed redesign covering everything from navigation to database schema to code governance.

**This is a guide and suggestion, not a rigid specification.**

You (Replit Agent) are free to — and encouraged to:

1. **Use your own judgement.** If something in this plan doesn't make sense given what you see in the actual codebase, trust what you see. The codebase is the ground truth. This plan was written from exploration, not omniscience.

2. **Ask the user questions.** When you encounter ambiguity, conflicting information, or a decision point not covered here, ask the project owner directly. They are the final authority on product decisions.

3. **Replan as needed.** You don't need to follow this plan linearly or literally. If you find a better approach, a simpler implementation, or discover that a section of this plan is outdated or incorrect, adapt. Propose your revised approach to the user and proceed with their approval.

4. **Break work into small steps.** This is a large plan. Don't try to implement it all at once. Pick a phase, confirm the approach with the user, implement, verify (run tests + verify pipeline), then move to the next phase.

5. **Verify constantly.** After any financial change, run `npm run verify:summary`. After any change at all, run `npm run test:summary`. The automated test suite (3,035 tests) and 7-phase verification pipeline are the ultimate arbiters of correctness. If tests pass and verification shows UNQUALIFIED, you're on the right track.

6. **Read the rules.** The `.claude/rules/` directory contains 19 binding governance rules. These were written over months of development and encode hard-won lessons. Read the relevant rules before implementing each phase — they'll save you from known pitfalls.

7. **Don't be constrained by section ordering.** The phases in Section 15 suggest an implementation sequence, but you may find a different order works better. Dependencies are noted — respect those, but otherwise sequence as makes sense.

8. **Flag disagreements.** If you believe a recommendation in this plan is wrong, suboptimal, or conflicts with Replit best practices, say so. The project owner values honest technical feedback over blind compliance.

The goal is a better app, not perfect adherence to this document.

---

## Audit Findings & Plan Corrections (2026-03-16)

A codebase audit was performed after drafting the plan. The following discrepancies were found between the plan's assumptions and the actual codebase. All corrections have been incorporated into the plan sections below, but are listed here for transparency.

### Finding 1: Settings Page Has 3 Tabs (Not As Described)

**Actual state:** The Settings page (`/settings`) has 3 tabs:
- **"Property Defaults"** (not "Portfolio") — 9 fields: disposition commission + 4 acquisition financing defaults + 4 refinance defaults (all sliders)
- **"Macro"** — 2 fields: fiscal year start month (dropdown) + inflation escalator factor (slider)
- **"Other"** — 4 toggle switches: show company calculation details, show property calculation details, auto-refresh research on login, show tour prompt on login

**Total: 15 fields.** The plan correctly identifies all fields but the tab name is "Property Defaults", not "Portfolio".

### Finding 2: Property Creation Already Reads from globalAssumptions

**Actual state:** The server route `POST /api/properties` already:
1. Fetches `globalAssumptions` from the database
2. Calls `buildPropertyDefaultsFromGlobal()` to build inherited defaults
3. Merges: for any field where the user didn't provide a value, fills from globalAssumptions (with constant fallbacks)

This means **the property creation pre-fill flow proposed in Phase 4 partially exists already**. What's missing:
- Revenue assumption defaults (ADR, occupancy, ramp) are pre-filled on the **client side** from `constants.ts`, NOT from the database
- The new fields proposed (depreciationYears, daysPerMonth, AR/AP days, cost segregation) don't exist in the schema yet
- The Admin UI for editing these defaults doesn't exist

**Correction:** Phase 4 should focus on extending the existing `buildPropertyDefaultsFromGlobal()` to include the new database-driven fields, and moving client-side constant pre-fills (ADR, occupancy defaults) to the server-side merge.

### Finding 3: Company Assumptions Page Has More Fields Than Listed

**Actual state verified:** The Company Assumptions page has 12 sections with 63+ editable fields (not counting research badges and computed displays). Key sections verified:
- **Company Setup** — 14 fields (logo, name, ops start date, projection years, inflation rate, contact info, address)
- **Funding** — 13 fields + 3 conditional toggles (tranche amounts/dates, valuation cap, discount rate, interest)
- **Compensation** — 7 fields (staff salary, 6 staffing tier parameters)
- **Fixed Overhead** — 5 fields (escalation rate + 4 overhead items)
- **Variable Costs** — 4 fields
- **Tax** — 1 field (company income tax rate)
- **Exit Assumptions** — 3 fields (cost of equity, exit cap rate, sales commission)
- **Property Expense Rates** — 3 fields (event expense, other expense, utilities variable split)
- Plus: Management Fees, Catering, Partner Comp, Summary Footer sections (not fully audited)

**Correction:** The plan's field inventory in Section 6 (Company Operations tab) is accurate for fields moving to Model Defaults. No changes needed.

### Finding 4: CompaniesTab Manages "Companies of Interest", NOT Management Company Identity

**Actual state:** `CompaniesTab.tsx` manages external companies (SPVs, investors, partners) — it does NOT manage the management company's name, logo, or contact info. The management company identity is stored in `globalAssumptions` fields and edited on the Company Assumptions page.

**Correction to plan:** Section 11 (Field Migration Map) proposed moving company identity fields to "Admin > Companies tab". This is incorrect — the Companies tab manages a different entity. Two options:
- **Option A:** Add a dedicated "Management Company" card at the top of CompaniesTab (distinguished from "Companies of Interest")
- **Option B:** Keep management company identity in the new Model Defaults > Company Operations tab (since it's the only management company and these fields drive the model)

**Recommendation:** Option B is simpler. Company name, logo, and contact info stay in Model Defaults > Company Operations > Company Identity section. The CompaniesTab remains for external companies only.

### Finding 5: ResearchCenterTab Already Has Preferred LLM Selection

**Actual state:** `ResearchCenterTab.tsx` already has a 4-tab structure including an "LLM" tab with primary/secondary LLM selection, LLM mode (primary-only / dual), and cached model management. The plan correctly states this stays in Research Center.

**No correction needed** — the plan already says preferred LLM stays in Research Center (Appendix A).

### Finding 6: DEPRECIATION_YEARS and DAYS_PER_MONTH Schema Columns Don't Exist Yet

**Actual state confirmed:**
- `shared/schema/config.ts` (globalAssumptions): NO `depreciationYears` or `daysPerMonth` columns
- `shared/schema/properties.ts` (properties): NO `depreciationYears` column
- The constants are used in 42+ files (DEPRECIATION_YEARS) and 48+ files (DAYS_PER_MONTH)
- The key usage of DEPRECIATION_YEARS is in `resolve-assumptions.ts` line 158: `buildingValue / DEPRECIATION_YEARS / 12`
- 30+ test files import these constants directly

**No correction needed** — the plan correctly identifies this as Phase 1 schema work. But note: test migration will be significant (30+ test files reference the constant).

### Finding 7: No "Governed Field" UI Pattern Exists Yet

**Actual state:** There is no shield icon component, authority citation component, or any "governed field" pattern in the UI. This is entirely new work (Phase 3).

**No correction needed** — the plan correctly identifies this as new work.

### Finding 8: Two-Layer Default System (Client + Server)

**Actual state:** Property defaults come from TWO separate layers:
- **Client layer:** `Portfolio.tsx` pre-fills form with client constants (DEFAULT_ROOM_COUNT, DEFAULT_START_ADR, DEFAULT_ADR_GROWTH_RATE, DEFAULT_START_OCCUPANCY, DEFAULT_MAX_OCCUPANCY, DEFAULT_OCCUPANCY_RAMP_MONTHS, DEFAULT_OCCUPANCY_GROWTH_STEP, DEFAULT_CATERING_BOOST_PCT)
- **Server layer:** `buildPropertyDefaultsFromGlobal()` fills operating cost rates, financing terms, exit rates, management fees from globalAssumptions

**Correction:** The plan should note that unifying these into a single database-driven flow requires:
1. Moving client-side defaults (ADR, occupancy, ramp) into globalAssumptions as new columns
2. Updating `buildPropertyDefaultsFromGlobal()` to include them
3. Updating the AddPropertyDialog to read initial values from the API instead of constants

### Finding 9: Settings Tab Name Discrepancy

**Actual state:** Settings page tab 1 is labeled **"Property Defaults"**, not "Portfolio" as stated in several places in the plan.

**Correction:** Minor naming fix. The content is correctly identified regardless of tab label.

### Summary of Required Plan Corrections

| Section | Issue | Correction |
|---------|-------|------------|
| Section 6, Company Operations | Company identity proposed to move to CompaniesTab | Keep in Model Defaults > Company Operations (CompaniesTab is for external companies) |
| Section 8 | Company identity "moved to Admin > Companies" | Remove this; keep identity in Company Operations tab |
| Section 11 | Field migration: "Company name → Admin > Companies" | Change to: "Company name → Admin > Model Defaults > Company Operations > Identity" |
| Phase 4 | "Property creation reads from defaults" | Note: partially implemented already. Focus on extending `buildPropertyDefaultsFromGlobal()` and unifying client-side constants |
| Phase 8 | "Replace code constants" | Note: 30+ test files will need updates. Budget significant test migration effort. |
| General | Settings tab called "Portfolio" | Correct name is "Property Defaults" |

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Information Architecture — Complete App Map](#2-information-architecture)
3. [Navigation — Sidebar Structure](#3-navigation)
4. [Page-by-Page Specification](#4-page-specifications)
5. [Admin Panel Redesign](#5-admin-panel)
6. [Model Defaults — The New Admin Section](#6-model-defaults)
7. [Governed Fields System](#7-governed-fields)
8. [Company Page Redesign](#8-company-page)
9. [Property Edit Redesign](#9-property-edit)
10. [Pages Removed](#10-pages-removed)
11. [Field Migration Map](#11-field-migration-map)
12. [Code Constants Migration](#12-code-constants)
13. [Data Flow Diagram](#13-data-flow)
14. [Access Control Matrix](#14-access-control)
15. [Implementation Phases](#15-implementation)

---

## 1. Design Principles

### Core UX Rules

1. **All model defaults live in one place** — Admin > Model Defaults, with three tabs: Market & Macro, Company Operations, Property Underwriting.
2. **Every calculated value traces to a configurable default** — No code constants. No magic numbers. If it affects a calculation, it's a default someone can see and change.
3. **Defaults are starting points, not live bindings** — They pre-fill entities at creation time. Changing a default does NOT retroactively change existing entities.
4. **Non-admin users get a clean operational experience** — No settings pages, no defaults configuration, no configuration burden. Every nav item is something they use daily.
5. **Governed values inform, not block** — Values backed by regulation or authority (e.g., IRS depreciation years) are editable but carry shield icon + authority citation + caution text.
6. **Configuration switches are not defaults** — Sidebar toggles, AI agent settings, display preferences are platform behavior. They stay in their relevant admin tabs, not in Model Defaults.
7. **If no one can change a value in the UI, it shouldn't exist as a value** — It's dead code. Every stored value must be editable by someone.

### Visual Design Standards

- Every page must look like a premium $50K+ financial platform
- Animated numbers on financial values (NumberTicker)
- Glassmorphism cards with backdrop blur and depth
- Staggered reveals for lists and grids (never all-at-once)
- Skeleton loading states (never spinner-only)
- Typography: IBM Plex Sans (headings), Inter (body), JetBrains Mono (numbers)
- All colors via CSS variables / theme tokens (no hardcoded hex)

---

## 2. Information Architecture — Complete App Map

### Site Map (Post-Redesign)

```
PUBLIC (no auth)
├── /login                    Login page (3D logo, email+password)
├── /privacy                  Privacy policy
└── /terms                    Terms of service

AUTHENTICATED — NON-ADMIN USERS
├── / (Dashboard)             Portfolio overview + financial statements
│   ├── Portfolio Overview tab     KPI cards, charts, distribution
│   ├── Income Statement tab       Consolidated P&L
│   ├── Cash Flow tab              Operating/investing/financing
│   ├── Balance Sheet tab          Consolidated BS
│   └── Investment Analysis tab    IRR, equity multiple, returns
│
├── /portfolio                Property grid + map
│   ├── Properties tab             Card grid of all properties
│   └── Map tab                    MapLibre geographic view
│
├── /property/:id             Single property financials
│   ├── Income Statement tab       Property P&L
│   ├── Cash Flow tab              Property cash flows
│   ├── Balance Sheet tab          Property BS
│   ├── PPE Schedule tab           Depreciation schedule
│   └── Reconciliation tab         (admin/checker only)
│
├── /property/:id/edit        Property assumptions editor
│   ├── Description section
│   ├── Basic Info section
│   ├── Timeline section
│   ├── Capital Structure section
│   ├── Revenue Assumptions section
│   ├── Operating Cost Rates section
│   ├── Management Fees section
│   └── Other Assumptions section
│
├── /property/:id/photos      Property photo management
├── /property/:id/research    Property market research results
├── /property/:id/criteria    Property research criteria editor
│
├── /company                  Management company financials
│   ├── Income tab                 Company P&L
│   ├── Cash Flow tab              Company cash flows
│   ├── Balance Sheet tab          Company BS
│   └── Model Inputs panel         READ-ONLY expandable summary
│
├── /company/icp-definition   ICP target property definition
│   ├── Location tab
│   ├── Property Profile tab
│   ├── Property Description tab
│   └── ICP Definition tab
│
├── /company/research         Company market research
│   ├── Operations group (5 sub-tabs)
│   ├── Marketing group (5 sub-tabs)
│   └── Industry group (5 sub-tabs)
│
├── /analysis                 Analysis hub
│   ├── Sensitivity tab            Variable sliders + heatmap + tornado
│   ├── Compare tab                Side-by-side (up to 4 properties)
│   ├── Timeline tab               Acquisition timeline visualization
│   ├── Financing tab              DSCR, debt yield, stress test, prepayment
│   └── Capital Raise tab          Funding runway + SAFE modeling
│
├── /scenarios                Scenario management
├── /property-finder          External property search + favorites
├── /map                      Portfolio geographic map (full page)
├── /voice                    Voice/chat AI assistant lab
│   ├── Voice Orb tab
│   ├── Full Chat tab
│   ├── Floating Bar tab
│   ├── Transcriber tab
│   └── Speaker tab
│
├── /profile                  User profile + theme selection
└── /help                     Documentation
    ├── User Manual tab (17 sections)
    ├── Checker Manual tab (admin/checker only, 21 sections)
    └── Guided Tour tab

ADMIN ONLY
└── /admin                    Admin hub (sidebar + content)
    ├── Business group
    │   ├── Model Defaults         ★ NEW — All financial defaults
    │   │   ├── Market & Macro tab
    │   │   ├── Company Operations tab
    │   │   └── Property Underwriting tab
    │   ├── Users
    │   │   ├── Accounts sub-tab
    │   │   ├── Company Assignment sub-tab
    │   │   └── Group Assignment sub-tab
    │   ├── Companies              Company identity + branding
    │   └── Groups                 User groups + themes
    │
    ├── Research group
    │   ├── ICP Management Co      ICP editor (from IcpStudio)
    │   └── Research Center        AI tool toggles, LLM selection, per-event config
    │
    ├── Design group
    │   ├── Logos                   Logo pool management
    │   └── Themes                 Color theme designer
    │
    ├── AI Agents group
    │   └── AI Agents              Marcela (voice) + Rebecca (text) config
    │
    └── System group
        ├── Navigation & Display   Sidebar toggles + display settings + tour
        ├── Notifications          Email channels, alert rules, delivery
        ├── Diagrams               Architecture visualizations
        ├── Verification           GAAP audit + proof suite
        ├── Database               Entity monitoring + seed data
        ├── Integrations           Service health + circuit breakers + cache
        └── Activity               Login logs, audit trail
```

---

## 3. Navigation — Sidebar Structure

### Non-Admin User Sidebar

```
┌──────────────────────────────┐
│  [Company Logo]              │
│  Company Name                │
├──────────────────────────────┤
│                              │
│  HOME                        │
│  ○ Dashboard          /      │
│  ○ Properties    /portfolio  │
│  ○ Mgmt Company  /company   │
│                              │
│  TOOLS                       │
│  ○ Simulation    /analysis   │
│  ○ Property Finder /prop-f.  │
│  ○ Map View      /map       │
│                              │
│  ACCOUNT                     │
│  ○ My Profile    /profile   │
│  ○ My Scenarios  /scenarios │
│                              │
├──────────────────────────────┤
│  ○ Help          /help      │
│  ○ Sign Out                  │
│  Privacy · Terms             │
└──────────────────────────────┘
```

**Removed from non-admin sidebar:**
- "General Settings" — eliminated; all content moved to Admin

**Conditionally visible** (controlled by admin Navigation & Display toggles):
- Simulation (sidebarSensitivity)
- Property Finder (sidebarPropertyFinder)
- Map View (sidebarMapView)
- My Scenarios (sidebarScenarios)
- Help (sidebarUserManual)

**Always visible (locked):**
- Dashboard, Properties, Mgmt Company, My Profile, Sign Out

### Admin User Sidebar (on /admin page)

```
┌──────────────────────────────┐
│  Admin Panel                 │
│  ← Back to App               │
├──────────────────────────────┤
│                              │
│  BUSINESS                    │
│  ● Model Defaults    ★ NEW  │
│  ○ Users                     │
│  ○ Companies                 │
│  ○ Groups                    │
│                              │
│  RESEARCH                    │
│  ○ ICP Management Co         │
│  ○ Research Center           │
│                              │
│  DESIGN                      │
│  ○ Logos                     │
│  ○ Themes                    │
│                              │
│  AI AGENTS                   │
│  ○ AI Agents                 │
│                              │
│  SYSTEM                      │
│  ○ Navigation & Display      │
│  ○ Notifications             │
│  ○ Diagrams                  │
│  ○ Verification              │
│  ○ Database                  │
│  ○ Integrations              │
│  ○ Activity                  │
│                              │
└──────────────────────────────┘
```

### Mobile Navigation

**Bottom tab bar (4 items):**
```
[ Dashboard ] [ Properties ] [ Company ] [ Profile ]
```

**Hamburger menu:** Opens sheet drawer with full sidebar

---

## 4. Page-by-Page Specification

### 4.1 Dashboard (`/`)

**Purpose:** Portfolio-wide financial overview with consolidated statements.

**Header:** PageHeader (dark variant)
- Title: "Portfolio Dashboard"
- Subtitle: "{N} Properties · {projectionYears}-Year Model"
- Actions: ExportMenu (all 6 formats)

**Tab bar:** CurrentThemeTab with 5 tabs

#### Tab: Portfolio Overview (default)
```
┌─────────────────────────────────────────────────────┐
│  KPI Grid (2 rows × 4 columns)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Total Rev │ │ GOP      │ │ Active   │ │ Mgmt   │ │
│  │$XX.XM    │ │$XX.XM    │ │ Props: N │ │ Fees   │ │
│  │▲ trend   │ │▲ trend   │ │          │ │$XX.XM  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ IRR      │ │ Equity   │ │ Cash on  │ │ Exit   │ │
│  │ XX.X%    │ │ Multiple │ │ Cash     │ │ Value  │ │
│  │ gauge    │ │ XX.Xx    │ │ XX.X%    │ │$XX.XM  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│  Revenue vs NOI Trend (AreaChart, gradient fill)     │
│  ┌───────────────────────────────────────────────┐  │
│  │ ████████████████████████████████  Revenue     │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        NOI          │  │
│  │ Year1  Year2  Year3 ... Year10                │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────────┐│
│  │ Revenue Breakdown   │ │ Investment Summary       ││
│  │ (DonutChart)        │ │ Total Equity: $XX.XM     ││
│  │ Rooms / F&B / Events│ │ Total Debt: $XX.XM       ││
│  │ / Other             │ │ Wtd Avg Cap Rate: X.X%   ││
│  └─────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### Tab: Income Statement
- Consolidated multi-year P&L table (FinancialTable component)
- Expandable per-property drill-down rows
- Revenue, departmental expenses, GOP, management fees, NOI, interest, depreciation, net income
- Exports: all 6 formats

#### Tab: Cash Flow
- GAAP indirect method: OCF, investing, financing
- Per-property breakdown expandable
- Equity/debt timeline chart

#### Tab: Balance Sheet
- Consolidated BS via ConsolidatedBalanceSheet component
- Assets, liabilities, equity sections

#### Tab: Investment Analysis
- IRR (levered/unlevered), equity multiple, cash-on-cash
- Sensitivity summary cards
- Return metrics by property

---

### 4.2 Portfolio (`/portfolio`)

**Purpose:** View and manage all properties in the portfolio.

**Header:** PageHeader (dark variant)
- Title: "Portfolio"
- Subtitle: "{N} Properties"
- Actions: "Add Property" button (opens AddPropertyDialog)

**Tab bar:** CurrentThemeTab with 2 tabs

#### Tab: Properties (default)
```
┌─────────────────────────────────────────────────────┐
│  Property Card Grid (responsive: 1/2/3 columns)     │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ [Photo]    │  │ [Photo]    │  │ [Photo]    │    │
│  │ Hotel Name │  │ Hotel Name │  │ Hotel Name │    │
│  │ Location   │  │ Location   │  │ Location   │    │
│  │ Status ●   │  │ Status ●   │  │ Status ●   │    │
│  │ [⋯ menu]   │  │ [⋯ menu]   │  │ [⋯ menu]   │    │
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                      │
│  Cards sorted by acquisition date                    │
│  Each card: hero photo, name, location, status badge │
│  Menu: View, Edit, Photos, Research, Delete          │
└─────────────────────────────────────────────────────┘
```

#### Tab: Map
- Embedded MapView with property location pins
- Cluster markers at zoom-out levels

#### Add Property Dialog
Fields:
- Property name (required)
- Location (required)
- Photo (optional, PropertyImagePicker)
- Acquisition date (required)
- Operations start date (auto-filled: acq + 6 months)
- Room count (required)
- Starting ADR (required)
- Purchase price (required)
- Financing type: Full Equity / Financed

**On creation:** All remaining fields pre-filled from Admin > Model Defaults > Property Underwriting tab. User can then edit on Property Edit page.

---

### 4.3 Property Detail (`/property/:id`)

**Purpose:** View single property financial statements and metrics.

**Header:** Property photo banner + property name + location + dates + status badge

**Tab bar:** CurrentThemeTab with 4-5 tabs + ExportMenu in rightContent

#### Tab: Income Statement (default)
- Multi-year property P&L (FinancialTable)
- Revenue line items: Rooms, F&B, Catering, Events, Other
- Expense line items: USALI departmental categories
- GOP, Management Fees (base + incentive), NOI
- Interest expense, Depreciation, Tax, Net Income
- Expandable detail rows showing calculation breakdowns

#### Tab: Cash Flow
- Operating, investing, financing activities
- Free cash flow to firm (FCFF) and equity (FCFE)
- Cumulative cash position

#### Tab: Balance Sheet
- Property-level BS
- Assets (land, building, improvements, accumulated depreciation, cash)
- Liabilities (acquisition debt, refinance debt)
- Equity (invested equity, retained earnings)

#### Tab: PPE Schedule
- Cost basis table: land, building, improvements
- Depreciation schedule (annual and cumulative)
- Net book value by year

#### Tab: Reconciliation (admin/checker only)
- Internal verification checks
- Balance sheet tie-out
- Cash flow reconciliation to cash change

**Side panels:**
- Benchmark Panel (market comparables, performance vs. research)
- Document Extraction Panel (AI document parsing)

---

### 4.4 Property Edit (`/property/:id/edit`)

**Purpose:** Edit all financial assumptions for a single property.

**Header:** PageHeader (dark variant)
- Title: "{Property Name}"
- Subtitle: "Edit Assumptions"
- Actions: SaveButton
- Back link: /property/:id

**Layout:** Single scrollable page with collapsible accordion sections.

**Research integration:** Research badge icons appear next to fields where AI-generated benchmarks are available. Clicking badge shows recommended value + confidence + source. "Apply Research" dialog to bulk-apply recommendations.

#### Sections (in order):

**1. Description**
- Property name (text input)
- Description (textarea)
- Photo picker (PropertyImagePicker)

**2. Basic Info**
- Market (text)
- Property type (select)
- Street address, City, State, Zip, Country
- Status (select: Pipeline / Under LOI / In Due Diligence / Acquired / Operating)
- Room count (number)

**3. Timeline**
- Acquisition date (date picker)
- Operations start date (date picker, auto-suggests acq + 6 months)
- Stabilization months (number, default from Model Defaults)

**4. Capital Structure**
- Purchase price ($)
- Building improvements ($)
- Pre-opening costs ($)
- Operating reserve ($)
- Land value percent (%)
- Financing type (select: Full Equity / Financed)
- If Financed:
  - Acquisition LTV (%) — pre-filled from Property Underwriting defaults
  - Acquisition interest rate (%) — pre-filled from defaults
  - Acquisition term years — pre-filled from defaults
  - Acquisition closing cost rate (%) — pre-filled from defaults
- Refinance toggle (Yes/No)
- If Yes:
  - Refinance date or years after acquisition
  - Refinance LTV (%) — pre-filled from defaults
  - Refinance interest rate (%) — pre-filled from defaults
  - Refinance term years — pre-filled from defaults
  - Refinance closing cost rate (%) — pre-filled from defaults

**5. Revenue Assumptions**
- Starting ADR ($) — research badge
- ADR growth rate (%) — research badge
- Starting occupancy (%) — research badge
- Stabilized/max occupancy (%) — research badge
- Occupancy ramp months
- Occupancy growth step (%)
- F&B revenue share (% of room revenue)
- Catering boost (%)
- Event revenue share (% of room revenue) — research badge
- Other revenue share (% of room revenue)

**6. Operating Cost Rates**
All as % of relevant revenue, with research badges where available:
- Rooms department (%)
- F&B department (%)
- Admin & General (%)
- Marketing (%)
- Property Operations & Maintenance (%)
- Utilities (%)
- Property Taxes (%)
- IT & Telecom (%)
- FF&E Reserve (%)
- Other Operating (%)
- Insurance (%)

**7. Management Fees**
- Base management fee rate (%) — pre-filled from company default
- Incentive management fee rate (%) — pre-filled from company default
- Custom fee categories (if configured)

**8. Other Assumptions**
- Exit cap rate (%) — pre-filled from Property Underwriting defaults. Research badge.
- Property income tax rate (%) — pre-filled from defaults
- Property inflation rate (%) — if blank, uses macro inflation
- Disposition commission (%) — pre-filled from defaults
- Depreciation years — pre-filled from defaults. **GOVERNED FIELD** (shield icon + IRS Pub 946 citation)

**Governed field display (example for depreciation years):**
```
┌─────────────────────────────────────────────────┐
│  Depreciation Years              🛡 IRS Pub 946 │
│  ┌──────────┐                                   │
│  │  27.5    │                                   │
│  └──────────┘                                   │
│  ▸ 27.5 years: residential rental property.     │
│    39 years: nonresidential real property.       │
│    Changing this deviates from standard tax      │
│    depreciation. Consult your tax advisor.       │
└─────────────────────────────────────────────────┘
```

---

### 4.5 Company (`/company`)

**Purpose:** View management company pro-forma results.

**Header:** PageHeader (dark variant)
- Title: "{Company Name}"
- Subtitle: "Management Company Pro-Forma"
- Actions: ExportMenu (all 6 formats)

**Tab bar:** CurrentThemeTab with 3 tabs + ExportMenu

#### Tab: Income (default)
- Revenue: Base management fees + Incentive management fees (sum from all properties)
- Cost of Services (if centralized services configured)
- G&A: Office lease, professional services, tech, insurance, travel, IT licenses, marketing, misc
- Partner compensation
- Staff costs (salary × FTE based on tier)
- EBITDA, Depreciation (if any), Interest (on SAFE), Tax, Net Income
- Funding gate warning if pre-profitability shortfall

#### Tab: Cash Flow
- GAAP indirect method for management company
- Operating, investing, financing cash flows
- SAFE tranche inflows shown in financing section

#### Tab: Balance Sheet
- Assets: Cash, receivables
- Liabilities: SAFE notes (if not converted), payables
- Equity: Retained earnings

#### NEW: Model Inputs Panel (expandable, read-only)

Located below the tab bar, collapsed by default. Expandable accordion.

```
┌─────────────────────────────────────────────────────┐
│  ▸ Model Inputs                Set by administrator │
│                                                      │
│  (when expanded:)                                    │
│  ┌─────────────────────────────────────────────────┐│
│  │ Revenue Model                                    ││
│  │ Base mgmt fee: 8.5%  ·  Incentive fee: 12.0%   ││
│  ├─────────────────────────────────────────────────┤│
│  │ Funding                                          ││
│  │ Tranche 1: $1.0M (Jun 2026)                     ││
│  │ Tranche 2: $1.0M (Apr 2027)                     ││
│  │ Valuation cap: $2.5M  ·  Discount: 20%          ││
│  ├─────────────────────────────────────────────────┤│
│  │ People                                           ││
│  │ Partners: 3 (Year 1) · Staff salary: $75K/FTE   ││
│  │ Tier 1: ≤3 props → 2.5 FTE                      ││
│  │ Tier 2: ≤6 props → 4.5 FTE                      ││
│  │ Tier 3: 7+ props → 7.0 FTE                      ││
│  ├─────────────────────────────────────────────────┤│
│  │ Overhead                                         ││
│  │ Office: $36K · Prof Services: $24K               ││
│  │ Tech: $18K · Insurance: $12K                     ││
│  │ Escalation: 3.0%/yr                              ││
│  ├─────────────────────────────────────────────────┤│
│  │ Tax: 30%  ·  Cost of equity: 18%                ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  [If admin: "Edit in Admin → Model Defaults" link]   │
└─────────────────────────────────────────────────────┘
```

---

### 4.6 Analysis (`/analysis`)

**Purpose:** Multi-tool financial analysis hub.

**Header:** PageHeader (dark variant)
- Title: "Simulation & Analysis"
- Actions: ExportMenu

**Tab bar:** CurrentThemeTab with 5 tabs

#### Tab: Sensitivity
- Variable sliders panel (left): Occupancy, ADR growth, expense escalation, exit cap rate, inflation, interest rate, insurance rate
- Heatmap (center): IRR sensitivity matrix
- Tornado diagram (right): Variable impact ranking
- Comparison table (bottom): Results by property

#### Tab: Compare
- Property selector (up to 4)
- Radar chart: visual comparison
- Metrics table: side-by-side with best-value highlighting

#### Tab: Timeline
- Chronological visualization of acquisition + ops start events
- Color-coded event markers
- Property cards along timeline

#### Tab: Financing
- DSCR sub-tab: Loan sizing based on min DSCR (default 1.25x)
- Debt Yield sub-tab: Max loan by debt yield
- Stress Test sub-tab: NOI × interest rate matrix
- Prepayment sub-tab: Yield maintenance, step-down, defeasance

#### Tab: Capital Raise
- Cash runway projection chart
- SAFE valuation scenarios
- Months to positive cash flow
- Recommended tranche sizing

---

### 4.7 Scenarios (`/scenarios`)

**Purpose:** Save, load, compare model snapshots.

**Header:** PageHeader (dark variant)
- Title: "Scenarios"
- Actions: "Save Current" button

**Content:**
- KPI cards: Total scenarios, latest save date
- Scenario card grid: Name, description, dates, property count
- Actions per card: Load, Clone, Export (JSON), Import, Delete
- Compare dialog: Diff two scenarios showing assumption changes
- Base scenario is protected (cannot delete)

---

### 4.8 Property Finder (`/property-finder`)

**Purpose:** Search external real estate listings and save favorites.

**Header:** PageHeader (light variant)
- Title: "Property Finder"
- Subtitle: "Discover Acquisition Opportunities"

**Layout:**
- Search form: Location (required), price range, beds, lot size, type
- Saved searches bar (horizontal scroll)
- Results grid: Property cards with photos, price, details
- Favorites panel: Saved properties with notes
- Pagination controls

---

### 4.9 Profile (`/profile`)

**Purpose:** User account settings and theme selection.

**Header:** PageHeader (dark variant)
- Title: "My Profile"

**Sections:**

1. **Personal Info** — First name, last name, email, company, job title
2. **Password** — Current password, new password, confirm (with visibility toggles)
3. **Theme Selection** — Available themes with color palette previews and descriptions

---

### 4.10 Help (`/help`)

**Purpose:** Documentation and onboarding.

**Tab bar:** CurrentThemeTab with 2-3 tabs

#### Tab: User Manual
17 sections: Getting Started, Navigation, Dashboard, Properties, Property Details, Images, Management Company, Assumptions, Scenarios, Analysis, Property Finder, Exports, Marcela, Profile, Branding, Admin, Business Rules

**NEW section to add:** "Governed Values Reference" — explains depreciation years (IRS Pub 946), days per month (industry standard), and any other governed values with full authority citations and when deviation is appropriate.

#### Tab: Checker Manual (admin/checker only)
21 sections covering financial formulas, verification methodology, glossary

#### Tab: Guided Tour
Interactive walkthrough of app features

---

### 4.11 Map View (`/map`)

**Purpose:** Geographic portfolio visualization.

- MapLibre GL full-page map
- Supercluster property clustering at zoom-out
- Property popup cards on click: name, location, purchase price, rooms, ADR
- Globe animation on page load
- Timeline playback (animate acquisitions over time)

---

### 4.12 Voice Lab (`/voice`)

**Purpose:** AI assistant interface (Marcela voice / Rebecca text).

**Tab bar:** 5 mode tabs
- Voice Orb: Minimal voice-first with animated orb
- Full Chat: Chat + voice hybrid
- Floating Bar: Compact inline chat
- Transcriber: Real-time speech-to-text
- Speaker: Audio player with waveform

---

## 5. Admin Panel Redesign

### Admin Sidebar Groups (5 groups, 14 items)

#### Group 1: BUSINESS
Purpose: Core business configuration — financial model, users, companies, groups.

| Item | Icon | Component | Purpose |
|------|------|-----------|---------|
| **Model Defaults** | Sliders | `ModelDefaultsTab` (NEW) | All financial defaults in 3 tabs |
| Users | Users | `PeopleTab` | User accounts, roles, assignments |
| Companies | Building2 | `CompaniesTab` | Company identity, branding, contact info |
| Groups | UsersRound | `GroupsTab` | User groups, theme assignment, property visibility |

#### Group 2: RESEARCH
Purpose: AI research behavior and ICP definition.

| Item | Icon | Component | Purpose |
|------|------|-----------|---------|
| ICP Management Co | Target | `IcpContent` | Ideal customer profile editor |
| Research Center | FlaskConical | `ResearchCenterTab` | Tool toggles, LLM selection, per-event config |

#### Group 3: DESIGN
Purpose: Visual identity and branding.

| Item | Icon | Component | Purpose |
|------|------|-----------|---------|
| Logos | Image | `LogosTab` | Logo upload, import, AI generation |
| Themes | Palette | `ThemesTab` | Color theme designer + assignment |

#### Group 4: AI AGENTS
Purpose: Conversational AI configuration.

| Item | Icon | Component | Purpose |
|------|------|-----------|---------|
| AI Agents | Bot | `AIAgentsTab` | Marcela (voice) + Rebecca (text) config |

#### Group 5: SYSTEM
Purpose: Platform infrastructure and monitoring.

| Item | Icon | Component | Purpose |
|------|------|-----------|---------|
| Navigation & Display | LayoutDashboard | `NavigationDisplayTab` (RENAMED) | Sidebar toggles + display settings + tour |
| Notifications | Bell | `NotificationsTab` | Email channels, alert rules, delivery |
| Diagrams | GitBranch | `DiagramsTab` | Architecture visualizations |
| Verification | ShieldCheck | `VerificationTab` | GAAP audit + proof suite |
| Database | Database | `DatabaseTab` | Entity monitoring + seed data |
| Integrations | Plug | `IntegrationHealthTab` | Service health + cache |
| Activity | ClipboardList | `ActivityTab` | Login logs, audit trail |

---

## 6. Model Defaults — The New Admin Section

### Overview

This is the single source of truth for all financial defaults in the system. Three tabs, each with grouped sections. Every value here either:
- Pre-fills a field on a new entity (property or company) that a user then owns and can change, OR
- Directly drives a calculation where there's no per-entity override (e.g., days per month)

### Tab 1: Market & Macro

**Purpose:** Economic context, platform-wide calculation parameters, and universal conversion factors.

**Banner text:** *"These values provide economic context for research and benchmarking across the platform."*

#### Section: Economic Environment

| Field | Type | Default | Governed? | Notes |
|-------|------|---------|-----------|-------|
| Macro inflation rate | % | 3.0% | No | Used in research prompts and benchmarking. Separate from company and property inflation. |
| Cost of equity | % | 18.0% | No | Discount rate for DCF / NPV calculations |
| Days per month | number | 30.5 | **Yes** | 🛡 Industry standard (365/12). Used in all monthly-to-annual conversions. |

**Governed field — Days per month:**
```
Authority: Industry convention (365 ÷ 12 = 30.4167, rounded to 30.5)
Warning: "Changing this affects every monthly calculation in the system
including debt service, revenue accrual, and expense timing.
The industry standard of 30.5 is used by virtually all
hospitality financial models."
```

#### Section: Fiscal Calendar

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Fiscal year start month | select (1-12) | 1 (January) | Affects FY labeling on all statements |

---

### Tab 2: Company Operations

**Purpose:** Operating assumptions for the hospitality management company. These values directly drive the company pro-forma (since there's only one management company, these ARE the values, not templates).

**Banner text:** *"These values drive the management company pro-forma. Changes take effect immediately in the company financial model."*

#### Section: Company Identity

*Note: These fields were previously on the Company Assumptions page (CompanySetupSection). They move here because the CompaniesTab in admin manages external "Companies of Interest", not the management company itself.*

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Company logo | selector | (from logo pool) | Select from uploaded logos |
| Company name | text | "Hospitality Business" | Management company display name |
| Email | text | — | Company contact email |
| Phone | text | — | Company contact phone |
| Website | text | — | Company website URL |
| Tax ID / EIN | text | — | Federal employer ID |
| Founding year | number | — | Year company was established |
| Street address | text | — | HQ address |
| Country | select | — | Cascading: country → state → city |
| State / Province | select | — | |
| City | select | — | |
| Zip / Postal code | text | — | |

#### Section: Company Timeline

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Model start date | date | 2026-04-01 | When the financial model begins |
| Company operations start date | date | 2026-06-01 | When OpCo starts paying salaries/overhead |
| Projection years | number | 10 | 1-30 year model horizon |

#### Section: Funding Structure

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Funding source label | text | "Funding Vehicle" | Customizable: "SAFE", "Seed", "Series A", etc. |
| Tranche 1 amount | $ | 1,000,000 | |
| Tranche 1 date | date | 2026-06-01 | |
| Tranche 2 amount | $ | 1,000,000 | |
| Tranche 2 date | date | 2027-04-01 | |
| Valuation cap | $ | 2,500,000 | Max pre-money valuation for SAFE conversion |
| Discount rate | % | 20% | Discount on conversion price |
| Interest rate | % | 8% | Annual simple interest on funding |
| Payment frequency | select | Accrues only | Options: Accrues only, Quarterly, Annually |

#### Section: Revenue Model

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Base management fee | % | 8.5% | Applied to each property's revenue |
| Incentive management fee | % | 12.0% | Applied to NOI above hurdle |

#### Section: People & Compensation

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Staff salary per FTE | $ | 75,000 | Research badge available |
| Salary escalation rate | % | 3.0% | Annual raises |
| Payroll burden rate | % | 25% | Benefits + taxes as % of salary |
| Staffing tier 1: max properties | number | 3 | |
| Staffing tier 1: FTE count | number | 2.5 | |
| Staffing tier 2: max properties | number | 6 | |
| Staffing tier 2: FTE count | number | 4.5 | |
| Staffing tier 3: FTE count | number | 7.0 | For 7+ properties |

**Partner compensation table:**

| Year | Partner Count | Annual Comp ($) |
|------|--------------|-----------------|
| 1 | 3 | 540,000 |
| 2 | 3 | 540,000 |
| 3 | 3 | 540,000 |
| 4 | 3 | 600,000 |
| 5 | 3 | 600,000 |
| 6 | 3 | 700,000 |
| 7 | 3 | 700,000 |
| 8 | 3 | 800,000 |
| 9 | 3 | 800,000 |
| 10 | 3 | 900,000 |

#### Section: Fixed Overhead

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Fixed cost escalation rate | % | 3.0% | Applied annually to all fixed costs |
| Office lease (Year 1) | $ | 36,000 | |
| Professional services (Year 1) | $ | 24,000 | Legal, accounting, audit |
| Technology infrastructure (Year 1) | $ | 18,000 | PMS, software, IT |
| Business insurance (Year 1) | $ | 12,000 | |

#### Section: Variable Costs

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Travel cost per client | $ | 12,000 | Scales with property count |
| IT license per client | $ | 3,000 | Scales with property count |
| Marketing rate | % | 5.0% | % of revenue base |
| Miscellaneous ops rate | % | 3.0% | % of revenue base |

#### Section: Company Tax

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Company income tax rate | % | 30% | Applied to positive net income |
| Company inflation rate | % | 3.0% | Override for company-specific escalation (if different from macro) |

---

### Tab 3: Property Underwriting

**Purpose:** Starting values applied to every new property acquisition. When a user creates a new property, these values pre-fill the Property Edit form. The user then owns and can change any value.

**Banner text:** *"These values will be applied as starting assumptions for the next property added to the portfolio. Existing properties are not affected."*

**Save confirmation toast:** *"Property defaults saved. These will apply to new properties. {N} existing properties retain their current values."*

#### Section: Revenue Assumptions

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Default starting ADR | $ | 250 | |
| Default ADR growth rate | % | 3.0% | |
| Default starting occupancy | % | 45% | |
| Default stabilized occupancy | % | 75% | |
| Default stabilization months | number | 36 | |
| Default F&B revenue share | % | 18% | % of room revenue |
| Default catering boost | % | 22% | Additional F&B uplift |
| Default event revenue share | % | 30% | % of room revenue |
| Default other revenue share | % | 5% | % of room revenue |

#### Section: Operating Cost Rates

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Rooms department | % | 20% | |
| F&B department | % | 9% | |
| Admin & General | % | 8% | |
| Marketing | % | 1% | |
| Property Ops & Maintenance | % | 4% | |
| Utilities | % | 5% | |
| Property Taxes | % | 3% | |
| IT & Telecom | % | 0.5% | |
| FF&E Reserve | % | 4% | |
| Other Operating | % | 5% | |
| Insurance | % | 1.5% | |
| Event expense rate | % | 65% | Cost of event revenue |
| Other expense rate | % | 60% | Cost of other revenue |
| Utilities variable split | % | 60% | % of utilities that scales with occupancy |

#### Section: Acquisition Financing

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Default LTV | % | 75% | |
| Default interest rate | % | 9.0% | |
| Default term (years) | number | 25 | Amortization period |
| Default closing cost rate | % | 2.0% | % of loan amount |

#### Section: Refinance Terms

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Default refi LTV | % | 75% | |
| Default refi interest rate | % | 7.0% | |
| Default refi term (years) | number | 25 | |
| Default refi closing cost rate | % | 3.0% | |

#### Section: Depreciation & Tax

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Depreciation years | number | 27.5 | **GOVERNED** 🛡 |
| Default property income tax rate | % | 25% | |
| Default property inflation rate | % | 3.0% | Per-property escalation |

**Governed field — Depreciation years:**
```
Authority: IRS Publication 946 — "How to Depreciate Property"
Warning: "27.5 years: residential rental property (most hotels).
39 years: nonresidential real property.
This value determines the annual depreciation deduction on each
property's income statement and affects net income, tax liability,
and balance sheet carrying values.
Changing this deviates from standard MACRS tax depreciation.
Consult your tax advisor before modifying."
```

#### Section: Disposition

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Default exit cap rate | % | 8.5% | Used to value property at sale (NOI ÷ cap rate) |
| Default sales commission | % | 5.0% | Broker commission on sale |
| Default real estate commission | % | 5.0% | Acquisition broker commission |

#### Section: Working Capital & Accounting

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Accounts receivable days | number | 30 | |
| Accounts payable days | number | 45 | |
| Reinvestment rate | % | 5.0% | |
| Day count convention | select | 30/360 | Options: 30/360, Actual/360, Actual/365 |
| Escalation method | select | Annual | Options: Annual, Monthly |

#### Section: Cost Segregation (Advanced)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Cost segregation enabled | toggle | Off | |
| 5-year property % | % | 15% | % of building cost in 5-year MACRS class |
| 7-year property % | % | 10% | % in 7-year class |
| 15-year property % | % | 5% | % in 15-year class |

#### Section: Default Acquisition Package

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Default purchase price | $ | 3,800,000 | |
| Default building improvements | $ | 1,200,000 | |
| Default pre-opening costs | $ | 200,000 | |
| Default operating reserve | $ | 250,000 | |
| Default months to operations | number | 6 | |

---

## 7. Governed Fields System

### What Makes a Field "Governed"

A governed field is any configurable value backed by:
- Tax law or regulation (IRS, ASC standards)
- Industry standard or convention
- Accounting authority (GAAP, USALI)

### Governed Fields Registry

| Field | Authority | Location(s) |
|-------|-----------|-------------|
| Depreciation years | IRS Publication 946 | Admin > Model Defaults > Property Underwriting AND Property Edit > Other Assumptions |
| Days per month | Industry convention (365/12) | Admin > Model Defaults > Market & Macro |

*(Additional governed fields may be identified during implementation)*

### Visual Design

**In Admin > Model Defaults:**
```
┌───────────────────────────────────────────────────────┐
│  Field Label                           🛡 Authority   │
│  ┌──────────────┐                                     │
│  │  27.5        │                                     │
│  └──────────────┘                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │                                                  │ │
│  │  Authority citation text explaining the value,   │ │
│  │  standard alternatives, and guidance on when     │ │
│  │  deviation is appropriate.                       │ │
│  │                                                  │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└───────────────────────────────────────────────────────┘
```

**Component design:**
- Shield icon (🛡) next to field label — conveys authority, not danger
- Authority name as subtle badge: "IRS Pub 946" or "Industry Standard"
- Helper text panel below the field:
  - Collapsed by default after first view (user has seen it)
  - Expanded by default on first encounter
  - Uses muted background (`bg-amber-50 border-amber-200` in light, `bg-amber-900/20 border-amber-500/30` in dark)
  - Body text in `small-text` class
- Same treatment appears on Property Edit when user encounters the field there
- The governed visual is purely informational — the field remains fully editable

**In Property Edit (user-facing):**
Same visual treatment as admin. The governance info travels with the field. A user editing depreciation years on a property sees the same shield icon and authority citation.

---

## 8. Company Page Redesign

### Current State
- `/company` — Pro-forma results (Income, Cash Flow, Balance Sheet tabs)
- `/company/assumptions` — 12 editable sections (identity + financial inputs)

### New State

#### `/company` (all users)
- Same 3 financial statement tabs (Income, Cash Flow, Balance Sheet)
- **NEW: "Model Inputs" expandable accordion** below tab bar
  - Read-only summary of all company financial inputs
  - Grouped by: Revenue Model, Funding, People, Overhead, Variable Costs, Tax
  - Shows current values in clean, scannable format
  - Label: "Set by administrator" (subtle text)
  - If user is admin: "Edit in Admin > Model Defaults" link button
- Exports: all 6 formats

#### `/company/assumptions` — ELIMINATED for non-admins
- This route redirects to `/company` for non-admin users
- Admin users editing company inputs do so via Admin > Model Defaults > Company Operations tab
- No separate assumptions editing page needed

#### Company identity fields (name, logo, contact, EIN, address)
- Moved to Admin > Companies tab
- The Companies tab already manages company entities — this consolidates identity in one place
- Company name displayed in sidebar/header comes from this admin configuration

---

## 9. Property Edit Redesign

### Changes from Current

1. **All financial fields pre-filled from Model Defaults > Property Underwriting** at creation time
2. **Governed fields** (depreciation years) show shield icon + authority citation
3. **Research badges** continue to appear next to relevant fields (no change)
4. **New fields exposed** that were previously hidden:
   - Property inflation rate (was in schema but not in UI)
   - Working capital: AR days, AP days (was in schema but not in UI)
   - Cost segregation settings (was in schema but not in UI)
   - Day count convention, escalation method (was in schema but not in UI)
5. **No "default" indicators** — the value in the field IS the value. User changes and saves. Simple.

### Pre-fill Flow on Property Creation

```
1. User clicks "Add Property" on Portfolio page
2. Fills minimal fields: name, location, acquisition date, rooms, ADR, purchase price
3. Clicks "Create"
4. System reads ALL values from Admin > Model Defaults > Property Underwriting
5. Creates property with:
   - User-entered values (name, location, etc.)
   - All other fields = default values from Property Underwriting
6. User lands on Property Edit page with all fields populated
7. User reviews, adjusts any values, clicks Save
8. Property now owns all its values — independent from defaults
```

---

## 10. Pages Removed

| Page/Route | Reason | Content Moved To |
|------------|--------|-----------------|
| `/settings` | All content moved to admin | Admin > Model Defaults (financial), Admin > Navigation & Display (toggles), Admin > Research Center (research auto-refresh) |
| `/company/assumptions` (for non-admins) | Company inputs now admin-only | Admin > Model Defaults > Company Operations. Read-only summary on `/company`. |
| "General Settings" sidebar item | No longer needed | Removed from non-admin sidebar |

### Redirects to Add
| Old Route | New Destination |
|-----------|----------------|
| `/settings` | `/company` (non-admin) or `/admin` with Model Defaults section (admin) |
| `/company/assumptions` | `/company` (non-admin) or `/admin` with Model Defaults section (admin) |

---

## 11. Field Migration Map

### From `/settings` (Settings page)

| Current Location | Field | Moves To |
|-----------------|-------|----------|
| Portfolio tab | Acquisition LTV | Admin > Model Defaults > Property Underwriting > Acquisition Financing |
| Portfolio tab | Acquisition interest rate | Admin > Model Defaults > Property Underwriting > Acquisition Financing |
| Portfolio tab | Acquisition term | Admin > Model Defaults > Property Underwriting > Acquisition Financing |
| Portfolio tab | Acquisition closing cost rate | Admin > Model Defaults > Property Underwriting > Acquisition Financing |
| Portfolio tab | Refi LTV | Admin > Model Defaults > Property Underwriting > Refinance Terms |
| Portfolio tab | Refi interest rate | Admin > Model Defaults > Property Underwriting > Refinance Terms |
| Portfolio tab | Refi term | Admin > Model Defaults > Property Underwriting > Refinance Terms |
| Portfolio tab | Refi closing cost rate | Admin > Model Defaults > Property Underwriting > Refinance Terms |
| Portfolio tab | Real estate commission rate | Admin > Model Defaults > Property Underwriting > Disposition |
| Macro tab | Inflation rate | Admin > Model Defaults > Market & Macro > Economic Environment |
| Macro tab | Fiscal year start month | Admin > Model Defaults > Market & Macro > Fiscal Calendar |
| Macro tab | Cost of equity | Admin > Model Defaults > Market & Macro > Economic Environment |
| Other tab | Show company calculation details | Admin > Navigation & Display |
| Other tab | Show property calculation details | Admin > Navigation & Display |
| Other tab | Research auto-refresh | Admin > Research Center |
| Other tab | Show guided tour | Admin > Navigation & Display |

### From `/company/assumptions` (Company Assumptions page)

| Current Location | Field | Moves To |
|-----------------|-------|----------|
| Company Setup | Company name | Admin > Model Defaults > Company Operations > Identity |
| Company Setup | Company logo | Admin > Model Defaults > Company Operations > Identity |
| Company Setup | Contact info (phone, email, website) | Admin > Model Defaults > Company Operations > Identity |
| Company Setup | Address (street, city, state, country, zip) | Admin > Model Defaults > Company Operations > Identity |
| Company Setup | EIN, founding year | Admin > Model Defaults > Company Operations > Identity |
| Company Setup | Model start date | Admin > Model Defaults > Company Operations > Timeline |
| Company Setup | Company ops start date | Admin > Model Defaults > Company Operations > Timeline |
| Company Setup | Projection years | Admin > Model Defaults > Company Operations > Timeline |
| Company Setup | Company inflation rate | Admin > Model Defaults > Company Operations > Tax |
| Funding | All SAFE fields | Admin > Model Defaults > Company Operations > Funding |
| Management Fees | Base fee %, Incentive fee % | Admin > Model Defaults > Company Operations > Revenue |
| Compensation | Staff salary, tiers | Admin > Model Defaults > Company Operations > People |
| Compensation | Partner comp/count (Yr 1-10) | Admin > Model Defaults > Company Operations > People |
| Fixed Overhead | All 4 overhead items + escalation | Admin > Model Defaults > Company Operations > Fixed Overhead |
| Variable Costs | All 4 variable cost items | Admin > Model Defaults > Company Operations > Variable Costs |
| Tax | Company tax rate | Admin > Model Defaults > Company Operations > Tax |
| Exit | Exit cap rate | Admin > Model Defaults > Property Underwriting > Disposition |
| Exit | Sales commission rate | Admin > Model Defaults > Property Underwriting > Disposition |
| Expense Rates | Event, other, utilities split | Admin > Model Defaults > Property Underwriting > Operating Cost Rates |
| Catering | Catering boost % | Admin > Model Defaults > Property Underwriting > Revenue Assumptions |

### From Code Constants (`shared/constants.ts`)

| Constant | Current Value | Moves To |
|----------|---------------|----------|
| `DEPRECIATION_YEARS` | 27.5 | Admin > Model Defaults > Property Underwriting > Depreciation & Tax (governed) |
| `DAYS_PER_MONTH` | 30.5 | Admin > Model Defaults > Market & Macro > Economic Environment (governed) |
| `DEFAULT_PROJECTION_YEARS` | 10 | Admin > Model Defaults > Company Operations > Timeline |
| All other `DEFAULT_*` | various | Corresponding field in appropriate Model Defaults tab |

---

## 12. Code Constants Migration

### Current Architecture
```
shared/constants.ts
  └── export const DEPRECIATION_YEARS = 27.5
  └── export const DAYS_PER_MONTH = 30.5
  └── export const DEFAULT_* = ...
         ↓
  Imported directly in engine code
```

### New Architecture
```
shared/constants.ts (SEED VALUES ONLY)
  └── export const SEED_DEFAULTS = {
        depreciationYears: 27.5,
        daysPerMonth: 30.5,
        ...all other seed values
      }
         ↓
  Used ONLY by migration/seed scripts to initialize DB
         ↓
  Database (globalAssumptions table)
    └── New columns: depreciationYears, daysPerMonth, etc.
         ↓
  Read by engine at calculation time
         ↓
  For property fields: copied to property at creation time
  For global fields: read from globalAssumptions at calculation time
```

### Schema Changes Required

Add to `globalAssumptions` table:
```sql
ALTER TABLE global_assumptions ADD COLUMN depreciation_years REAL DEFAULT 27.5;
ALTER TABLE global_assumptions ADD COLUMN days_per_month REAL DEFAULT 30.5;
```

### Engine Code Changes

```typescript
// BEFORE (hardcoded constant)
import { DEPRECIATION_YEARS } from '@/lib/constants';
const annualDepreciation = depreciableBasis / DEPRECIATION_YEARS;

// AFTER (from entity — property owns its value)
const annualDepreciation = depreciableBasis / property.depreciationYears;
// property.depreciationYears was set from defaults at creation time
```

```typescript
// BEFORE (hardcoded constant)
import { DAYS_PER_MONTH } from '@/lib/constants';
const monthlyRate = annualRate / 12;
const dailyRate = monthlyRate / DAYS_PER_MONTH;

// AFTER (from global assumptions — universal constant)
const dailyRate = monthlyRate / globalAssumptions.daysPerMonth;
```

---

## 13. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN > MODEL DEFAULTS                     │
│                                                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Market &    │  │ Company          │  │ Property       │  │
│  │ Macro       │  │ Operations       │  │ Underwriting   │  │
│  │             │  │                  │  │                │  │
│  │ • Macro     │  │ • Timeline       │  │ • Revenue      │  │
│  │   inflation │  │ • Funding        │  │ • Costs        │  │
│  │ • Cost of   │  │ • Revenue model  │  │ • Financing    │  │
│  │   equity    │  │ • People & comp  │  │ • Refi terms   │  │
│  │ • Days/mo   │  │ • Overhead       │  │ • Depreciation │  │
│  │ • FY start  │  │ • Variable costs │  │ • Tax          │  │
│  │             │  │ • Tax            │  │ • Disposition   │  │
│  └──────┬──────┘  └────────┬─────────┘  └───────┬────────┘  │
└─────────┼──────────────────┼─────────────────────┼───────────┘
          │                  │                     │
          ▼                  ▼                     ▼
   ┌──────────────┐  ┌──────────────┐     ┌──────────────┐
   │  Research &  │  │  /company    │     │  NEW PROPERTY │
   │  Benchmarks  │  │  Pro-forma   │     │  CREATION     │
   │              │  │  (direct -   │     │              │
   │  AI prompts  │  │  singleton)  │     │  All fields  │
   │  use macro   │  │              │     │  pre-filled  │
   │  context     │  │  Read-only   │     │  from these  │
   │              │  │  for users   │     │  defaults    │
   └──────────────┘  └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  /property/  │
                                          │  :id/edit    │
                                          │              │
                                          │  User sees   │
                                          │  pre-filled  │
                                          │  values.     │
                                          │  Edits and   │
                                          │  saves.      │
                                          │              │
                                          │  Property    │
                                          │  OWNS its    │
                                          │  values.     │
                                          └──────────────┘
```

### What Happens When...

| Event | Effect |
|-------|--------|
| Admin changes a Property Underwriting default | Only affects next property created. Existing properties unchanged. |
| Admin changes a Company Operations value | Immediately affects company pro-forma (singleton — direct edit). |
| Admin changes a Market & Macro value | Immediately affects research context, DCF calculations, and any calculation reading this global value. |
| User edits a property field | That property's value is updated. No other properties affected. Default unchanged. |
| User creates a new property | All fields pre-filled from current Property Underwriting defaults. |
| Admin changes depreciation years default | Next property created gets new value. Existing properties keep their value. |

---

## 14. Access Control Matrix

### Route Access

| Route | Public | Authenticated | Management | Admin | Checker |
|-------|--------|--------------|------------|-------|---------|
| /login | Yes | — | — | — | — |
| /privacy, /terms | Yes | — | — | — | — |
| / (Dashboard) | — | Yes | Yes | Yes | Yes |
| /portfolio | — | Yes | Yes | Yes | Yes |
| /property/:id | — | Yes | Yes | Yes | Yes |
| /property/:id/edit | — | — | Yes | Yes | — |
| /property/:id/photos | — | Yes | Yes | Yes | Yes |
| /property/:id/research | — | Yes | Yes | Yes | Yes |
| /company | — | — | Yes | Yes | — |
| /company/icp-definition | — | — | Yes | Yes | — |
| /company/research | — | — | Yes | Yes | — |
| /analysis | — | — | Yes | Yes | — |
| /scenarios | — | — | Yes | Yes | — |
| /property-finder | — | — | Yes | Yes | — |
| /map | — | — | Yes | Yes | — |
| /voice | — | Yes | Yes | Yes | Yes |
| /profile | — | Yes | Yes | Yes | Yes |
| /help | — | Yes | Yes | Yes | Yes |
| /help (Checker tab) | — | — | — | Yes | Yes |
| /admin (all sections) | — | — | — | Yes | — |

### Feature Access

| Feature | Investor | Partner | Admin | Checker |
|---------|----------|---------|-------|---------|
| View financial statements | Yes | Yes | Yes | Yes |
| Edit property assumptions | — | Yes | Yes | — |
| Create/delete properties | — | Yes | Yes | — |
| View company pro-forma | — | Yes | Yes | — |
| Edit company inputs | — | — | Yes (via Model Defaults) | — |
| Run analysis/simulation | — | Yes | Yes | — |
| Save/load scenarios | — | Yes | Yes | — |
| Use Property Finder | — | Yes | Yes | — |
| Use AI assistants | Yes | Yes | Yes | Yes |
| Edit Model Defaults | — | — | Yes | — |
| Manage users/groups | — | — | Yes | — |
| Run verification | — | — | Yes | Yes |
| View reconciliation tab | — | — | Yes | Yes |

---

## 15. Implementation Phases

### Phase 1: Schema & Database (Foundation)
**Effort:** Small | **Risk:** Low

- Add `depreciationYears` (real, default 27.5) and `daysPerMonth` (real, default 30.5) columns to `globalAssumptions`
- Add any missing default columns that are currently only in `constants.ts`
- Write migration to seed new columns from current constant values
- Ensure all new columns have `NOT NULL` with sensible defaults
- Update `shared/schema.ts` with new fields
- Run migration, verify data

### Phase 2: Admin Model Defaults UI
**Effort:** Medium | **Risk:** Medium

- Create `ModelDefaultsTab.tsx` component with 3 sub-tabs
- Create `MarketMacroTab.tsx`, `CompanyOperationsTab.tsx`, `PropertyUnderwritingTab.tsx`
- Each sub-tab has grouped sections per the specification above
- Wire to existing `globalAssumptions` API endpoints (PATCH /api/global-assumptions)
- Add tab-level banner text
- Add save confirmation toast with existing property count
- Add "Model Defaults" to AdminSidebar as first item in Business group
- Test: all fields save and load correctly

### Phase 3: Governed Field Component
**Effort:** Small | **Risk:** Low

- Create `GovernedField.tsx` component
  - Props: `label`, `authority` (name), `authorityDetail` (citation text), `warningText`, `children` (the input)
  - Renders: shield icon, authority badge, collapsible helper panel
- Apply to depreciation years (in both admin and Property Edit)
- Apply to days per month (admin only — no user-facing override)
- Add governed fields reference section to Help page

### Phase 4: Property Creation Pre-fill
**Effort:** Small | **Risk:** Medium (must not break existing properties)

**NOTE (from audit):** The server route `POST /api/properties` already calls `buildPropertyDefaultsFromGlobal()` to fill cost rates, financing terms, exit rates, and management fees from `globalAssumptions`. This phase extends that existing pattern — it does NOT build from scratch.

**What already works:**
- Server-side merge of globalAssumptions → property for cost rates, financing, exit, fees
- Schema `.default()` calls as fallback layer

**What needs to change:**
- Move client-side constant defaults (DEFAULT_START_ADR, DEFAULT_ADR_GROWTH_RATE, DEFAULT_START_OCCUPANCY, DEFAULT_MAX_OCCUPANCY, DEFAULT_OCCUPANCY_RAMP_MONTHS, DEFAULT_OCCUPANCY_GROWTH_STEP, DEFAULT_CATERING_BOOST_PCT) to `globalAssumptions` as new columns
- Add `depreciationYears` to the property creation merge
- Update `buildPropertyDefaultsFromGlobal()` to include the new columns
- Update `AddPropertyDialog` to read initial form values from the API (globalAssumptions) instead of client-side constants
- Ensure existing properties are untouched
- Test: create new property, verify all fields match defaults
- Test: existing properties unchanged

### Phase 5: Company Page Read-Only Panel
**Effort:** Small | **Risk:** Low

- Create `ModelInputsPanel.tsx` — read-only expandable accordion
- Reads from `globalAssumptions`, displays grouped summary
- If user is admin: shows "Edit in Admin > Model Defaults" link
- Add to Company page below tab bar

### Phase 6: Eliminate Settings Page
**Effort:** Small | **Risk:** Low (just moving things)

- Remove `/settings` route from App.tsx
- Remove "General Settings" from sidebar navigation
- Add redirect: `/settings` → `/company` (non-admin) or `/admin?section=model-defaults` (admin)
- Move display toggles (show calculation details × 2) to Navigation & Display tab
- Move research auto-refresh to Research Center tab
- Move guided tour toggle to Navigation & Display tab
- Rename NavigationTab to NavigationDisplayTab

### Phase 7: Company Assumptions Consolidation
**Effort:** Medium | **Risk:** Medium

- Move company identity fields (name, logo, contact, address, EIN) to Model Defaults > Company Operations > Identity section
- Move exit assumptions and expense rates to Property Underwriting defaults
- Redirect `/company/assumptions` → `/company` for non-admins, → `/admin?section=model-defaults` for admins
- Remove CompanyAssumptions page components (or repurpose read-only parts for the Model Inputs panel)
- Test: admin can edit all company values from Model Defaults
- Test: non-admin sees read-only summary on /company

### Phase 8: Code Constants Migration
**Effort:** Large | **Risk:** High (touches financial engine + 30+ test files)

**NOTE (from audit):** `DEPRECIATION_YEARS` is used in 42 files, `DAYS_PER_MONTH` in 48 files. The key calculation point is `resolve-assumptions.ts` line 158: `buildingValue / DEPRECIATION_YEARS / 12`. Over 30 test files import these constants directly for golden value assertions.

- Refactor `shared/constants.ts` to `SEED_DEFAULTS` object (used only by migrations/seeds)
- Update `resolve-assumptions.ts`: read `depreciationYears` from property input, not constant
- Update property engine: pass `depreciationYears` through the property context
- Update all engine code: read `daysPerMonth` from globalAssumptions, not constant
- Replace all remaining `DEFAULT_*` constant usages with database reads
- **Update 30+ test files:** Tests should continue using the constant value (27.5, 30.5) as the expected golden value, but test fixtures must populate the new entity fields
- **Critical:** Run full test suite after EACH constant migration (not all at once)
- Run `npm run test:summary` — all tests must pass
- Run `npm run verify:summary` — must show UNQUALIFIED
- **Recommendation:** Migrate one constant at a time. Start with `DEPRECIATION_YEARS` (simpler — property-scoped). Then `DAYS_PER_MONTH` (complex — used everywhere). Then remaining `DEFAULT_*` constants.

### Phase 9: Expose Hidden Property Fields
**Effort:** Small | **Risk:** Low

- Add to Property Edit form:
  - Property inflation rate (was in schema, not in UI)
  - AR days, AP days (working capital)
  - Cost segregation settings (toggle + percentages)
  - Day count convention, escalation method
- These fields already exist in the schema — just need UI inputs
- Pre-fill from Property Underwriting defaults

### Phase 10: Testing & Documentation
**Effort:** Medium | **Risk:** Low

- Update proof tests for new field locations
- Update engine tests for database-driven constants
- Add test: property creation pre-fills from defaults correctly
- Add test: changing default doesn't affect existing properties
- Add test: governed fields render with authority citation
- Update Help page with governed fields reference
- Update `.claude/rules/` if architectural rules changed
- Run `npm run verify:summary` — must show UNQUALIFIED
- Run `npm run test:summary` — all tests must pass

### Phase Summary

| Phase | Work | Effort | Risk | Depends On |
|-------|------|--------|------|------------|
| 1 | Schema & Database | Small | Low | — |
| 2 | Admin Model Defaults UI | Medium | Medium | Phase 1 |
| 3 | Governed Field Component | Small | Low | — |
| 4 | Property Creation Pre-fill (extend existing) | Small | Medium | Phase 1 |
| 5 | Company Page Read-Only Panel | Small | Low | — |
| 6 | Eliminate Settings Page | Small | Low | Phase 2 |
| 7 | Company Assumptions Consolidation | Medium | Medium | Phase 2, 5 |
| 8 | Code Constants Migration | **Large** | **High** | Phase 1, 4 |
| 9 | Expose Hidden Property Fields | Small | Low | Phase 4 |
| 10 | Testing & Documentation | Medium | Low | All phases |

**Parallelizable:** Phases 3, 4, 5 can run in parallel after Phase 1. Phase 6 can overlap with Phase 7.

**Phase 8 note:** This is the highest-risk phase. DEPRECIATION_YEARS is referenced in 42 files, DAYS_PER_MONTH in 48 files, and 30+ test files import these constants. Migrate one constant at a time, running the full test suite after each. Budget significant effort here.

---

## Appendix A: Configuration Switches (NOT Defaults)

These are platform behavior toggles. They are NOT financial defaults and do NOT belong in Model Defaults. They remain in their current admin tabs.

| Switch | Current Location | Stays In |
|--------|-----------------|----------|
| Sidebar visibility toggles (×10) | Admin > Navigation | Admin > Navigation & Display |
| Show company calculation details | Settings > Other (MOVING) | Admin > Navigation & Display |
| Show property calculation details | Settings > Other (MOVING) | Admin > Navigation & Display |
| Show guided tour prompt | Settings > Other (MOVING) | Admin > Navigation & Display |
| Research auto-refresh | Settings > Other (MOVING) | Admin > Research Center |
| Preferred LLM | Admin > Research Center | Admin > Research Center |
| Marcela enabled/disabled | Admin > AI Agents | Admin > AI Agents |
| Rebecca enabled/disabled | Admin > AI Agents | Admin > AI Agents |
| All Marcela voice/LLM settings | Admin > AI Agents | Admin > AI Agents |
| Rebecca system prompt | Admin > AI Agents | Admin > AI Agents |

---

## Appendix B: Complete Navigation Inventory

### Routes (Post-Redesign): 35 Active + Redirects

**Active routes:**
1. `/login`
2. `/privacy`
3. `/terms`
4. `/` (Dashboard)
5. `/portfolio`
6. `/property/:id`
7. `/property/:id/edit`
8. `/property/:id/photos`
9. `/property/:id/research`
10. `/property/:id/criteria`
11. `/company`
12. `/company/icp-definition`
13. `/company/research`
14. `/analysis`
15. `/scenarios`
16. `/property-finder`
17. `/map`
18. `/voice`
19. `/profile`
20. `/help`
21. `/admin`

**Redirect routes:**
- `/settings` → `/company` (non-admin) or `/admin?section=model-defaults` (admin)
- `/company/assumptions` → `/company` (non-admin) or `/admin?section=model-defaults` (admin)
- `/sensitivity` → `/analysis`
- `/financing` → `/analysis`
- `/compare` → `/analysis`
- `/timeline` → `/analysis`
- `/research` → `/`
- `/global/research` → `/company/research`
- `/company/criteria` → `/company/icp-definition`
- `/methodology` → `/help`
- `/executive-summary` → `/`
- `/checker-manual` → `/help`
- `/icp` → `/admin` (ICP section)

---

## Appendix C: Design Token Quick Reference

| Token | Value | Use |
|-------|-------|-----|
| Font display | IBM Plex Sans 600 | Headings, titles |
| Font body | Inter 400 | Body text, labels |
| Font mono | JetBrains Mono 400/600 | Numbers, metrics |
| Primary | `hsl(var(--primary))` sage green | Actions, accents |
| Background | `hsl(var(--background))` cream | Page background |
| Card | Glass gradient `#2d4a5e → #3d5a6a → #3a5a5e` | Dark cards |
| Card light | `bg-white/80 backdrop-blur-xl` | Light cards |
| Border | `border-white/10` (dark) `border-primary/20` (light) | Subtle edges |
| Radius | `rounded-xl` (buttons) `rounded-2xl` (cards) `rounded-3xl` (headers) | Corners |
| Transition | `duration-300` default, `duration-500` hover effects | Motion |
| Shadow hover | `0_16px_48px_rgba(R,G,B,0.2)` | Card lift |
| Shield color | `text-amber-600` (light) `text-amber-400` (dark) | Governed fields |

---

---

# PART II: Engineering Reference

Everything below is the technical specification for how to build, organize, and verify the implementation. It covers the full stack: directory structure, coding patterns, database management, SDK/library usage, tool system, scripts, and testing infrastructure.

---

## 16. Directory Structure & Module Organization

### Root Layout

```
/home/runner/workspace/
├── client/                     # React 18 + TypeScript frontend
│   └── src/
│       ├── components/         # UI components (organized by domain)
│       │   ├── ui/             # Base components (shadcn/ui + custom)
│       │   ├── graphics/       # Visualization & animation components
│       │   ├── admin/          # Admin panel tab components
│       │   ├── dashboard/      # Dashboard tab components
│       │   ├── company/        # Company page components
│       │   ├── company-assumptions/  # Company assumption sections
│       │   ├── property-detail/     # Property detail tabs
│       │   ├── property-edit/       # Property edit form sections
│       │   ├── portfolio/      # Portfolio cards and dialogs
│       │   ├── property-finder/# Search and favorites
│       │   ├── financing/      # Financing analysis tabs
│       │   ├── sensitivity/    # Sensitivity analysis components
│       │   ├── research/       # Research UI components
│       │   ├── scenarios/      # Scenario dialogs
│       │   ├── settings/       # Settings tabs (TO BE REMOVED)
│       │   ├── statements/     # Shared financial statement components
│       │   └── documents/      # Document AI components
│       ├── features/           # Self-contained feature modules
│       │   ├── design-themes/  # Theme system (colors, icons, branding)
│       │   ├── property-images/# Photo upload, crop, hero selection
│       │   └── ai-agent/       # Marcela voice assistant
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Shared libraries and utilities
│       │   ├── api/            # TanStack Query hooks + fetch functions
│       │   ├── financial/      # Financial engines (property + company)
│       │   ├── charts/         # Reusable Recharts components (12)
│       │   └── exports/        # Export generators (PDF, Excel, PPTX, CSV, PNG)
│       └── pages/              # Route-level page components
│
├── server/                     # Express 5 + TypeScript backend
│   ├── routes/                 # API route handlers (domain-organized)
│   │   └── admin/              # Admin-only sub-routes
│   ├── storage/                # IStorage interface + 11 sub-storage classes
│   ├── ai/                     # AI service integrations
│   │   └── kb/                 # Knowledge base markdown files (18)
│   ├── integrations/           # External service wrappers (8)
│   ├── replit_integrations/    # Replit platform connectors
│   ├── migrations/             # Schema migration scripts (18)
│   ├── seeds/                  # Seed data modules
│   ├── services/               # Business services (MI, FRED, benchmarks)
│   ├── calculation-checker/    # Independent verification engine
│   ├── notifications/          # Alert rules engine
│   └── middleware/             # Express middleware (rate limiting)
│
├── shared/                     # Shared between client + server
│   ├── schema.ts               # Re-export barrel
│   ├── schema/                 # Drizzle table definitions
│   │   ├── config.ts           # globalAssumptions table
│   │   ├── properties.ts       # properties table
│   │   ├── users.ts            # users, sessions tables
│   │   └── ...                 # Other domain tables
│   └── constants.ts            # Named constants + defaults
│
├── calc/                       # Pure deterministic calculation tools (36)
│   ├── dispatch.ts             # Tool registry + router
│   ├── shared/                 # Shared utilities, schemas, types
│   │   ├── utils.ts            # Rounding, tolerance, helpers
│   │   ├── schemas.ts          # Zod validation for all tools
│   │   ├── types.ts            # Shared interfaces
│   │   └── pmt.ts              # PMT loan payment function
│   ├── research/               # 10 research tools
│   ├── returns/                # 6 return calculation tools
│   ├── validation/             # 5 validation tools
│   ├── analysis/               # 8 analysis tools
│   ├── financing/              # 5 financing tools
│   └── services/               # 2 service tools
│
├── domain/                     # Accounting domain layer
│   ├── accounting-policy.ts    # GAAP rules, depreciation methods
│   ├── chart-of-accounts.ts    # Account hierarchy
│   └── types/                  # Domain type definitions
│
├── engine/                     # Double-entry posting engine
├── statements/                 # Statement extraction & reconciliation
├── analytics/                  # FCF, IRR, metrics, sensitivity
│
├── tests/                      # Vitest test suite (3,022 tests)
│   ├── proof/                  # Invariant enforcement tests
│   ├── engine/                 # Financial calculation tests
│   ├── calc/                   # Deterministic tool tests
│   └── integration/            # API route tests
│
├── script/                     # Build, health, audit scripts
│   ├── build.ts                # esbuild + Vite build
│   ├── health.ts               # Health check (doc harmony, metrics)
│   └── ...
│
├── migrations/                 # Drizzle migration output
│
└── .claude/                    # Architectural documentation
    ├── claude.md               # Master doc (always loaded)
    ├── rules/                  # Binding rules (*.md)
    ├── skills/                 # Reference docs (load on demand)
    ├── tools/                  # JSON schemas for calc tools
    │   ├── research/           # 10 tool schemas
    │   ├── returns/            # 6 tool schemas
    │   ├── validation/         # 5 tool schemas
    │   ├── analysis/           # 8 tool schemas
    │   ├── financing/          # 5 tool schemas
    │   └── services/           # 2 tool schemas
    └── plans/                  # Implementation plans
```

### Module Boundary Rules

1. **`calc/` never imports from `server/` or `client/`** — Pure functions only
2. **`server/routes/` never imports `db` directly** — All access via `IStorage` facade
3. **`client/` never imports from `server/`** — Communication via HTTP API only
4. **`shared/` is imported by both `client/` and `server/`** — Schema, types, constants
5. **Feature modules (`client/src/features/`) are self-contained** — Own components, hooks, `index.ts` barrel

### Barrel File Convention

Every directory that exports multiple items has an `index.ts` barrel:

```typescript
// client/src/components/graphics/index.ts
export { KPIGrid } from "./KPIGrid";
export { DonutChart } from "./DonutChart";
export { AnimatedPage } from "./AnimatedPage";
export { ScrollReveal } from "./ScrollReveal";
export { formatCompact, formatPercent } from "./formatters";
export { CHART_COLORS } from "./constants";
```

### Import Path Aliases

```typescript
// tsconfig.json paths
"@/*"           → "client/src/*"
"@shared/*"     → "shared/*"
"@calc/*"       → "calc/*"
"@domain/*"     → "domain/*"
"@engine/*"     → "engine/*"
"@statements/*" → "statements/*"
"@analytics/*"  → "analytics/*"
```

---

## 17. Coding Conventions & Patterns

### TypeScript Standards

- **Strict mode** enabled (`strict: true` in tsconfig)
- **ESM modules** (`"type": "module"` in package.json)
- **No `any`** — use `unknown` and narrow with type guards
- **No `enum`** — use `as const` objects or union types
- **Named exports** — no default exports (barrel files re-export)
- **Interface over type** for object shapes (unless union is needed)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `ModelDefaultsTab.tsx` |
| Files (utilities) | camelCase | `loanCalculations.ts` |
| Files (calc tools) | kebab-case | `compute-property-metrics.ts` |
| Components | PascalCase | `GovernedField` |
| Hooks | camelCase with `use` prefix | `usePortfolioFinancials` |
| Constants | UPPER_SNAKE_CASE | `DEPRECIATION_YEARS` |
| Functions | camelCase | `generatePropertyProForma` |
| Types/Interfaces | PascalCase | `PropertyInput` |
| CSS classes | kebab-case (Tailwind) | `bg-primary/20` |
| Database columns | snake_case | `depreciation_years` |
| API routes | kebab-case | `/api/global-assumptions` |
| Test files | same name + `.test.ts` | `break-even.test.ts` |
| Tool names | snake_case | `compute_property_metrics` |

### Component Pattern

```typescript
// Standard component structure
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { Property } from "@shared/schema";

interface Props {
  property: Property;
  onSave: (data: Partial<Property>) => void;
}

export function PropertyCard({ property, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
      {/* ... */}
    </Card>
  );
}
```

### API Route Pattern

```typescript
// Standard route handler structure
import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { storage } from "../storage";
import { insertPropertySchema } from "@shared/schema";

const router = Router();

router.get("/api/properties", requireAuth, async (req, res) => {
  try {
    const properties = await storage.getProperties();
    res.json(properties);
  } catch (err) {
    console.error("[ERROR] [properties] Failed to fetch", err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

router.post("/api/properties", requireAuth, async (req, res) => {
  try {
    const parsed = insertPropertySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const property = await storage.createProperty({
      ...parsed.data,
      userId: null,  // Always shared
    });
    res.status(201).json(property);
  } catch (err) {
    console.error("[ERROR] [properties] Failed to create", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

export function register(app: Express) {
  app.use(router);
}
```

### Mutation + Invalidation Pattern

```typescript
// Client-side mutation with financial query invalidation
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAllFinancialQueries } from "@/lib/api";

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; updates: Partial<Property> }) =>
      apiRequest("PATCH", `/api/properties/${data.id}`, data.updates),
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
      toast({ title: "Property saved" });
    },
    onError: (err) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}
```

### Logging Format

```typescript
// Server-side structured logging
console.info("[INFO] [express] GET /api/properties 200 in 12ms");
console.error("[ERROR] [research] Claude API timeout", { propertyId, elapsed });
console.warn("[WARN] [auth] Rate limit approaching for user", userId);
```

---

## 18. Database Architecture & Operations

### Schema Definition (Drizzle ORM)

**Location:** `shared/schema/` — Tables defined using Drizzle's `pgTable()`:

```typescript
// shared/schema/config.ts
import { pgTable, serial, text, real, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const globalAssumptions = pgTable("global_assumptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),

  // Company identity
  companyName: text("company_name").default("Hospitality Business"),

  // Financial parameters
  inflationRate: real("inflation_rate").default(0.03),
  projectionYears: integer("projection_years").default(10),

  // NEW columns for this redesign:
  depreciationYears: real("depreciation_years").default(27.5),
  daysPerMonth: real("days_per_month").default(30.5),

  // JSONB fields
  debtAssumptions: jsonb("debt_assumptions"),
  researchConfig: jsonb("research_config"),
  assetDefinition: jsonb("asset_definition"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Data Integrity Rules (Non-Negotiable)

1. **Shared ownership** — All portfolio data uses `userId = NULL`
2. **Singleton query pattern** — `ORDER BY id DESC LIMIT 1` on shared tables
3. **Fill-only sync** — Production seeding never overwrites user values
4. **Zero and `false` are valid** — `isFieldEmpty()` checks for truly empty, not falsy
5. **Foreign keys** — Users before properties (seed order)
6. **No direct `db` import in routes** — All through `IStorage` facade

### Migration System

**Dual approach:** SQL migrations (Drizzle) + TypeScript startup migrations.

**Writing a new migration:**

```typescript
// server/migrations/my-feature-001.ts
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export async function migrate(db: NodePgDatabase) {
  // Idempotent — safe to re-run
  await db.execute(sql`
    ALTER TABLE global_assumptions
    ADD COLUMN IF NOT EXISTS depreciation_years REAL DEFAULT 27.5
  `);

  await db.execute(sql`
    ALTER TABLE global_assumptions
    ADD COLUMN IF NOT EXISTS days_per_month REAL DEFAULT 30.5
  `);

  console.info("[INFO] [migration] my-feature-001 complete");
}
```

**Migration rules:**
- File naming: `<feature>-<sequence>.ts` (e.g., `model-defaults-001.ts`)
- Always idempotent (`IF NOT EXISTS`, `IF NOT NULL` checks)
- Never drop columns in production without a deprecation migration first
- Run order: parallel batch first, then sequential dependents, then FK indexes last
- Registered in `server/index.ts` startup sequence

### Storage Layer Pattern

**Interface:** `IStorage` defines all data access methods.
**Implementation:** `DatabaseStorage` composes 11 sub-storage classes.

```typescript
// Adding a new storage method:

// 1. Add to IStorage interface (server/storage/index.ts)
interface IStorage {
  // ... existing methods ...
  getModelDefaults(): Promise<ModelDefaults>;
  updateModelDefaults(data: Partial<ModelDefaults>): Promise<ModelDefaults>;
}

// 2. Implement in relevant sub-storage (server/storage/financial.ts)
class FinancialStorage {
  async getModelDefaults(): Promise<ModelDefaults> {
    const [row] = await db.select()
      .from(globalAssumptions)
      .where(isNull(globalAssumptions.userId))
      .orderBy(desc(globalAssumptions.id))
      .limit(1);
    return row;
  }
}

// 3. Delegate from DatabaseStorage
class DatabaseStorage implements IStorage {
  private financial = new FinancialStorage();

  getModelDefaults() { return this.financial.getModelDefaults(); }
  updateModelDefaults(data) { return this.financial.updateModelDefaults(data); }
}
```

### Database Connection

```typescript
// server/db.ts — Pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Max connections
  min: 2,               // Min idle connections
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
  maxUses: 7500,        // Recycle connections to prevent memory creep
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error", err.message);
});

export const db = drizzle(pool, { schema });
```

### Sync Helpers (Production Seeding)

```typescript
// server/syncHelpers.ts — Safe field filling

export function isFieldEmpty(value: unknown): boolean {
  // null, undefined, empty string → empty
  // 0, false → NOT empty (valid user values)
  return value === null || value === undefined || value === "";
}

export function fillMissingFields<T>(existing: T, defaults: Partial<T>): Partial<T> {
  const updates: Partial<T> = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (isFieldEmpty(existing[key as keyof T])) {
      updates[key as keyof T] = defaultValue;
    }
  }
  return updates;
}
```

---

## 19. SDKs, Libraries & External Tools

### Frontend Dependencies

| Library | Version | Purpose | Import Pattern |
|---------|---------|---------|---------------|
| **React** | 18 | UI framework | `import { useState } from "react"` |
| **TypeScript** | 5.x | Type safety | Strict mode, ESM |
| **Wouter** | 3.x | Client routing | `import { useRoute, Link } from "wouter"` |
| **TanStack Query** | 5.x | Server state | `import { useQuery, useMutation } from "@tanstack/react-query"` |
| **Zustand** | 4.x | Local state (legacy) | `import { create } from "zustand"` |
| **Tailwind CSS** | 4.x (PostCSS) | Styling | Class-based in JSX |
| **shadcn/ui** | latest | Base components | `import { Button } from "@/components/ui/button"` |
| **Recharts** | 2.x | Financial charts | `import { LineChart, BarChart } from "recharts"` |
| **Framer Motion** | 11.x | Animations | `import { motion, AnimatePresence } from "framer-motion"` |
| **Three.js** | 0.170+ | 3D graphics | `import * as THREE from "three"` (lazy-loaded) |
| **Lucide React** | latest | Icons (default set) | `import { Save, Trash2 } from "lucide-react"` |
| **Phosphor React** | latest | Icons (alt set) | Theme-selectable icon set |
| **date-fns** | 3.x | Date manipulation | `import { format, differenceInMonths } from "date-fns"` |
| **Zod** | 3.x | Schema validation | `import { z } from "zod"` |
| **jsPDF** | 2.x | PDF export | Dynamic import: `const { jsPDF } = await import("jspdf")` |
| **SheetJS (xlsx)** | latest | Excel export | Dynamic import: `const XLSX = await import("xlsx")` |
| **pptxgenjs** | 3.x | PowerPoint export | Dynamic import: `const PptxGenJS = await import("pptxgenjs")` |
| **dom-to-image-more** | 3.x | PNG screenshot | Dynamic import |
| **clsx + tailwind-merge** | latest | Class composition | `import { cn } from "@/lib/utils"` |
| **React Hook Form** | 7.x | Form management | `import { useForm } from "react-hook-form"` |
| **@hookform/resolvers** | latest | Zod form validation | `import { zodResolver } from "@hookform/resolvers/zod"` |

### Backend Dependencies

| Library | Version | Purpose | Import Pattern |
|---------|---------|---------|---------------|
| **Express** | 5.x | HTTP server | `import express from "express"` |
| **Drizzle ORM** | latest | Database ORM | `import { drizzle } from "drizzle-orm/node-postgres"` |
| **pg** | 8.x | PostgreSQL driver | `import { Pool } from "pg"` |
| **Zod** | 3.x | Request validation | Shared with client |
| **bcrypt** | 5.x | Password hashing | `import bcrypt from "bcrypt"` |
| **cookie** | latest | Session cookies | `import cookie from "cookie"` |
| **esbuild** | latest | Server bundling | Build script only |
| **Vite** | 5.x | Dev server + client build | Dev mode HMR |

### AI SDKs

| SDK | Purpose | Env Var | Lazy Init |
|-----|---------|---------|-----------|
| **@anthropic-ai/sdk** | Claude (research, verification, exports) | `ANTHROPIC_API_KEY` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Yes — `getAnthropicClient()` |
| **openai** | GPT (fallback, image gen) | `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes — `getOpenAIClient()` |
| **@google/generative-ai** | Gemini (primary research, Rebecca chatbot) | `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes — `getGeminiClient()` |

**Lazy singleton pattern:**
```typescript
// server/ai/clients.ts
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Anthropic API key not configured");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}
```

### External Service Integrations

| Service | SDK/Method | Purpose | Files |
|---------|-----------|---------|-------|
| **ElevenLabs** | REST API + WebSocket | Voice synthesis, Convai agent | `server/integrations/elevenlabs.ts` |
| **Twilio** | Replit Connector | SMS, voice calls, webhooks | `server/integrations/twilio.ts` |
| **Resend** | REST API | Transactional email | `server/integrations/resend.ts` |
| **Replicate** | Replit Connector | Image generation | `server/integrations/replicate.ts` |
| **Google Maps** | REST API | Geocoding, autocomplete | `server/integrations/geospatial.ts` |
| **Google Document AI** | gRPC | OCR extraction from PDFs | `server/integrations/document-ai.ts` |
| **FRED** | REST API | Federal Reserve economic data | `server/services/FREDService.ts` |
| **Sentry** | `@sentry/node` + `@sentry/react` | Error tracking | `server/sentry.ts`, `client/src/lib/sentry.ts` |
| **Upstash Redis** | `@upstash/redis` | Caching (market intelligence) | `server/cache.ts` |

### Replit Platform Integrations

| Integration | Directory | Purpose |
|-------------|-----------|---------|
| **Object Storage** | `server/replit_integrations/object_storage/` | File upload/download |
| **Chat** | `server/replit_integrations/chat/` | Streaming AI responses |
| **Image** | `server/replit_integrations/image/` | Architecture renders |
| **Audio** | `server/replit_integrations/audio/` | Voice synthesis + STT |

---

## 20. Deterministic Tool System

### Architecture

36 pure-function financial calculators, registered in `calc/dispatch.ts`, validated with Zod schemas, tested with golden values, and verified by the proof suite.

### Tool Registry (`calc/dispatch.ts`)

```typescript
const TOOL_DISPATCH: Record<string, ToolHandler> = {
  // Research (10)
  compute_property_metrics:      withRounding(computePropertyMetrics),
  compute_depreciation_basis:    withRounding(computeDepreciationBasis),
  compute_debt_capacity:         withRounding(computeDebtCapacity),
  compute_occupancy_ramp:        wrap(computeOccupancyRamp),
  compute_adr_projection:        withRounding(computeADRProjection),
  compute_cap_rate_valuation:    withRounding(computeCapRateValuation),
  compute_cost_benchmarks:       withRounding(computeCostBenchmarks),
  compute_service_fee:           withRounding(computeServiceFee),
  compute_markup_waterfall:      withRounding(computeMarkupWaterfall),
  compute_make_vs_buy:           withRounding(computeMakeVsBuy),

  // Returns (6)
  calculate_dcf_npv:             withRounding(computeDCF),
  build_irr_cashflow_vector:     wrap(buildIRRVector),
  compute_equity_multiple:       withRounding(computeEquityMultiple),
  exit_valuation:                withRounding(exitValuation),
  compute_wacc:                  withRounding(computeWACC),
  compute_portfolio_wacc:        withRounding(computePortfolioWACC),

  // Validation (5)
  validate_financial_identities: wrap(validateFinancialIdentities),
  funding_gate_checks:           wrap(fundingGateChecks),
  schedule_reconcile:            wrap(scheduleReconcile),
  assumption_consistency_check:  wrap(assumptionConsistencyCheck),
  export_verification:           wrap(exportVerification),

  // Analysis (8)
  consolidate_statements:        withRounding(consolidateStatements),
  scenario_compare:              wrap(scenarioCompare),
  break_even_analysis:           withRounding(computeBreakEven),
  compute_waterfall:             withRounding(computeWaterfall),
  hold_vs_sell:                  withRounding(holdVsSell),
  stress_test:                   wrap(stressTest),
  capex_reserve:                 withRounding(capexReserve),
  revpar_index:                  withRounding(revparIndex),

  // Financing (5)
  calculate_debt_yield:          withRounding(calculateDebtYield),
  calculate_dscr:                withRounding(calculateDSCR),
  calculate_prepayment:          withRounding(calculatePrepayment),
  calculate_sensitivity:         wrap(calculateSensitivity),
  compare_loans:                 withRounding(compareLoans),

  // Services (2)
  centralized_service_margin:    withRounding(centralizedServiceMargin),
  cost_of_services_aggregator:   withRounding(costOfServicesAggregator),
};
```

### Adding a New Tool (Checklist)

1. **Implement** in `calc/<category>/<tool-name>.ts` — pure function, no I/O
2. **Add Zod schema** in `calc/shared/schemas.ts`
3. **Register** in `calc/dispatch.ts` with `withRounding()` or `wrap()`
4. **Create JSON schema** in `.claude/tools/<category>/<tool-name>.json`
5. **Write tests** in `tests/calc/<category>/<tool-name>.test.ts`
6. **Update counts** in `.claude/rules/deterministic-tools.md`
7. **Run verification:** `npm run test:file -- tests/calc/ && npm run verify:summary`

### Tool Implementation Template

```typescript
// calc/<category>/<tool-name>.ts
import { roundCents } from "../shared/utils.js";

export interface MyToolInput {
  required_field: number;
  optional_field?: number;
}

export interface MyToolOutput {
  result: number;
  breakdown: { component_a: number; component_b: number };
}

export function computeMyTool(input: MyToolInput): MyToolOutput {
  const { required_field, optional_field = 0.05 } = input;

  const component_a = roundCents(required_field * optional_field);
  const component_b = roundCents(required_field * (1 - optional_field));

  return {
    result: roundCents(component_a + component_b),
    breakdown: { component_a, component_b },
  };
}
```

### Rounding Utilities

```typescript
// calc/shared/utils.ts
export const DEFAULT_ROUNDING = { precision: 2, bankers_rounding: false };
export const RATIO_ROUNDING = { precision: 4, bankers_rounding: false };
export const RATE_ROUNDING = { precision: 6, bankers_rounding: false };

export function roundCents(v: number): number {
  return Math.round(v * 100) / 100;
}

export function rounder(policy = DEFAULT_ROUNDING) {
  return (v: number) => roundTo(v, policy);
}

export function withinTolerance(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}
```

---

## 21. Scripts & CLI Commands

### Package.json Scripts

| Command | Purpose | When to Run |
|---------|---------|-------------|
| `npm run dev` | Start dev server (Vite HMR + Express) | Development |
| `npm run build` | Production build (esbuild + Vite) | Before deployment |
| `npm start` | Start production server | Deployment |
| `npm run test:summary` | Run all 3,022 tests | Before any merge |
| `npm run test:file -- <path>` | Run single test file | During development |
| `npm run verify:summary` | Run 7-phase proof suite | After financial changes |
| `npm run health` | Health check (doc harmony, metrics) | After documentation changes |
| `npm run seed` | Reset dev database with seed data | Dev environment reset |
| `npm run lint` | TypeScript type checking | Before commit |

### Build Pipeline (`script/build.ts`)

```
1. Vite build → client/dist/ (React SPA, code-split, tree-shaken)
2. esbuild → dist/index.cjs (Express server, bundled, minified)
   - Platform: node
   - Format: CommonJS (required for pg driver)
   - 30 bundled deps, rest external
   - Minified, sourcemaps off in production
3. Copy static assets
```

### Health Check (`script/health.ts`)

Validates:
- Doc harmony: test counts in `.claude/claude.md` and `replit.md` match actual
- Rule counts: documented rule count matches `ls .claude/rules/*.md | wc -l`
- Stale metrics detection

---

## 22. Testing Infrastructure

### Test Framework

- **Vitest** — ESM-native, TypeScript-first, fast HMR
- **3,022 tests across 135 files**
- **500 golden reference tests** with hand-calculated expected values

### Test Categories

| Category | Directory | Purpose | Count |
|----------|-----------|---------|-------|
| **Proof** | `tests/proof/` | Invariant enforcement | ~50 |
| **Engine** | `tests/engine/` | Financial calculation correctness | ~200 |
| **Calc** | `tests/calc/` | Deterministic tool I/O | ~150 |
| **Integration** | `tests/integration/` | API route behavior | ~50 |
| **Golden** | Spread across above | Hand-calculated reference values | ~500 |

### Proof Test Suite (7 Phases)

```
Phase 1: Golden Scenarios (5 scenarios)
  → Full GAAP identity validation on each

Phase 2: Hardcoded Detection
  → Magic number scanner across all finance files

Phase 3: Golden Values (269+ tests)
  → Hand-calculated precision verification

Phase 4: Reconciliation
  → Bridge checks (Sources & Uses, NOI → FCF, BS balance)

Phase 5: Data Integrity
  → Shared ownership, singleton uniqueness

Phase 6: Portfolio Dynamics
  → Dynamic property count, fee zero-sum

Phase 7: Artifact Summary
  → Final audit opinion: UNQUALIFIED | QUALIFIED | ADVERSE
```

### Test Patterns

**Golden test:**
```typescript
const GOLDEN = {
  year1Revenue: 1_825_000,
  year1NOI: 730_000,
  exitValue: 12_166_667,
};

it("matches golden revenue", () => {
  expect(result.year1Revenue).toBeCloseTo(GOLDEN.year1Revenue, 0);
});
```

**Factory pattern:**
```typescript
function makeInput(overrides: Partial<ToolInput> = {}): ToolInput {
  return {
    room_count: 20,
    adr: 300,
    occupancy: 0.70,
    ...overrides,
  };
}
```

**Invariant test:**
```typescript
it("GOP = Revenue - Department Expenses", () => {
  const gop = result.revenueTotal - result.expenseTotal;
  expect(result.gop).toBeCloseTo(gop, 2);
});
```

### Adding Tests for This Redesign

New tests needed:

```
tests/proof/model-defaults.test.ts
  - Verify: depreciationYears column exists in globalAssumptions
  - Verify: daysPerMonth column exists in globalAssumptions
  - Verify: property creation reads defaults from globalAssumptions
  - Verify: changing default doesn't affect existing properties
  - Verify: all DEFAULT_* constants have matching DB columns

tests/engine/governed-fields.test.ts
  - Verify: property engine reads depreciationYears from property entity
  - Verify: company engine reads daysPerMonth from globalAssumptions
  - Verify: engine produces same results with DB values as with old constants

tests/proof/settings-elimination.test.ts
  - Verify: /settings route redirects correctly
  - Verify: no component imports from settings/ directory
  - Verify: all settings fields accessible via admin routes
```

---

## 23. Financial Engine Interface

### Property Engine (`client/src/lib/financial/property-engine.ts`)

```typescript
export function generatePropertyProForma(
  property: PropertyInput,
  global: GlobalInput,
  months?: number
): MonthlyFinancials[]
```

**8-step monthly pipeline:**
1. Temporal gates (pre-acquisition silence, pre-ops gap)
2. Occupancy ramp (step function → stabilization)
3. Revenue calculation (rooms, events, F&B + catering, other)
4. Departmental expenses (11 USALI cost rates)
5. Undistributed expenses (management fees, FF&E reserve)
6. Debt service (PMT amortization, refinance path)
7. Income statement (NOI → interest → depreciation → tax → net income)
8. Cash flow & balance sheet (indirect OCF, investing CF, financing CF, ending cash)

**Critical constants that become database-driven:**
```typescript
// BEFORE (hardcoded)
const annualDepreciation = depreciableBasis / DEPRECIATION_YEARS;

// AFTER (from property entity — set from defaults at creation)
const annualDepreciation = depreciableBasis / property.depreciationYears;
```

### Company Engine (`client/src/lib/financial/company-engine.ts`)

```typescript
export function generateCompanyProForma(
  properties: PropertyInput[],
  global: GlobalInput,
  months?: number,
  serviceTemplates?: ServiceTemplate[]
): CompanyMonthlyFinancials[]
```

**Reads from global (direct — singleton):**
- Management fee rates, staffing tiers, partner comp, overhead, variable costs, tax rate
- Funding structure (SAFE tranches, interest)
- **NEW: daysPerMonth** (from globalAssumptions instead of constant)

### Portfolio Aggregation Hook

```typescript
// client/src/components/dashboard/usePortfolioFinancials.ts
export function usePortfolioFinancials(
  properties: Property[] | undefined,
  global: GlobalResponse | undefined
): DashboardFinancials | null
```

Per-property memoization via `useRef<Map>` keyed on `updatedAt` timestamp. Consolidated data recomputed from all property results.

---

## 24. API Endpoints Affected by This Redesign

### Existing Endpoints (Modified)

| Endpoint | Change |
|----------|--------|
| `GET /api/global-assumptions` | Returns new `depreciationYears`, `daysPerMonth` columns |
| `PATCH /api/global-assumptions` | Accepts new columns in request body |
| `POST /api/properties` | Pre-fills from globalAssumptions defaults |

### New Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/admin/model-defaults` | Admin | Fetch all defaults (structured by tab) |
| `PATCH /api/admin/model-defaults` | Admin | Update defaults (partial update) |

**Note:** These may be simple wrappers around the existing `global-assumptions` endpoint with admin-only auth and structured response shaping. The data lives in the same `globalAssumptions` table.

### Endpoints for Read-Only Company Summary

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/company/model-inputs` | Management | Read-only summary of company inputs for the Model Inputs panel |

---

## 25. Environment Variables Reference

### Required for Core App

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Admin user password (seeded on startup) |
| `CHECKER_PASSWORD` | Checker user password |
| `REYNALDO_PASSWORD` | Additional team member password |
| `SESSION_SECRET` | Cookie session encryption key |

### Required for AI Features

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Claude API |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API |

### Required for Integrations

| Variable | Purpose |
|----------|---------|
| `ELEVENLABS_API_KEY` | ElevenLabs voice |
| `ELEVENLABS_AGENT_ID` | Marcela agent ID |
| `RESEND_API_KEY` | Transactional email |
| `GOOGLE_MAPS_API_KEY` | Geocoding |
| `SENTRY_DSN` | Error tracking |
| `UPSTASH_REDIS_REST_URL` | Redis cache |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |

---

## 26. Verification Checklist for This Redesign

After completing all implementation phases, the following must pass:

```bash
# 1. All tests pass
npm run test:summary
# Expected: 3,022+ tests, 0 failures

# 2. Proof suite shows UNQUALIFIED
npm run verify:summary
# Expected: UNQUALIFIED opinion

# 3. Health check passes
npm run health
# Expected: Doc Harmony PASS

# 4. Specific test files for this redesign
npm run test:file -- tests/proof/model-defaults.test.ts
npm run test:file -- tests/engine/governed-fields.test.ts
npm run test:file -- tests/engine/operating-reserve-cash.test.ts

# 5. No hardcoded constants remain in engine
# (Proof Phase 2 — hardcoded detection — covers this)

# 6. Build succeeds
npm run build
# Expected: Clean build, no TypeScript errors
```

---

---

## 27. Replit Development Environment

This project is built and deployed entirely within Replit. All implementation will happen inside the Replit workspace. This section ensures anyone working on the project understands the platform constraints, workflows, and best practices.

### 27.1 Workspace Configuration (`.replit`)

The `.replit` file is the project's platform configuration. It controls everything Replit does with the project:

```toml
modules = ["nodejs-20", "web", "javascript", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-24_05"

[[ports]]
localPort = 5000
externalPort = 80

[env]
PORT = "5000"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["node", "./dist/index.cjs"]
```

**Key points:**
- **Single port:** Express serves both API and client SPA on port 5000 (mapped to external port 80)
- **Autoscale deployment:** Scales to zero when idle, scales up under traffic. Cold starts possible.
- **Node.js 20 + PostgreSQL 16:** Provided via Nix modules — no manual install needed
- **Hidden directories:** `node_modules`, `dist`, `.git`, `.config` are hidden from the filetree to improve IDE performance

### 27.2 Development Workflow in Replit

**Starting the dev server:**
- Click the "Run" button or use the "Project" workflow — runs `npm run dev`
- Vite HMR serves the React frontend with hot reload
- Express backend restarts on server file changes
- Preview pane shows the app at the mapped external URL

**Using the Shell (Terminal):**
- All `npm run` commands are available in the Shell tab
- Key commands for this project:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run dev` | Start dev server | Development |
| `npm run test:summary` | Run all 3,035 tests | Before committing |
| `npm run verify:summary` | 7-phase GAAP proof | After financial changes |
| `npm run health` | Full health check | After any changes |
| `npm run build` | Production build | Before deployment |

**Named Workflows (accessible from Replit UI):**
The `.replit` file defines 9 workflows accessible from the Workflows panel:
- **Project** — Start application
- **Health Check** — `npm run health`
- **Run Tests** — `npm run test:summary`
- **Verify Financials** — `npm run verify:summary`
- **Lint Check** — `npm run lint:summary`
- **Diff Summary** — `npm run diff:summary`
- **Codebase Stats** — `npm run stats`
- **Quick Audit** — `npm run audit:quick`
- **Exports Check** — `npm run exports:check`

### 27.3 Replit Agent Integration

The project is configured for Replit Agent with 15 integrations:

```toml
[agent]
mockupState = "FULLSTACK"
integrations = [
  "javascript_database:1.0.0",
  "javascript_object_storage:2.0.0",
  "github:1.0.0",
  "javascript_openai_ai_integrations:2.0.0",
  "javascript_anthropic_ai_integrations:2.0.0",
  "javascript_gemini_ai_integrations:2.0.0",
  "google-sheet:1.0.0", "google-mail:1.0.0",
  "stripe:2.0.0",
  "javascript_log_in_with_replit:2.0.0",
  "google-drive:1.0.0", "google-docs:1.0.0", "google-calendar:1.0.0",
  "twilio:1.0.0", "elevenlabs:1.0.0"
]
```

**Working with Replit Agent (best practices for this project):**

1. **Break work into small, focused prompts** — Don't ask Agent to implement an entire phase at once. Ask for one component, one migration, one test file at a time.
2. **Reference the plan explicitly** — Tell Agent: "Read `.claude/plans/UX-REDESIGN-PLAN.md` Section 6 and implement the Market & Macro tab of ModelDefaultsTab."
3. **Use checkpoints** — Agent creates git commits at milestones. Review before accepting.
4. **Verify after each change** — After Agent makes financial changes, run `npm run verify:summary` in Shell before proceeding.
5. **Don't let Agent guess architecture** — This project has strict rules in `.claude/rules/`. Agent should read them first.

**Prompting pattern for this redesign:**

```
Phase 2 example prompt:
"Read .claude/plans/UX-REDESIGN-PLAN.md Section 6 (Model Defaults).
Read .claude/rules/architecture.md and .claude/rules/ui-patterns.md.
Create client/src/components/admin/ModelDefaultsTab.tsx with 3 sub-tabs:
Market & Macro, Company Operations, Property Underwriting.
Follow the existing admin tab pattern from PeopleTab.tsx.
Use GlassButton, PageHeader, and CurrentThemeTab components.
Register in Admin.tsx sidebar under Business group, first item."
```

### 27.4 Secrets & Environment Variables

**All secrets are managed in Replit's Secrets panel (padlock icon in the sidebar).**

| Secret | Purpose | Used By |
|--------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `server/db.ts` |
| `ADMIN_PASSWORD` | Admin user seed | `server/auth.ts` |
| `CHECKER_PASSWORD` | Checker user seed | `server/auth.ts` |
| `REYNALDO_PASSWORD` | Team member seed | `server/auth.ts` |
| `ANTHROPIC_API_KEY` | Claude AI | `server/ai/clients.ts` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI | `server/ai/clients.ts` |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini | `server/ai/clients.ts` |
| `ELEVENLABS_API_KEY` | Voice agent | `server/integrations/elevenlabs.ts` |
| `RESEND_API_KEY` | Email | `server/integrations/resend.ts` |
| `GOOGLE_MAPS_API_KEY` | Geocoding | `server/integrations/geospatial.ts` |
| `SENTRY_DSN` | Error tracking | `server/sentry.ts` |

**Rules:**
- **Never use `.env` files** — Replit Secrets are encrypted (AES-256 at rest), `.env` files are not
- **Never hardcode secrets** in source code
- **Secrets auto-deploy** — Available in both dev and autoscale deployment environments
- Non-secret env vars go in `.replit` `[env]` section (e.g., `PORT = "5000"`)

### 27.5 Database (PostgreSQL on Neon)

**Connection:** Via `DATABASE_URL` secret → `server/db.ts` → Drizzle ORM

**Key Replit + Neon considerations:**
- **Serverless compute:** Neon suspends after 5 minutes of inactivity. The pool configuration in `server/db.ts` handles reconnection.
- **Connection pooling:** Max 20 connections, min 2 idle, 60s idle timeout. Critical for autoscale deployment where instances spin up/down.
- **No direct SQL** in the Shell — use Drizzle or the app's API endpoints for data operations
- **Migrations run on startup** — no separate migration command needed. Server executes all 18 migrations in `server/migrations/` during Phase 2 of startup.
- **Dev vs Prod databases** — separate `DATABASE_URL` values. Never mix them.

**For this redesign (new columns):**
```sql
-- Migration: server/migrations/model-defaults-001.ts
ALTER TABLE global_assumptions ADD COLUMN IF NOT EXISTS depreciation_years REAL DEFAULT 27.5;
ALTER TABLE global_assumptions ADD COLUMN IF NOT EXISTS days_per_month REAL DEFAULT 30.5;
```
This migration runs automatically on next server start. No manual database command needed.

### 27.6 File Storage & Object Storage

**Replit Object Storage** (for user uploads — photos, documents):
- SDK: `@replit/object-storage` (already integrated)
- Location: `server/replit_integrations/object_storage/`
- Files persist across deployments
- Direct GCS URLs require authentication — use the SDK for access

**File system persistence:**
- All files in the workspace persist across restarts
- `node_modules` and `dist` are transient (rebuilt from `package.json` and source)
- `.claude/` documentation persists — it's committed to git

### 27.7 Deployment Process

**To deploy changes:**
1. Verify locally: `npm run health` (tests + verify + doc harmony)
2. Click "Deploy" in Replit UI, or use the Deployments tab
3. Replit runs `npm run build` (esbuild + Vite production build)
4. Replit starts `node ./dist/index.cjs` on the autoscale platform
5. Migrations run automatically on first request (server startup Phase 2)

**Autoscale behavior:**
- Scales to zero when no traffic (saves cost)
- Cold start: ~5-10 seconds for first request after idle
- Single external port (80) — Express serves both API and static SPA
- The app must bind to `0.0.0.0` (not `localhost`) — already configured

### 27.8 Replit-Specific Gotchas for This Project

| Gotcha | Impact | Mitigation |
|--------|--------|------------|
| **HMR WebSocket drops** | Frontend changes may not hot-reload | Full page refresh (F5) |
| **Filetree lag on large projects** | Slow navigation with 790+ files | `node_modules`, `dist`, `.git` already hidden in `.replit` |
| **Storage quota** | `node_modules` counts against 50 GiB | Monitor with `du -sh node_modules/` |
| **5-min Neon sleep** | First DB query after idle may be slow | Pool reconnection handles this |
| **Autoscale cold starts** | First request after idle takes 5-10s | Acceptable for this internal tool |
| **Credit consumption** | Agent interactions + dev sessions draw credits | Break Agent prompts into focused tasks |
| **Post-merge hook timeout** | 60 second limit for `script/post-merge.sh` | Keep post-merge script fast |
| **Single port** | Only port 5000 (→80) available externally | Express already serves everything on one port |

### 27.9 Git Workflow in Replit

- **Version Control pane** — Visual git interface in the sidebar
- **Shell** — Full `git` CLI available
- **Agent checkpoints** — Automatic commits at milestones (reviewable)
- **Post-merge hook** — `script/post-merge.sh` runs after merges (60s timeout)

**Recommended workflow for this redesign:**
1. Create a feature branch: `git checkout -b feature/model-defaults`
2. Implement one phase at a time
3. After each phase, run `npm run health` in Shell
4. Commit with descriptive message
5. When phase is complete, merge to `main`
6. Deploy via Replit Deployments tab

### 27.10 Replit Workflows for This Redesign

Add these new workflows to `.replit` after implementation:

```toml
[[workflows.workflow]]
name = "Test Model Defaults"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run test:file -- tests/proof/model-defaults.test.ts"

[[workflows.workflow]]
name = "Test Governed Fields"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run test:file -- tests/engine/governed-fields.test.ts"
```

---

## 28. Best Practices & Code Governance

This section consolidates all code quality standards, governance rules, review processes, and compliance requirements. These are non-negotiable — enforced by 19 rule files, 3,035 automated tests, and a 7-phase verification pipeline.

### 28.1 Governance Architecture

**19 binding rule files** in `.claude/rules/`:

| Rule | Scope | Enforcement |
|------|-------|-------------|
| `architecture.md` | Tech stack, two-entity model, file org | Manual review |
| `audit-persona.md` | 7 audit dimensions, financial statement standards | `verify:summary` |
| `database-seeding.md` | Seeding mechanisms, shared ownership invariants | `data-integrity.test.ts` |
| `design-standards.md` | Premium UI, animations, edge cases | Manual review |
| `deterministic-tools.md` | 36 pure calc tools, schema parity, tests | `tool-registry.test.ts` |
| `documentation.md` | Doc hierarchy, harmony checks | `npm run health` |
| `domain-boundaries.md` | 6 independent domains, prohibited crossings | `domain-boundaries.test.ts` |
| `error-handling.md` | Structured logging, no empty catches, boundaries | Manual review |
| `exports.md` | 6 export formats, placement, naming | Manual review |
| `financial-engine.md` | Two-engine model, 6 hardened GAAP rules | `verify:summary` |
| `mandatory-financial-tests.md` | 13 critical tests, stop-the-line | `operating-reserve-cash.test.ts` |
| `no-hardcoded-values.md` | Named constants, DB fallback pattern | `hardcoded-detection.test.ts` |
| `portfolio-dynamics.md` | Shared ownership, dynamic count, fee zero-sum | `portfolio-dynamics.test.ts` |
| `recalculate-on-save.md` | `invalidateAllFinancialQueries` mandatory | `recalculation-enforcement.test.ts` |
| `research-precision.md` | Deterministic tools, admin config, validation | `tool-registry.test.ts` |
| `security.md` | Auth/authz, Zod validation, secrets, SQL injection | Manual review |
| `session-startup.md` | Context loading, rule loading per task type | Manual review |
| `testing-strategy.md` | Test categories, golden patterns, fixture factory | Manual review |
| `ui-patterns.md` | Button labels, accordions, entity cards, test IDs | Manual review |

### 28.2 The Three Gates (Must Pass Before Shipping)

```
Gate 1: npm run test:summary     → 3,035 tests, 0 failures
Gate 2: npm run verify:summary   → UNQUALIFIED audit opinion
Gate 3: npm run health           → All checks pass (tsc + tests + verify + doc harmony)
```

**No exceptions.** If any gate fails, fix the issue before proceeding.

### 28.3 Financial Code Change Protocol

Any change touching financial calculations follows this strict workflow:

```
1. STATE the active skill
   → Which .claude/skills/finance/ sub-skill covers this change?

2. CONFIRM authoritative references
   → Which rules and constants apply?

3. IDENTIFY invariants affected
   → What GAAP identities must hold? (A=L+E, OCF reconciliation, etc.)

4. IMPLEMENT the smallest safe change
   → Don't over-generalize. Fix one thing.

5. RUN mandatory tests
   → npm run test:file -- tests/engine/operating-reserve-cash.test.ts
   → npm run test:file -- tests/engine/<relevant-test>.test.ts

6. VERIFY UNQUALIFIED
   → npm run verify:summary

7. UPDATE documentation
   → .claude/session-memory.md
   → .claude/skills/ if behavior changed
   → .claude/claude.md if architecture changed
```

### 28.4 No Hardcoded Values (Enforced by Tests)

Every financial, operational, or admin-configurable value must come from the database with a named-constant fallback:

```typescript
// CORRECT — database value → named constant fallback
const taxRate = globalAssumptions.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE;

// WRONG — hardcoded literal
const taxRate = 0.30;

// WRONG — unnamed magic number as fallback
const taxRate = globalAssumptions.companyTaxRate ?? 0.30;
```

**After this redesign:** Even `DEPRECIATION_YEARS` and `DAYS_PER_MONTH` become database values. The only remaining "safe" literals in calculation code are: `0`, `1`, `-1`, `2`, `12`, `100`.

**Enforcement:** `tests/proof/hardcoded-detection.test.ts` scans 8 finance modules and fails the verify pipeline on unexplained magic numbers.

### 28.5 Domain Boundary Rules

Six independent domains. Cross-domain access is strictly controlled:

```
Financial Engine  ←→  NEVER imports from AI, Photos, Notifications
AI Agents         →   May READ financial context (never WRITE)
Photos/Media      →   May SYNC hero image to properties (documented denormalization)
Research          →   calc/ tools are PURE (no server imports)
Documents         ←→  NEVER imports from AI or Research
Notifications     ←→  NEVER imports from Financial Engine
```

**Enforcement:** `tests/proof/domain-boundaries.test.ts` performs static analysis on all imports.

### 28.6 Mutation Safety (Recalculation)

Every financial mutation must call `invalidateAllFinancialQueries(queryClient)` in its `onSuccess` callback:

```typescript
// CORRECT
onSuccess: () => { invalidateAllFinancialQueries(queryClient); }

// WRONG — hand-picking keys (misses dependent queries)
onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] }); }
```

**Exempt mutations** (no recalculation needed): theme changes, logo uploads, profile updates, property finder favorites, research config saves.

**Enforcement:** `tests/proof/recalculation-enforcement.test.ts` scans every mutation.

### 28.7 Database Integrity Rules

1. **All portfolio data uses `userId = NULL`** — shared across all users
2. **Singleton queries use `ORDER BY id DESC LIMIT 1`** — guarantees newest row
3. **Scenario load restores as shared** — `userId: null`, never the logged-in user's ID
4. **Fill-only sync** — `isFieldEmpty()` + `fillMissingFields()`, never overwrite user data
5. **No direct `db` imports in routes** — all through `IStorage` facade
6. **Zod validation on all request bodies** — never trust client input

**Enforcement:** `tests/proof/data-integrity.test.ts`

### 28.8 Security Baseline

| Requirement | Rule | Enforcement |
|-------------|------|-------------|
| Authentication | All `/api/` routes require `requireAuth` (except login/register) | Manual review |
| Authorization | Admin routes require `requireAdmin` middleware | Manual review |
| Input validation | All request bodies validated with Zod schemas | Manual review |
| Secrets | All API keys from `process.env` (Replit Secrets), never hardcoded | `security.md` rule |
| SQL injection | All DB access through Drizzle ORM (parameterized), no string concatenation | `domain-boundaries.test.ts` |
| Rate limiting | AI endpoints rate-limited, login attempts throttled | `server/middleware/rate-limit.ts` |
| Error exposure | Never expose stack traces or DB connection strings to clients | `error-handling.md` rule |

### 28.9 Testing Standards

**When tests are required:**
- Any change to `calc/` → tests in `tests/calc/`
- Any change to financial engines → run `tests/engine/`
- Any new proof invariant → add to `tests/proof/`
- Any new API mutation route → add integration test

**When tests are NOT required:**
- CSS/styling changes
- Documentation updates
- Admin UI layout changes (unless affecting data flow)
- Theme/branding changes

**Test quality standards:**
- Deterministic — no random data, no timing dependencies
- Financial tests use `toBeCloseTo` for floating-point comparison
- Test names describe the business rule: "NOI equals GOP minus fees and taxes"
- Golden tests use 0% growth/inflation for traceability
- Factory pattern: `makeProperty()` / `makeGlobal()` with override-only pattern

### 28.10 Error Handling Standards

**Server-side:**
```typescript
// Every route has try/catch with structured logging
try {
  const result = await storage.getProperty(id);
  if (!result) return res.status(404).json({ error: "Property not found" });
  res.json(result);
} catch (err) {
  console.error("[ERROR] [properties] Failed to fetch property", err);
  res.status(500).json({ error: "Failed to fetch property" });
}
```

**Client-side:**
- React error boundaries around major page sections
- Styled error cards with retry actions (never raw error strings)
- Financial calculation errors use `FinancialCalculationError` with input fingerprinting
- Side effects (logging, analytics) use `.catch()` to prevent cascading

**Prohibited:**
- `catch (e) {}` — empty catch blocks
- `console.log(err)` without domain tag
- Exposing stack traces in API responses
- Unhandled promise rejections in route handlers

### 28.11 UI/UX Standards

**Premium design requirement** — every page must look like a $50K+ financial platform:
- Animated numbers (NumberTicker, never static)
- Glassmorphism cards with backdrop blur
- Staggered reveals for lists/grids
- Skeleton loading states (never spinner-only)
- Custom chart styling (gradients, custom tooltips, glow effects)
- Smooth page transitions (Framer Motion)

**Component compliance:**
- All buttons → `GlassButton`
- All page headers → `PageHeader`
- All export menus → `ExportMenu` (all 6 formats)
- All tabs → `CurrentThemeTab`
- Button labels: "Save" (never "Update"), "Add [Entity]", "Delete"

**Edge case handling:**
- Empty states → illustrated placeholders with CTAs
- `NaN`/`Infinity` → show "—" with tooltip
- `$0` → display as "$0" (never blank)
- Negative values → red color with parentheses
- `prefers-reduced-motion` → respected

### 28.12 Documentation Governance

**After every codebase change:**
1. Update `.claude/session-memory.md` with what was done
2. Update `.claude/claude.md` if architecture/features/inventory changed
3. Harmonize `replit.md` to match (≤150 lines, references `.claude/`)
4. Update relevant `.claude/skills/` if behavior changed

**After bug fixes (additionally):**
5. Run `npm run test:summary` — all tests pass
6. Run `npm run verify:summary` — UNQUALIFIED
7. Update `mandatory-financial-tests.md` if financial bug fixed
8. Verify doc harmony — counts match actual state

**Automated enforcement:** `npm run health` checks doc harmony (test counts, rule counts match documented values).

### 28.13 Code Review Checklist

Before any commit or merge:

**Functional:**
- [ ] Feature works as specified in the plan
- [ ] No regressions in existing functionality
- [ ] Edge cases handled (empty state, loading, error, NaN, $0, negative)

**Financial integrity:**
- [ ] No hardcoded financial values (use `DEFAULT_*` constants)
- [ ] `safeNum()` guard at division/exponentiation points
- [ ] GAAP identities preserved (A=L+E, OCF reconciliation)
- [ ] Income statement shows interest only, never principal
- [ ] Management fee zero-sum between property and company

**Quality:**
- [ ] TypeScript strict mode — no `any` without justification
- [ ] `data-testid` on all interactive elements
- [ ] Error handling — no empty catches, structured logging
- [ ] Component compliance — uses GlassButton, PageHeader, etc.
- [ ] Theme tokens used — no raw hex colors

**Testing:**
- [ ] `npm run test:summary` passes (3,035+ tests, 0 failures)
- [ ] `npm run verify:summary` shows UNQUALIFIED
- [ ] `npm run health` passes (doc harmony, tsc)
- [ ] New financial logic has golden tests with hand-calculated values
- [ ] Fixture factory used (`makeProperty` / `makeGlobal`)

**Security:**
- [ ] Authentication middleware on new routes
- [ ] Zod validation on request bodies
- [ ] No secrets in source code
- [ ] No direct `db` imports in routes

**Documentation:**
- [ ] `.claude/session-memory.md` updated
- [ ] Relevant skills updated if behavior changed
- [ ] `replit.md` harmonized if counts changed

### 28.14 Constants & Defaults Governance (Post-Redesign)

After this redesign, the governance model for configurable values is:

```
SEED VALUES (shared/constants.ts)
  └── Used ONLY to initialize the database on first deployment
  └── Export: SEED_DEFAULTS = { depreciationYears: 27.5, daysPerMonth: 30.5, ... }

DATABASE (globalAssumptions table)
  └── Source of truth for all defaults
  └── Admin edits via Model Defaults section
  └── Read by engine at calculation time

ENTITY VALUES (properties table, company model)
  └── Copied from defaults at entity creation time
  └── Owned by the entity after creation
  └── User edits and saves independently
  └── Changing a default does NOT affect existing entities
```

**The test for any new value:**
1. Can someone change this in the UI? → Must be in the database
2. Does it need a fallback? → Use named constant from `shared/constants.ts`
3. Is it backed by regulation? → Mark as governed field (shield icon + authority citation)
4. Can NO ONE change it in the UI? → It shouldn't be a stored value (dead code)

### 28.15 Automated Enforcement Summary

| What's Enforced | How | Fails As |
|-----------------|-----|----------|
| No magic numbers in finance code | `hardcoded-detection.test.ts` | ADVERSE |
| Shared ownership (userId=NULL) | `data-integrity.test.ts` | ADVERSE |
| No prohibited cross-domain imports | `domain-boundaries.test.ts` | ADVERSE |
| All mutations invalidate queries | `recalculation-enforcement.test.ts` | ADVERSE |
| Doc harmony (counts match) | `npm run health` | FAIL |
| Tools have schemas + tests | `tool-registry.test.ts` | ADVERSE |
| No root-level shadow docs | `rule-compliance.test.ts` | ADVERSE |
| GAAP identities (5 golden scenarios) | `scenarios.test.ts` | QUALIFIED |
| Bridge checks (S&U, NOI→FCF) | `reconciliation-report.test.ts` | QUALIFIED |
| Dynamic property count, fee zero-sum | `portfolio-dynamics.test.ts` | QUALIFIED |
| Hand-calculated golden values | Golden tests (269+) | ADVERSE |
| Operating reserve + per-property debt | `operating-reserve-cash.test.ts` | STOP |

**ADVERSE = verification fails, cannot ship**
**QUALIFIED = minor issues, review required**
**STOP = stop all work, fix immediately**

---

*End of plan. This document is the complete specification for the UX redesign and its engineering implementation. It covers UX design, page specifications, field migrations, code organization, database operations, SDKs and tools, Replit development environment, and code governance. A software engineer and designer working in Replit with no prior knowledge of the app can build the correct implementation from this document alone.*
