# UX Redesign Plan: Defaults Governance & App Simplification

**Version**: 1.0
**Date**: 2026-03-16
**Status**: Draft for approval

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
| Company Setup | Company name | Admin > Companies |
| Company Setup | Company logo | Admin > Companies |
| Company Setup | Contact info (phone, email, website) | Admin > Companies |
| Company Setup | Address (street, city, state, country, zip) | Admin > Companies |
| Company Setup | EIN, founding year | Admin > Companies |
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

- Modify property creation flow (server-side) to read defaults from `globalAssumptions`
- When creating property: for every field where user didn't provide a value, fill from defaults
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

- Move company identity fields (name, logo, contact, address, EIN) to Companies tab in admin
- Move exit assumptions and expense rates to Property Underwriting defaults
- Redirect `/company/assumptions` → `/company` for non-admins, → `/admin?section=model-defaults` for admins
- Remove CompanyAssumptions page components (or repurpose read-only parts for the Model Inputs panel)
- Test: admin can edit all company values from Model Defaults
- Test: non-admin sees read-only summary on /company

### Phase 8: Code Constants Migration
**Effort:** Medium | **Risk:** High (touches financial engine)

- Refactor `shared/constants.ts` to `SEED_DEFAULTS` object (used only by migrations/seeds)
- Update property engine: read `depreciationYears` from property entity, not constant
- Update all engine code: read `daysPerMonth` from globalAssumptions, not constant
- Replace all remaining `DEFAULT_*` constant usages with database reads
- **Critical:** Run full test suite after each constant migration
- Run `npm run test:summary` — all tests must pass
- Run `npm run verify:summary` — must show UNQUALIFIED

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
| 4 | Property Creation Pre-fill | Small | Medium | Phase 1 |
| 5 | Company Page Read-Only Panel | Small | Low | — |
| 6 | Eliminate Settings Page | Small | Low | Phase 2 |
| 7 | Company Assumptions Consolidation | Medium | Medium | Phase 2, 5 |
| 8 | Code Constants Migration | Medium | High | Phase 1, 4 |
| 9 | Expose Hidden Property Fields | Small | Low | Phase 4 |
| 10 | Testing & Documentation | Medium | Low | All phases |

**Parallelizable:** Phases 3, 4, 5 can run in parallel after Phase 1. Phase 6 can overlap with Phase 7.

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

*End of plan. This document is the complete specification for the UX redesign. A software engineer and designer with no prior knowledge of the app can build the correct implementation from this document alone.*
