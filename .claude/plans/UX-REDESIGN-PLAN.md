# UX Redesign Plan: Defaults Governance & App Simplification

**Version**: 2.0 (clean rewrite, audit-corrected)
**Date**: 2026-03-16
**Planned by**: Claude Code Opus 4.6 (Anthropic) in collaboration with the project owner
**Companion document**: `.claude/plans/MARCELA-ISOLATION.md` — execute first

---

## For Replit Agent

This plan was written by **Claude Code Opus 4.6** through extended conversation with the project owner, followed by a full codebase audit to verify every claim. It covers UX design, page specifications, database schema, code patterns, SDK usage, and governance rules.

**This is a guide and suggestion, not a rigid specification.**

You are encouraged to:

1. **Use your judgement.** The codebase is ground truth. If something here conflicts with what you see, trust what you see.
2. **Ask the owner questions.** They are the final authority on product decisions. When in doubt, ask.
3. **Replan as needed.** Propose alternatives if you find a better approach. Break work into small steps.
4. **Verify constantly.** After any change: `npm run test:summary` (3,035+ tests). After financial changes: `npm run verify:summary` (must show UNQUALIFIED).
5. **Read the rules first.** `.claude/rules/` has 19 binding governance rules. Read the relevant ones before each phase.
6. **Flag disagreements.** If something is wrong or suboptimal, say so. Honest feedback > blind compliance.

The goal is a better app, not perfect adherence to this document.

---

## Table of Contents

**Part I — What We're Building**
1. [The Problem](#1-the-problem)
2. [Design Principles](#2-design-principles)
3. [Complete App Map (Post-Redesign)](#3-complete-app-map)
4. [Navigation](#4-navigation)
5. [Model Defaults — The New Admin Section](#5-model-defaults)
6. [Governed Fields](#6-governed-fields)
7. [Page Changes](#7-page-changes)
8. [Field Migration Map](#8-field-migration-map)
9. [Data Flow](#9-data-flow)
10. [Access Control](#10-access-control)

**Part II — How to Build It**
11. [Implementation Phases](#11-implementation-phases)
12. [Codebase Architecture](#12-codebase-architecture)
13. [Database & Schema](#13-database-and-schema)
14. [Coding Patterns](#14-coding-patterns)
15. [SDKs, Libraries & Integrations](#15-sdks-libraries-and-integrations)
16. [Deterministic Tool System](#16-deterministic-tool-system)
17. [Testing & Verification](#17-testing-and-verification)
18. [Replit Environment](#18-replit-environment)
19. [Code Governance](#19-code-governance)

---

# Part I — What We're Building

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

### UX Rules

1. **All defaults in one place** — Admin > Model Defaults with 3 tabs: Market & Macro, Company Operations, Property Underwriting
2. **Every calculated value traces to a configurable default** — No code constants. If it affects a number, someone can see and change it.
3. **Defaults are starting points, not live bindings** — They pre-fill entities at creation. Changing a default does NOT retroactively change existing properties.
4. **Non-admin users get a clean operational view** — No settings pages. Every sidebar item is something they use daily.
5. **Governed values inform, not block** — IRS/GAAP values are editable but carry a shield icon + authority citation + caution text.
6. **Config switches are not defaults** — Sidebar toggles, AI settings, display preferences stay in their admin tabs, not in Model Defaults.
7. **If no one can change a value, it shouldn't be stored** — It's dead code.

### Distinction: Default vs Config Switch

| Type | What It Is | Where It Lives | Example |
|------|-----------|---------------|---------|
| **Default** | Starting value that flows into an entity field a user can change | Admin > Model Defaults | Exit cap rate, depreciation years, staff salary |
| **Config switch** | Platform behavior toggle — no user-facing field it pre-fills | Stays in relevant admin tab | Sidebar visibility, preferred LLM, tour prompt |

### Visual Design Standards

Every page looks like a premium $50K+ financial platform:
- Animated numbers (NumberTicker, never static)
- Glassmorphism cards (backdrop blur, layered depth)
- Staggered reveals (lists cascade in, never all-at-once)
- Skeleton loading (never spinner-only)
- Typography: IBM Plex Sans (headings), Inter (body), JetBrains Mono (numbers)
- All colors via CSS variables / theme tokens (no hardcoded hex)

---

## 3. Complete App Map

### Post-Redesign Site Map

```
PUBLIC (no auth)
├── /login                    3D logo, email+password, Google OAuth
├── /privacy                  Privacy policy
└── /terms                    Terms of service

AUTHENTICATED — NON-ADMIN USERS
├── / (Dashboard)             Portfolio overview + financial statements
│   ├── Portfolio Overview         KPI cards, charts, distributions
│   ├── Income Statement           Consolidated multi-year P&L
│   ├── Cash Flow                  Operating/investing/financing
│   ├── Balance Sheet              Consolidated BS
│   └── Investment Analysis        IRR, equity multiple, returns
│
├── /portfolio                Property grid + map
│   ├── Properties tab             Card grid of all properties
│   └── Map tab                    MapLibre geographic view
│
├── /property/:id             Single property financials
│   ├── Income Statement           Property P&L
│   ├── Cash Flow                  Property cash flows
│   ├── Balance Sheet              Property BS
│   ├── PPE Schedule               Depreciation schedule
│   └── Reconciliation             (admin/checker only)
│
├── /property/:id/edit        Property assumptions editor (8 sections)
├── /property/:id/photos      Photo management
├── /property/:id/research    Market research results
├── /property/:id/criteria    Research criteria editor
│
├── /company                  Management company pro-forma
│   ├── Income tab                 Company P&L
│   ├── Cash Flow tab              Company cash flows
│   ├── Balance Sheet tab          Company BS
│   └── Model Inputs panel  ★ NEW  READ-ONLY expandable summary
│
├── /company/icp-definition   ICP target property definition (4 tabs)
├── /company/research         Company market research (3 groups × 5 sub-tabs)
│
├── /analysis                 Analysis hub (5 tabs)
│   ├── Sensitivity                Sliders + heatmap + tornado
│   ├── Compare                    Side-by-side up to 4 properties
│   ├── Timeline                   Acquisition timeline
│   ├── Financing                  DSCR, debt yield, stress test, prepayment
│   └── Capital Raise              Funding runway + SAFE modeling
│
├── /scenarios                Save/load/compare model snapshots
├── /property-finder          External property search + favorites
├── /map                      Portfolio geographic map (full page)
├── /profile                  User profile + theme selection
└── /help                     User Manual (17s) + Checker Manual (21s) + Tour

ADMIN ONLY
└── /admin                    Admin hub with sidebar
    ├── BUSINESS group
    │   ├── Model Defaults  ★ NEW  All financial defaults (3 tabs)
    │   │   ├── Market & Macro
    │   │   ├── Company Operations
    │   │   └── Property Underwriting
    │   ├── Users                  Accounts, company assignment, group assignment
    │   ├── Companies              External companies of interest (NOT mgmt co)
    │   └── Groups                 User groups + theme assignment
    │
    ├── RESEARCH group
    │   ├── ICP Management Co      ICP editor
    │   ├── Research Center        Per-domain config, tool toggles, per-event settings
    │   ├── Research Sources  ★ NEW  3 subsections: Mgmt Co, Properties, Market & Industry
    │   └── Research LLMs    ★ NEW  2 models × 3 domains = 6 LLM slots
    │
    ├── DESIGN group
    │   ├── Logos                   Logo pool management
    │   └── Themes                 Color theme designer
    │
    ├── AI AGENTS group
    │   └── AI Agents              Rebecca text chatbot config
    │                              (Marcela isolated — see MARCELA-ISOLATION.md)
    │
    └── SYSTEM group
        ├── Navigation & Display   Sidebar toggles + display settings + tour
        ├── Notifications          Email channels, alert rules
        ├── Diagrams               Architecture visualizations
        ├── Verification           GAAP audit + proof suite
        ├── Database               Entity monitoring + seed data
        ├── Integrations           Service health + cache
        └── Activity               Login logs, audit trail
```

### Removed Routes

| Route | Replacement |
|-------|------------|
| `/settings` | Redirects to `/company` (non-admin) or `/admin?section=model-defaults` (admin) |
| `/company/assumptions` (non-admin) | Redirects to `/company` (read-only Model Inputs panel) |

### Existing Redirects (unchanged)
`/sensitivity` → `/analysis`, `/financing` → `/analysis`, `/compare` → `/analysis`, `/timeline` → `/analysis`, `/research` → `/`, `/global/research` → `/company/research`, `/methodology` → `/help`, `/executive-summary` → `/`, `/checker-manual` → `/help`, `/icp` → `/admin`

---

## 4. Navigation

### Non-Admin Sidebar

```
┌────────────────────────────┐
│  [Company Logo]            │
│  Company Name              │
├────────────────────────────┤
│  HOME                      │
│  ○ Dashboard         /     │
│  ○ Properties   /portfolio │
│  ○ Mgmt Company /company  │
│                            │
│  TOOLS                     │
│  ○ Simulation   /analysis  │
│  ○ Property Finder         │
│  ○ Map View     /map      │
│                            │
│  ACCOUNT                   │
│  ○ My Profile   /profile  │
│  ○ My Scenarios /scenarios│
│                            │
├────────────────────────────┤
│  ○ Help         /help     │
│  ○ Sign Out               │
│  Privacy · Terms           │
└────────────────────────────┘
```

**Removed:** "General Settings" — all content moved to Admin.

**Conditionally visible** (admin toggles in Navigation & Display):
- Simulation (`sidebarSensitivity`), Property Finder (`sidebarPropertyFinder`), Map View (`sidebarMapView`), Scenarios (`sidebarScenarios`), Help (`sidebarUserManual`)

**Always visible:** Dashboard, Properties, Mgmt Company, My Profile, Sign Out

### Admin Sidebar (on `/admin`)

```
┌────────────────────────────┐
│  Admin Panel               │
│  ← Back to App             │
├────────────────────────────┤
│  BUSINESS                  │
│  ● Model Defaults  ★ NEW  │
│  ○ Users                   │
│  ○ Companies               │
│  ○ Groups                  │
│                            │
│  RESEARCH                  │
│  ○ ICP Management Co       │
│  ○ Research Center         │
│  ○ Research Sources  ★ NEW │
│  ○ Research LLMs     ★ NEW │
│                            │
│  DESIGN                    │
│  ○ Logos                   │
│  ○ Themes                  │
│                            │
│  AI AGENTS                 │
│  ○ AI Agents               │
│                            │
│  SYSTEM                    │
│  ○ Navigation & Display    │
│  ○ Notifications           │
│  ○ Diagrams                │
│  ○ Verification            │
│  ○ Database                │
│  ○ Integrations            │
│  ○ Activity                │
└────────────────────────────┘
```

### Mobile
- Bottom tab bar: Dashboard, Properties, Company, Profile
- Hamburger opens sheet drawer with full sidebar

---

## 5. Model Defaults — The New Admin Section

### Overview

Single source of truth for all financial defaults. Three tabs, each with grouped sections. Located first in the Business group of the admin sidebar.

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

Since there's only one management company, these ARE the values (not templates). The management company is a singleton.

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

*Note: These fields currently live on Company Assumptions page (CompanySetupSection). They move here because the Admin > Companies tab manages external "Companies of Interest", not the management company itself.*

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

## 6. Governed Fields

A governed field is any value backed by regulation, tax law, or industry standard. It's editable but carries authority citation.

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

- **Shield icon** (not warning triangle) — conveys authority, not danger
- **Collapsible helper text** — expanded on first view, collapsible after
- **Muted amber background** — `bg-amber-50 border-amber-200` (light), `bg-amber-900/20` (dark)
- **Same treatment on Property Edit** — governance info travels with the field
- **Help page section** — each governed field gets authority explanation

---

## 6b. Research Center Restructure

### The Problem

Currently the Research Center has:
- **One flat LLM configuration** — a single primary + secondary model shared across all research types
- **Sources loosely organized** — property and market sources exist as pre-configured lists in client code (`research-shared.tsx`), not as admin-configurable collections
- No way to say "use Claude for property research but Gemini for market research"

### The Solution

Centralize sources and LLMs behind the admin wall with **domain-specific configuration** for three research contexts.

### Research Sources — New Admin Tab

A new "Research Sources" item in the Research group of the admin sidebar. Three subsections:

#### Sources for Management Company
Knowledge sources that feed ICP and company-level research:
- Hospitality management industry reports
- AHLA, PKF, HVS publications
- Outsourcing and vendor benchmarking sources
- Admin can add/remove URLs with labels and categories

#### Sources for Properties
Knowledge sources that feed per-property market research:
- STR (CoStar), CBRE Hotels, HVS, Real Capital Analytics
- Local market reports, comp set data
- Property-specific benchmarking sources
- Admin can add/remove URLs with labels and categories

#### Sources for Market & Industry
Knowledge sources that feed global/macro research:
- FRED (Federal Reserve), BLS, Preqin, Trepp
- Lodging Econometrics, AHLA
- Economic outlook, capital markets, ESG reports
- Admin can add/remove URLs with labels and categories

**Current state:** Sources are hardcoded in `client/src/components/admin/research-center/research-shared.tsx` as `PROPERTY_DEFAULT_SOURCES` and `MARKET_DEFAULT_SOURCES`. The restructure moves these into the database as admin-editable configurations within each domain's `ResearchEventConfig.sources` array.

**Data model:** Each source is a `ResearchSourceEntry`:
```typescript
{ id: string; url: string; label: string; category?: string; addedAt: string; }
```

Stored in `researchConfig.property.sources`, `researchConfig.company.sources`, `researchConfig.global.sources` (already supported by the JSONB schema — just needs UI).

### Research LLMs — New Admin Tab

A new "Research LLMs" item in the Research group. Two models per domain = 6 LLM slots:

| Domain | Primary LLM (Reasoning) | Secondary LLM (Workhorse) |
|--------|------------------------|--------------------------|
| **Management Company** | e.g., Claude Opus | e.g., Gemini Flash |
| **Properties** | e.g., Claude Sonnet | e.g., GPT-4o |
| **Market & Industry** | e.g., Gemini Pro | e.g., Claude Haiku |

**Why two per domain:**
- **Primary (Reasoning)** — Used for complex analysis, synthesis, and recommendations. Higher quality, slower, more expensive.
- **Secondary (Workhorse)** — Used for data extraction, summarization, and routine tasks. Faster, cheaper.

**Current state:** The Research Center has a single LLM tab with `primaryLlm` + `secondaryLlm` + `llmMode` (dual/primary-only) shared across all research types. The restructure replaces this with domain-specific configuration.

**Data model change:** Extend `ResearchEventConfig` with LLM fields:

```typescript
export interface ResearchEventConfig {
  // ... existing fields ...
  primaryLlm?: string;      // NEW — reasoning model for this domain
  secondaryLlm?: string;    // NEW — workhorse model for this domain
  llmMode?: LlmMode;        // NEW — "dual" | "primary-only" per domain
}
```

The top-level `researchConfig.primaryLlm` and `researchConfig.secondaryLlm` become fallbacks for domains that don't have their own configuration (backward compatibility).

**LLM resolution chain:**
```
Domain-specific model → Top-level researchConfig model → globalAssumptions.preferredLlm → hardcoded default
```

### UI Layout

**Research Sources tab:**
```
┌─────────────────────────────────────────────────────┐
│  Research Sources                                    │
│                                                      │
│  ┌─ Management Company ──────────────────────────┐  │
│  │  ○ AHLA (ahla.com)                    [✕]     │  │
│  │  ○ PKF Hospitality (pkfhotels.com)    [✕]     │  │
│  │  ○ + Add Source                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Properties ──────────────────────────────────┐  │
│  │  ○ STR / CoStar (str.com)             [✕]     │  │
│  │  ○ CBRE Hotels (cbre.com/hotels)      [✕]     │  │
│  │  ○ HVS (hvs.com)                     [✕]     │  │
│  │  ○ Real Capital Analytics (msci.com)  [✕]     │  │
│  │  ○ + Add Source                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Market & Industry ───────────────────────────┐  │
│  │  ○ FRED (fred.stlouisfed.org)         [✕]     │  │
│  │  ○ BLS (bls.gov)                     [✕]     │  │
│  │  ○ Preqin (preqin.com)               [✕]     │  │
│  │  ○ Lodging Econometrics              [✕]     │  │
│  │  ○ + Add Source                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  [Save]                                              │
└─────────────────────────────────────────────────────┘
```

**Research LLMs tab:**
```
┌─────────────────────────────────────────────────────┐
│  Research LLMs                                       │
│                                                      │
│  ┌─ Management Company ──────────────────────────┐  │
│  │  Primary (Reasoning):   [Claude Opus     ▾]   │  │
│  │  Secondary (Workhorse): [Gemini Flash    ▾]   │  │
│  │  Mode: ○ Dual  ○ Primary Only                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Properties ──────────────────────────────────┐  │
│  │  Primary (Reasoning):   [Claude Sonnet   ▾]   │  │
│  │  Secondary (Workhorse): [GPT-4o          ▾]   │  │
│  │  Mode: ○ Dual  ○ Primary Only                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Market & Industry ───────────────────────────┐  │
│  │  Primary (Reasoning):   [Gemini Pro      ▾]   │  │
│  │  Secondary (Workhorse): [Claude Haiku    ▾]   │  │
│  │  Mode: ○ Dual  ○ Primary Only                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  [Save]                                              │
│                                                      │
│  Available Models: [Refresh Models]                  │
│  Anthropic: Claude Opus, Sonnet, Haiku               │
│  OpenAI: GPT-5.4, o3, o4-mini                       │
│  Google: Gemini 3.1, 2.5, Flash                      │
│  xAI: Grok 4, Grok 3                                │
└─────────────────────────────────────────────────────┘
```

### Implementation

This is **Phase 3** in the dependency structure (can run in parallel with Phase 2 — Model Defaults UI):

1. **Schema:** Extend `ResearchEventConfig` interface with `primaryLlm`, `secondaryLlm`, `llmMode` fields
2. **Server:** Update `server/routes/research.ts` to read domain-specific LLM from `researchConfig[type].primaryLlm` with fallback to top-level
3. **Admin UI:** Create `ResearchSourcesTab.tsx` and `ResearchLlmsTab.tsx` components
4. **Migrate defaults:** Move hardcoded source lists from `research-shared.tsx` into database as initial seed values
5. **Admin sidebar:** Add two new items to Research group
6. **Test:** Verify research generation uses domain-specific LLM when configured, falls back when not

---

## 7. Page Changes

### 7.1 Settings Page → ELIMINATED

The `/settings` page is removed. Its 15 fields move to:

| Current Field | Current Tab | Moves To |
|--------------|-------------|----------|
| Disposition commission | Property Defaults | Model Defaults > Property Underwriting > Disposition |
| Acquisition LTV, rate, term, closing | Property Defaults | Model Defaults > Property Underwriting > Acquisition Financing |
| Refi LTV, rate, term, closing, years-after | Property Defaults | Model Defaults > Property Underwriting > Refinance Terms |
| Fiscal year start month | Macro | Model Defaults > Market & Macro > Fiscal Calendar |
| Inflation escalator | Macro | Model Defaults > Market & Macro > Economic Environment |
| Show company calc details | Other | Admin > Navigation & Display |
| Show property calc details | Other | Admin > Navigation & Display |
| Auto-refresh research | Other | Admin > Research Center |
| Show tour prompt | Other | Admin > Navigation & Display |

"General Settings" removed from sidebar. `/settings` redirects.

### 7.2 Company Assumptions Page → Admin Only

**Current state:** 12 sections, 63+ fields, accessible to management users.

**New state:**
- All financial inputs move to Model Defaults > Company Operations tab
- Company identity fields (name, logo, contact, address) move to Model Defaults > Company Operations > Identity
- Exit/expense rate fields move to Model Defaults > Property Underwriting
- `/company/assumptions` redirects to `/company` for non-admins, `/admin?section=model-defaults` for admins

### 7.3 Company Page (`/company`) — New Model Inputs Panel

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

### 7.4 Property Edit — Pre-fill from Defaults

When a user creates a new property, all fields are pre-filled from Model Defaults > Property Underwriting. The user sees real numbers in every field on day one, edits what they want, saves. The property then owns its values.

**Current state (from audit):** The server route `POST /api/properties` already calls `buildPropertyDefaultsFromGlobal()` for cost rates, financing, exit, and fees. But revenue defaults (ADR, occupancy, ramp) are pre-filled on the **client side** from constants. This redesign unifies both into a single server-side flow reading everything from the database.

**Governed fields on Property Edit:** Depreciation years shows the same shield + authority citation as in admin.

### 7.5 Admin Panel — Model Defaults Added

Only change to admin sidebar: "Model Defaults" added as first item in Business group. All other admin tabs unchanged (except Navigation renamed to "Navigation & Display" and gains display toggle + tour toggle fields from eliminated Settings page).

---

## 8. Field Migration Map

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
| Preferred LLM (per-domain, 6 slots) | Admin > Research LLMs ★ NEW (restructured from Research Center) |
| Rebecca enabled/config | Admin > AI Agents |

---

## 9. Data Flow

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

**When admin changes a Company Operations value** → immediately affects company pro-forma (singleton — direct edit).

**When admin changes a Market & Macro value** → immediately affects research context and any calculation reading this global value.

---

## 10. Access Control

### Route Access

| Route | Auth | Management | Admin | Checker |
|-------|------|-----------|-------|---------|
| `/` Dashboard | Yes | Yes | Yes | Yes |
| `/portfolio` | Yes | Yes | Yes | Yes |
| `/property/:id` | Yes | Yes | Yes | Yes |
| `/property/:id/edit` | — | Yes | Yes | — |
| `/company` | — | Yes | Yes | — |
| `/analysis` | — | Yes | Yes | — |
| `/scenarios` | — | Yes | Yes | — |
| `/property-finder` | — | Yes | Yes | — |
| `/map` | — | Yes | Yes | — |
| `/profile` | Yes | Yes | Yes | Yes |
| `/help` | Yes | Yes | Yes | Yes |
| `/admin` (all sections) | — | — | Yes | — |

### Feature Access

| Feature | Investor | User/Partner | Admin | Checker |
|---------|----------|-------------|-------|---------|
| View financial statements | Yes | Yes | Yes | Yes |
| Edit property assumptions | — | Yes | Yes | — |
| Create/delete properties | — | Yes | Yes | — |
| View company pro-forma | — | Yes | Yes | — |
| Edit company model inputs | — | — | Yes | — |
| Edit Model Defaults | — | — | Yes | — |
| Manage users/groups | — | — | Yes | — |
| Run verification | — | — | Yes | Yes |

---

# Part II — How to Build It

---

## 11. Implementation Phases

### Phase 1: Schema & Database
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Add new columns to `globalAssumptions` table:
- `depreciationYears` (real, default 27.5)
- `daysPerMonth` (real, default 30.5)
- Revenue defaults currently hardcoded on client: `defaultStartAdr`, `defaultAdrGrowthRate`, `defaultStartOccupancy`, `defaultMaxOccupancy`, `defaultOccupancyRampMonths`, `defaultOccupancyGrowthStep`, `defaultCateringBoostPct`

Write idempotent migration in `server/migrations/model-defaults-001.ts`. Runs automatically on next server start.

Update `shared/schema/config.ts` with new fields.

### Phase 2: Admin Model Defaults UI
**Effort:** Medium | **Risk:** Medium | **Depends on:** Phase 1

Create `ModelDefaultsTab.tsx` with 3 sub-tabs (MarketMacroTab, CompanyOperationsTab, PropertyUnderwritingTab). Follow existing admin tab patterns (see `PeopleTab.tsx`, `CompensationSection.tsx`). Wire to `PATCH /api/global-assumptions`. Add to `AdminSidebar.tsx` as first item in Business group.

### Phase 3: Research Center Restructure
**Effort:** Medium | **Risk:** Low | **Depends on:** Phase 1

Centralize research sources and LLMs with domain-specific configuration. See Section 6b for full specification.

- Extend `ResearchEventConfig` interface with `primaryLlm`, `secondaryLlm`, `llmMode` fields
- Create `ResearchSourcesTab.tsx` — 3 subsections (Mgmt Co, Properties, Market & Industry) for admin-editable source URLs
- Create `ResearchLlmsTab.tsx` — 2 models × 3 domains = 6 LLM slots with mode toggle per domain
- Migrate hardcoded source lists from `research-shared.tsx` to database seed values
- Update `server/routes/research.ts` to read domain-specific LLM with fallback chain
- Add both tabs to admin sidebar Research group
- **Can run in parallel with Phase 2** (Model Defaults UI)

### Phase 4: Governed Field Component
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Create `GovernedField.tsx` component with shield icon, authority badge, collapsible helper text. Apply to depreciation years and days per month. Add governed fields reference to Help page.

### Phase 5: Extend Property Creation Pre-fill
**Effort:** Small | **Risk:** Medium | **Depends on:** Phase 1

**Already exists:** `buildPropertyDefaultsFromGlobal()` in `server/routes/properties.ts` fills cost rates, financing, exit, fees from `globalAssumptions`.

**Extend it to:**
- Include new revenue defaults (ADR, occupancy, ramp) from database instead of client constants
- Include `depreciationYears` from database
- Update `AddPropertyDialog` to read initial form values from API instead of client-side constants

### Phase 6: Company Page Read-Only Panel
**Effort:** Small | **Risk:** Low | **Depends on:** Nothing

Create `ModelInputsPanel.tsx` — read-only expandable accordion on `/company` page. Reads from `globalAssumptions`. Shows "Edit in Admin > Model Defaults" link for admins.

### Phase 7: Eliminate Settings Page
**Effort:** Small | **Risk:** Low | **Depends on:** Phase 2

Remove `/settings` route. Remove "General Settings" from sidebar. Add redirect. Move display toggles to Navigation & Display tab. Move research auto-refresh to Research Center. Move tour toggle to Navigation & Display.

### Phase 8: Company Assumptions Consolidation
**Effort:** Medium | **Risk:** Medium | **Depends on:** Phase 2, 6

Move company identity fields to Model Defaults > Company Operations > Identity. Move exit/expense fields to Property Underwriting. Redirect `/company/assumptions` for non-admins. Admin edits company values via Model Defaults.

### Phase 9: Code Constants Migration
**Effort:** Large | **Risk:** High | **Depends on:** Phase 1, 5

**Scope:** `DEPRECIATION_YEARS` referenced in 42 files. `DAYS_PER_MONTH` in 48 files. 30+ test files import these constants directly.

- Refactor `shared/constants.ts` to `SEED_DEFAULTS` (used only by migrations/seeds)
- Update `resolve-assumptions.ts` line 158: read `depreciationYears` from property input
- Update engine: pass `depreciationYears` through property context
- Update engine: read `daysPerMonth` from globalAssumptions
- Update 30+ test files: fixtures must populate new entity fields

**Migrate one constant at a time.** Start with `DEPRECIATION_YEARS` (simpler — property-scoped). Then `DAYS_PER_MONTH`. Then remaining `DEFAULT_*`. Run full test suite after each.

### Phase 10: Expose Hidden Property Fields
**Effort:** Small | **Risk:** Low | **Depends on:** Phase 5

Add to Property Edit form fields that exist in schema but not in UI: property inflation rate, AR/AP days, cost segregation settings, day count convention, escalation method. Pre-fill from defaults.

### Phase 11: Testing & Documentation
**Effort:** Medium | **Risk:** Low | **Depends on:** All phases

New tests: model-defaults proof test, governed-fields engine test, research-center restructure test, settings-elimination test. Update existing tests. Update Help page. Run `npm run verify:summary` — must show UNQUALIFIED. Run `npm run health`.

### Summary

```
Phase 1: Schema & Database (no deps)
    ├── Phase 2: Model Defaults Admin Tab (depends on 1)  ─┐
    │                                                       ├─ can run in parallel
    ├── Phase 3: Research Center Restructure (depends on 1) ┘
    │
    ├── Phase 4: Governed Field Component (no deps)
    ├── Phase 5: Extend Property Creation Pre-fill (depends on 1)
    ├── Phase 6: Company Page Read-Only Panel (no deps)
    │
    ├── Phase 7: Eliminate Settings Page (depends on 2)
    ├── Phase 8: Company Assumptions Consolidation (depends on 2, 6)
    │
    ├── Phase 9: Code Constants Migration (depends on 1, 5) ← HIGHEST RISK
    ├── Phase 10: Expose Hidden Property Fields (depends on 5)
    │
    └── Phase 11: Testing & Documentation (depends on all)
```

| Phase | Work | Effort | Risk | Depends On |
|-------|------|--------|------|------------|
| 1 | Schema & Database | Small | Low | — |
| 2 | Admin Model Defaults UI | Medium | Medium | 1 |
| 3 | Research Center Restructure | Medium | Low | 1 |
| 4 | Governed Field Component | Small | Low | — |
| 5 | Extend Property Creation Pre-fill | Small | Medium | 1 |
| 6 | Company Page Read-Only Panel | Small | Low | — |
| 7 | Eliminate Settings Page | Small | Low | 2 |
| 8 | Company Assumptions Consolidation | Medium | Medium | 2, 6 |
| 9 | Code Constants Migration | **Large** | **High** | 1, 5 |
| 10 | Expose Hidden Property Fields | Small | Low | 5 |
| 11 | Testing & Documentation | Medium | Low | All |

**Parallelizable:** Phases 2 + 3 in parallel. Phases 4, 5, 6 in parallel. Phase 7 + 8 after Phase 2.

**Phase 9 warning:** Highest-risk phase. 90+ files reference the constants. Migrate one at a time, full test suite after each.

**Note:** Replit has created Task #166 covering Phase 1 + Phase 2 + Phase 5 (schema extension, Model Defaults tab, property creation defaults). The task scoping explicitly defers Phase 4 (governed fields), Phase 7 (settings elimination), and Phase 3 (research restructure) to follow-up tasks.

---

## 12. Codebase Architecture

### Directory Structure

```
/home/runner/workspace/
├── client/src/
│   ├── pages/              Route-level page components
│   ├── components/
│   │   ├── ui/             Base components (shadcn/ui + glass, animated, charts)
│   │   ├── graphics/       Visualization & animation (KPIGrid, DonutChart, etc.)
│   │   ├── admin/          Admin tab components (15+ tabs)
│   │   ├── dashboard/      Dashboard tabs
│   │   ├── company/        Company page components
│   │   ├── company-assumptions/  Company assumption sections (12)
│   │   ├── property-detail/     Property detail tabs
│   │   ├── property-edit/       Property edit form sections (8)
│   │   ├── settings/       Settings tabs (TO BE REMOVED)
│   │   └── ...             Other domain components
│   ├── features/
│   │   ├── design-themes/  Theme system
│   │   ├── property-images/ Photo management
│   │   └── ai-agent/       Marcela voice (ISOLATED — see MARCELA-ISOLATION.md)
│   ├── hooks/              Custom React hooks
│   └── lib/
│       ├── api/            TanStack Query hooks + fetch functions
│       ├── financial/      Property + Company engines
│       ├── charts/         12 reusable Recharts components
│       └── exports/        PDF, Excel, PPTX, CSV, PNG generators
│
├── server/
│   ├── routes/             API handlers (20+ domain files)
│   │   └── admin/          Admin-only sub-routes
│   ├── storage/            IStorage interface + 11 sub-storage classes
│   ├── ai/                 AI integrations + knowledge base
│   ├── integrations/       External service wrappers (8)
│   ├── migrations/         Schema migrations (18)
│   ├── seeds/              Seed data modules
│   ├── services/           Business services (MI, FRED, benchmarks)
│   ├── calculation-checker/ Independent verification engine
│   └── notifications/      Alert rules engine
│
├── shared/
│   ├── schema/             Drizzle table definitions (source of truth for types)
│   └── constants.ts        Named constants + defaults
│
├── calc/                   36 pure deterministic calculation tools
│   ├── dispatch.ts         Tool registry + router
│   ├── shared/             Utilities, schemas, types
│   └── {research,returns,validation,analysis,financing,services}/
│
├── tests/                  3,035 tests across 136 files
│   ├── proof/              Invariant enforcement
│   ├── engine/             Financial calculations
│   ├── calc/               Tool tests
│   └── integration/        API tests
│
└── .claude/
    ├── rules/              19 binding governance rules
    ├── skills/             186 reference docs (load on demand)
    ├── tools/              JSON schemas for calc tools
    └── plans/              This file + MARCELA-ISOLATION.md
```

### Module Boundaries (Enforced by Tests)

- `calc/` never imports from `server/` or `client/` — pure functions only
- `server/routes/` never imports `db` directly — all through `IStorage` facade
- `client/` never imports from `server/` — HTTP API only
- `shared/` imported by both client and server
- Features (`client/src/features/`) are self-contained with `index.ts` barrel

### Import Aliases

```
@/*           → client/src/*
@shared/*     → shared/*
@calc/*       → calc/*
@domain/*     → domain/*
```

---

## 13. Database & Schema

### Schema Definition (Drizzle ORM)

Tables defined in `shared/schema/` using `pgTable()`. Single source of truth for types. Both client and server import from here.

**New columns for this redesign:**
```typescript
// shared/schema/config.ts — add to globalAssumptions
depreciationYears: real("depreciation_years").default(27.5),
daysPerMonth: real("days_per_month").default(30.5),
defaultStartAdr: real("default_start_adr").default(250),
defaultAdrGrowthRate: real("default_adr_growth_rate").default(0.03),
defaultStartOccupancy: real("default_start_occupancy").default(0.55),
defaultMaxOccupancy: real("default_max_occupancy").default(0.85),
defaultOccupancyRampMonths: integer("default_occupancy_ramp_months").default(6),
defaultOccupancyGrowthStep: real("default_occupancy_growth_step").default(0.05),
defaultCateringBoostPct: real("default_catering_boost_pct").default(0.22),

// shared/schema/properties.ts — add to properties
depreciationYears: real("depreciation_years").default(27.5),
```

### Data Integrity Rules

1. **Shared ownership:** All portfolio data uses `userId = NULL`
2. **Singleton queries:** `ORDER BY id DESC LIMIT 1` on `globalAssumptions`
3. **Fill-only sync:** `isFieldEmpty()` + `fillMissingFields()` — never overwrite user values
4. **No direct `db` imports in routes** — all through `IStorage` facade
5. **Zod validation** on all request bodies

### Migration Pattern

```typescript
// server/migrations/model-defaults-001.ts
export async function migrate(db: NodePgDatabase) {
  await db.execute(sql`
    ALTER TABLE global_assumptions
    ADD COLUMN IF NOT EXISTS depreciation_years REAL DEFAULT 27.5
  `);
  // ... more columns
  console.info("[INFO] [migration] model-defaults-001 complete");
}
```

Always idempotent (`IF NOT EXISTS`). Registered in `server/index.ts` startup sequence. Runs automatically.

### Storage Layer

All DB access through `IStorage` interface → `DatabaseStorage` → 11 sub-storage classes:
UserStorage, PropertyStorage, FinancialStorage, AdminStorage, ActivityStorage, ResearchStorage, PhotoStorage, DocumentStorage, ServiceStorage, NotificationStorage.

---

## 14. Coding Patterns

### Component Pattern

```typescript
import { Card } from "@/components/ui/card";
import { GlassButton } from "@/components/ui/glass-button";

interface Props { property: Property; onSave: (data: Partial<Property>) => void; }

export function PropertyCard({ property, onSave }: Props) {
  return (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20">
      <GlassButton variant="primary" onClick={() => onSave(data)}>Save</GlassButton>
    </Card>
  );
}
```

### Mutation + Invalidation Pattern

```typescript
import { invalidateAllFinancialQueries } from "@/lib/api";

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest("PATCH", `/api/properties/${data.id}`, data.updates),
    onSuccess: () => { invalidateAllFinancialQueries(queryClient); },
  });
}
```

**Every financial mutation** calls `invalidateAllFinancialQueries` in `onSuccess`. Never hand-pick keys.

### API Route Pattern

```typescript
router.post("/api/properties", requireAuth, async (req, res) => {
  try {
    const parsed = insertPropertySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const property = await storage.createProperty({ ...parsed.data, userId: null });
    res.status(201).json(property);
  } catch (err) {
    console.error("[ERROR] [properties] Failed to create", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase `.tsx` | `ModelDefaultsTab.tsx` |
| Utilities | camelCase `.ts` | `loanCalculations.ts` |
| Calc tools | kebab-case `.ts` | `compute-property-metrics.ts` |
| Constants | UPPER_SNAKE_CASE | `DEPRECIATION_YEARS` |
| DB columns | snake_case | `depreciation_years` |
| API routes | kebab-case | `/api/global-assumptions` |
| Tool names | snake_case | `compute_property_metrics` |
| Test files | `*.test.ts` | `break-even.test.ts` |

### No Hardcoded Values

```typescript
// CORRECT
const taxRate = globalAssumptions.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE;

// WRONG
const taxRate = 0.30;
```

After this redesign, even `DEPRECIATION_YEARS` and `DAYS_PER_MONTH` become database values. Only safe literals in calc code: `0`, `1`, `-1`, `2`, `12`, `100`.

---

## 15. SDKs, Libraries & Integrations

### Frontend

| Library | Purpose |
|---------|---------|
| React 18 + TypeScript | UI framework (strict mode, ESM) |
| Wouter 3 | Client routing |
| TanStack Query 5 | Server state (`staleTime: Infinity`, manual invalidation) |
| Zustand 4 | Local state (legacy fallback) |
| Tailwind CSS 4 | Styling (PostCSS) |
| shadcn/ui | Base components |
| Recharts 2 | Financial charts |
| Framer Motion 11 | Animations |
| Three.js | 3D graphics (lazy-loaded) |
| Lucide React / Phosphor | Icons (theme-selectable) |
| jsPDF, SheetJS, pptxgenjs | Export formats (dynamic import) |
| dom-to-image-more | PNG screenshots (dynamic import) |
| Zod 3 | Schema validation |
| date-fns 3 | Date manipulation |

### Backend

| Library | Purpose |
|---------|---------|
| Express 5 | HTTP server |
| Drizzle ORM | PostgreSQL ORM |
| pg 8 | PostgreSQL driver |
| esbuild | Server bundling |
| Vite 5 | Dev server + client build |
| bcrypt 5 | Password hashing |

### AI SDKs (Lazy Singleton Pattern)

| SDK | Purpose | Env Var |
|-----|---------|---------|
| `@anthropic-ai/sdk` | Claude (research, verification) | `ANTHROPIC_API_KEY` |
| `openai` | GPT (fallback) | `AI_INTEGRATIONS_OPENAI_API_KEY` |
| `@google/generative-ai` | Gemini (primary research, Rebecca) | `AI_INTEGRATIONS_GEMINI_API_KEY` |

### External Services

| Service | Purpose | Files |
|---------|---------|-------|
| FRED | Economic data | `server/services/FREDService.ts` |
| Resend | Email | `server/integrations/resend.ts` |
| Google Maps | Geocoding | `server/integrations/geospatial.ts` |
| Google Document AI | OCR | `server/integrations/document-ai.ts` |
| Sentry | Error tracking | `server/sentry.ts` |
| Upstash Redis | Caching | `server/cache.ts` |
| ElevenLabs | Voice agent | **ISOLATED** — see `MARCELA-ISOLATION.md` |
| Twilio | SMS/voice | **ISOLATED** — see `MARCELA-ISOLATION.md` |

---

## 16. Deterministic Tool System

36 pure-function financial calculators in `calc/`, registered in `calc/dispatch.ts`, validated with Zod, tested with golden values.

| Category | Count | Examples |
|----------|-------|---------|
| Research | 10 | `compute_property_metrics`, `compute_adr_projection`, `compute_cap_rate_valuation` |
| Returns | 6 | `calculate_dcf_npv`, `compute_equity_multiple`, `exit_valuation` |
| Validation | 5 | `validate_financial_identities`, `funding_gate_checks` |
| Analysis | 8 | `consolidate_statements`, `break_even_analysis`, `stress_test` |
| Financing | 5 | `calculate_dscr`, `calculate_debt_yield`, `calculate_prepayment` |
| Services | 2 | `centralized_service_margin`, `cost_of_services_aggregator` |

### Adding a Tool

1. Implement pure function in `calc/<category>/<name>.ts`
2. Add Zod schema in `calc/shared/schemas.ts`
3. Register in `calc/dispatch.ts` with `withRounding()` or `wrap()`
4. Create JSON schema in `.claude/tools/<category>/<name>.json`
5. Write tests in `tests/calc/<category>/<name>.test.ts`
6. Update count in `.claude/rules/deterministic-tools.md`
7. Run: `npm run test:file -- tests/calc/ && npm run verify:summary`

### Key Rule

Tools in `calc/` MUST never import from `server/` — enforced by `tests/proof/domain-boundaries.test.ts`.

---

## 17. Testing & Verification

### Test Suite: 3,035 Tests

| Category | Directory | Purpose |
|----------|-----------|---------|
| Proof | `tests/proof/` | Invariant enforcement (GAAP identities, domain boundaries, data integrity) |
| Engine | `tests/engine/` | Financial calculation correctness |
| Calc | `tests/calc/` | Deterministic tool I/O |
| Golden | Spread across above | 500 hand-calculated reference values |
| Integration | `tests/integration/` | API route behavior |

### Three Gates (Must Pass Before Shipping)

```bash
npm run test:summary      # Gate 1: 3,035+ tests, 0 failures
npm run verify:summary    # Gate 2: UNQUALIFIED audit opinion
npm run health            # Gate 3: tsc + tests + verify + doc harmony
```

### 7-Phase Verification Pipeline

1. Golden Scenarios (5 scenarios) — full GAAP identity validation
2. Hardcoded Detection — magic number scanner across finance files
3. Golden Values (269+ tests) — penny-exact hand-calculated verification
4. Reconciliation — bridge checks (Sources & Uses, NOI→FCF, BS balance)
5. Data Integrity — shared ownership, singleton uniqueness
6. Portfolio Dynamics — dynamic property count, fee zero-sum
7. Artifact Summary — final audit opinion

### Test Patterns

**Golden test:** Hand-calculate expected values, derive from constants:
```typescript
const H_REV = H_SOLD_ROOMS * H_ROOM_RATE; // 20,000
expect(m0.revenueRooms).toBeCloseTo(H_REV, 2);
```

**Factory:** `makeProperty()` / `makeGlobal()` with override-only pattern.

**Invariant:** `expect(result.gop).toBeCloseTo(revenue - expenses, 2);`

### New Tests for This Redesign

- `tests/proof/model-defaults.test.ts` — new columns exist, property creation reads from them
- `tests/engine/governed-fields.test.ts` — engine reads from entity, not constant
- `tests/proof/settings-elimination.test.ts` — `/settings` redirects, no imports from settings/

---

## 18. Replit Environment

### Workspace Configuration

```toml
# .replit (key sections)
modules = ["nodejs-20", "web", "javascript", "postgresql-16"]
run = "npm run dev"

[[ports]]
localPort = 5000
externalPort = 80

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["node", "./dist/index.cjs"]
```

Single port (5000→80). Express serves both API and SPA. Autoscale deployment (scales to zero when idle).

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run test:summary` | All tests |
| `npm run verify:summary` | GAAP verification |
| `npm run health` | Full health check |
| `npm run build` | Production build |

### Named Workflows (in Replit UI)

Project, Health Check, Run Tests, Verify Financials, Lint Check, Diff Summary, Codebase Stats, Quick Audit, Exports Check.

### Secrets (Replit Secrets Panel)

All API keys in Replit Secrets (encrypted AES-256). Never `.env` files. Key secrets: `DATABASE_URL`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `RESEND_API_KEY`, `GOOGLE_MAPS_API_KEY`, `ELEVENLABS_API_KEY` (kept for restoration).

### Database (PostgreSQL on Neon)

Serverless — sleeps after 5 minutes. Pool config handles reconnection (max 20, min 2, idle 60s, maxUses 7500). Migrations run automatically on startup. Schema managed via Drizzle ORM.

### Replit-Specific Gotchas

| Issue | Mitigation |
|-------|------------|
| HMR WebSocket drops | Full page refresh (F5) |
| Filetree lag (790+ files) | `node_modules`, `dist`, `.git` hidden in `.replit` |
| Neon 5-min sleep | Pool reconnection handles it |
| Autoscale cold starts (5-10s) | Acceptable for internal tool |
| Single port only | Express already serves everything on 5000 |
| 60s post-merge hook timeout | Keep post-merge script fast |

### Prompting Pattern for Replit Agent

```
Example prompt for Phase 2:
"Read .claude/plans/UX-REDESIGN-PLAN.md Section 5 (Model Defaults).
Read .claude/rules/ui-patterns.md and .claude/rules/architecture.md.
Create client/src/components/admin/ModelDefaultsTab.tsx with 3 sub-tabs.
Follow the pattern from PeopleTab.tsx. Use GlassButton, PageHeader,
CurrentThemeTab. Register in AdminSidebar.tsx under Business group."
```

Break work into focused prompts. One component per prompt. Verify after each.

---

## 19. Code Governance

### 19 Binding Rules (`.claude/rules/`)

| Rule | What It Enforces | Automated? |
|------|-----------------|------------|
| `architecture.md` | Tech stack, two-entity model, file organization | Manual |
| `audit-persona.md` | 7 audit dimensions, stop-the-line issues | `verify:summary` |
| `database-seeding.md` | Shared ownership, fill-only sync | `data-integrity.test.ts` |
| `design-standards.md` | Premium UI, animations, edge cases | Manual |
| `deterministic-tools.md` | 36 tools, schema parity, tests | `tool-registry.test.ts` |
| `documentation.md` | Doc hierarchy, harmony checks | `npm run health` |
| `domain-boundaries.md` | 6 domains, prohibited crossings | `domain-boundaries.test.ts` |
| `error-handling.md` | Structured logging, no empty catches | Manual |
| `exports.md` | 6 formats, placement, naming | Manual |
| `financial-engine.md` | Two-engine model, 6 GAAP rules | `verify:summary` |
| `mandatory-financial-tests.md` | 13 critical tests, stop-the-line | `operating-reserve-cash.test.ts` |
| `no-hardcoded-values.md` | Named constants, DB fallback | `hardcoded-detection.test.ts` |
| `portfolio-dynamics.md` | Shared ownership, dynamic count, fee zero-sum | `portfolio-dynamics.test.ts` |
| `recalculate-on-save.md` | `invalidateAllFinancialQueries` mandatory | `recalculation-enforcement.test.ts` |
| `research-precision.md` | Deterministic tools, admin config | `tool-registry.test.ts` |
| `security.md` | Auth, Zod validation, secrets, SQL injection | Manual |
| `session-startup.md` | Context loading, rule loading per task | Manual |
| `testing-strategy.md` | Test categories, golden patterns | Manual |
| `ui-patterns.md` | Button labels, accordions, entity cards, test IDs | Manual |

### Financial Change Protocol

1. **State** the relevant `.claude/skills/finance/` sub-skill
2. **Confirm** which rules and constants apply
3. **Identify** GAAP invariants that must hold (A=L+E, OCF reconciliation)
4. **Implement** the smallest safe change
5. **Run** `npm run test:file -- tests/engine/operating-reserve-cash.test.ts`
6. **Verify** `npm run verify:summary` → UNQUALIFIED
7. **Update** documentation (session-memory, skills, claude.md if needed)

### Automated Enforcement

| Test | What It Catches | Failure = |
|------|----------------|-----------|
| `hardcoded-detection.test.ts` | Magic numbers in finance code | ADVERSE |
| `data-integrity.test.ts` | Non-null userId on shared data | ADVERSE |
| `domain-boundaries.test.ts` | Prohibited cross-domain imports | ADVERSE |
| `recalculation-enforcement.test.ts` | Missing query invalidation | ADVERSE |
| `tool-registry.test.ts` | Tools missing schema/tests | ADVERSE |
| `rule-compliance.test.ts` | Doc harmony, shadow docs | ADVERSE |
| `operating-reserve-cash.test.ts` | Reserve/debt/refi math | **STOP** |
| `scenarios.test.ts` | 5 golden scenario GAAP identities | QUALIFIED |
| `portfolio-dynamics.test.ts` | Dynamic count, fee zero-sum | QUALIFIED |
| Golden tests (269+) | Hand-calculated values | ADVERSE |

**ADVERSE** = cannot ship. **STOP** = stop all work, fix immediately.

### Code Review Checklist

Before any commit:
- [ ] `npm run test:summary` passes
- [ ] `npm run verify:summary` shows UNQUALIFIED
- [ ] No hardcoded financial values
- [ ] `data-testid` on interactive elements
- [ ] No empty catch blocks (annotate with `/* ignore: reason */`)
- [ ] Component compliance (GlassButton, PageHeader, CurrentThemeTab)
- [ ] Button labels: "Save" (never "Update")
- [ ] Theme tokens used (no raw hex)
- [ ] Auth middleware on new routes
- [ ] Zod validation on request bodies

### Post-Redesign Constants Model

```
SEED VALUES (shared/constants.ts)
  └── Used ONLY to initialize DB on first deployment

DATABASE (globalAssumptions table)
  └── Source of truth for all defaults
  └── Admin edits via Model Defaults

ENTITY VALUES (properties table, company model)
  └── Copied from defaults at creation
  └── Owned by entity after save
  └── Changing a default does NOT affect existing entities
```

---

*This document is the complete specification for the UX redesign. It covers design, page specs, field migrations, database schema, code patterns, SDK usage, Replit environment, and governance. A developer working in Replit with no prior knowledge can build the correct implementation from this document. The companion document `.claude/plans/MARCELA-ISOLATION.md` should be executed first.*
