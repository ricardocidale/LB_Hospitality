# Hospitality Business Group — Business Simulation Portal

A comprehensive financial modeling, portfolio management, and business simulation platform for **Hospitality Business Group**, a boutique hotel management company operating across North America and Latin America. The portal generates GAAP-compliant monthly and yearly pro forma projections, income statements, balance sheets, cash flow statements, and investment return analyses for hospitality assets — all verified by an independent 1,330-test proof system with three-tier financial verification.

**Built and hosted entirely on [Replit](https://replit.com)** — from development through production deployment, including database, object storage, authentication, AI integrations, and continuous delivery.

---

## Table of Contents

- [What This Application Does](#what-this-application-does)
- [Business Model](#business-model)
- [Data Sources and Sources of Truth](#data-sources-and-sources-of-truth)
- [The Role of Replit](#the-role-of-replit)
- [Financial Engine](#financial-engine)
- [Calculation Methodology](#calculation-methodology)
- [Verification and Proof System](#verification-and-proof-system)
- [GAAP Standards Referenced](#gaap-standards-referenced)
- [Multi-Tenancy and Role-Based Access](#multi-tenancy-and-role-based-access)
- [AI Capabilities](#ai-capabilities)
- [Branding Architecture](#branding-architecture)
- [Admin Page Structure](#admin-page-structure)
- [Tech Stack](#tech-stack)
- [Codebase Overview](#codebase-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing and Quality](#testing-and-quality)

---

## What This Application Does

This portal is a **full business simulation** for a hospitality management company. It allows administrators, partners, financial checkers, and investors to:

- **Model hotel properties** with configurable assumptions — room count, ADR, occupancy curves, revenue shares, expense ratios, capital structure (full equity or financed), and exit scenarios.
- **Generate pro forma projections** spanning up to 30 years (360 months) of monthly financial data per property.
- **View consolidated financial statements** — Income Statements, Balance Sheets, and Cash Flow Statements — at both the individual property level and the aggregated portfolio level.
- **Analyze the management company** — revenue from management fees (base + incentive), staff costs, partner compensation, overhead, SAFE funding tranches, and company net income.
- **Run investment return analyses** — IRR (Internal Rate of Return), equity multiples, cash-on-cash returns, and sensitivity analysis across variables like occupancy, ADR growth, cap rates, and interest rates.
- **Compare scenarios** — create and compare alternate assumption sets side-by-side to evaluate different investment strategies.
- **Independently verify all calculations** — a three-tier proof system (server-side independent recalculation, client-side GAAP auditor, and AI-powered methodology review) produces audit opinions following standard audit language (Unqualified, Qualified, Adverse).
- **Manage branding and multi-tenancy** — each user group gets its own company name, logo, design theme, and asset descriptions, with a hierarchical resolution system.
- **Generate AI-powered content** — logos, property photos, and market research using Google's Gemini, OpenAI, and Anthropic Claude models through Replit's native AI integrations.
- **Export reports** — PDF, Excel (XLSX), and PowerPoint (PPTX) exports of financial statements, verification reports, and checker manuals.

Every financial number displayed on screen is the direct output of the financial engine — there is no mock data, no placeholder values, and no hardcoded assumptions in the rendering layer. What you see is what the math produces.

---

## Business Model

The system models **two distinct financial entities** linked by management fees:

```
┌──────────────────────────────────────┐
│        PROPERTY PORTFOLIO P&L        │
│                                      │
│  Revenue: Rooms + F&B + Events       │
│  Less: Operating Expenses            │
│  Less: Debt Service (financed)       │
│  = Free Cash Flow to Equity (FCFE)   │
└──────────────────┬───────────────────┘
                   │
                   │ Management Fees (5% base + 15% incentive on GOP)
                   ▼
┌──────────────────────────────────────┐
│       MANAGEMENT COMPANY P&L         │
│                                      │
│  Revenue: Mgmt Fees from all props   │
│  Less: Partners, Staff, Overhead     │
│  = Company Net Income                │
│  Funded by: SAFE tranches            │
└──────────────────────────────────────┘
```

### Property Lifecycle

Each property follows a four-phase lifecycle:

1. **Acquisition** — Purchase price + closing costs (2%) + operating reserve. Capital structure is either Full Equity or Financed (debt at 75% LTV default).
2. **Operations** — Revenue ramps from starting occupancy (55%) to stabilized max (85%) over a configurable period. Expenses follow USALI categories.
3. **Refinancing** — Financed properties can refinance (default: 3 years post-operations) based on appraised value. Net proceeds distribute to investors.
4. **Exit** — Properties are sold at end of projection period at cap-rate valuation. Net proceeds (after commission and debt payoff) determine final returns.

---

## Data Sources and Sources of Truth

Every number in the application traces back to an explicit, auditable source. There are **no hardcoded financial assumptions** in the rendering or business logic layers — all values flow from the sources below.

### Primary Data Sources

| Source | What It Contains | Where It Lives |
|--------|-----------------|----------------|
| **PostgreSQL Database** (Replit-managed) | All persistent state: properties, assumptions, users, companies, scenarios, logos, themes, activity logs, verification runs | `DATABASE_URL` — Replit's built-in Neon-backed PostgreSQL |
| **Drizzle ORM Schema** | The single schema definition for all 18 database tables | `shared/schema.ts` |
| **Global Assumptions Table** | Company-wide defaults: fee rates, expense ratios, occupancy targets, ADR growth, depreciation periods, staff FTEs, partner compensation | `global_assumptions` table in PostgreSQL |
| **Property Records** | Per-property overrides: room count, ADR, purchase price, capital structure, custom expense ratios, location, operating dates | `properties` table in PostgreSQL |
| **Named Constants** | Immutable system defaults and fallback values used when no database value exists | `client/src/lib/constants.ts` |
| **Replit Object Storage** | Uploaded images (logos, property photos), AI-generated images, exported documents | Replit's built-in Google Cloud Storage-backed object store |
| **Replit Secrets** | API keys and passwords — `ADMIN_PASSWORD`, `CHECKER_PASSWORD`, `REYNALDO_PASSWORD` | Replit's encrypted secret management |

### Source of Truth Hierarchy

The financial engine uses a strict three-tier fallback for every configurable value:

```
Property-Specific Value  →  Global Assumption  →  DEFAULT Constant
     (highest priority)      (company-wide)        (immutable fallback)
```

- If a property has a custom ADR, that value is used.
- If not, the global assumption's default ADR is used.
- If neither exists, the constant `DEFAULT_ADR` from `constants.ts` applies.

This hierarchy is enforced by the financial engine and verified by the proof system. Any violation is flagged as an audit finding.

### Database Tables (18 total)

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (admin, partner, checker, investor) |
| `sessions` | Express session storage for authentication |
| `companies` | SPV companies (one per property) |
| `properties` | Hotel properties with financial assumptions |
| `global_assumptions` | Company-wide default assumptions |
| `property_fee_categories` | Custom fee/expense categories per property |
| `scenarios` | Alternate assumption sets for comparison analysis |
| `logos` | Logo images with names, URLs, and company associations |
| `user_groups` | Multi-tenant groups with branding assignments |
| `design_themes` | UI themes (colors, typography, styling) |
| `asset_descriptions` | Configurable asset/property description templates |
| `login_logs` | Authentication audit trail |
| `activity_logs` | User activity tracking |
| `verification_runs` | Stored verification/audit results |
| `market_research` | AI-generated market research data |
| `prospective_properties` | Property finder search results |
| `saved_searches` | Saved property search configurations |
| `conversations` / `messages` | AI chat conversation history |

---

## The Role of Replit

This project is deeply integrated with Replit's platform. Replit is not just a host — it provides the core infrastructure that makes the application work:

### Development and Deployment

- **Replit Workspace** — The entire development environment runs on Replit. Code editing, terminal access, debugging, and preview are all within the Replit IDE.
- **Replit Deployments** — The application is published and served via Replit's deployment infrastructure with automatic TLS, health checks, and `.replit.app` domain.
- **Replit Agent** — An AI-powered development agent built into the workspace assists with code generation, debugging, refactoring, and feature development. The agent follows a structured skill and rule system (84 skill files, 18 rule files) stored in `.claude/` to maintain consistency across sessions.

### Database

- **Replit Database (PostgreSQL)** — The application uses Replit's built-in PostgreSQL database, powered by Neon. The `DATABASE_URL` is automatically configured. This provides:
  - Automatic provisioning and connection management
  - Point-in-time rollback capability through Replit checkpoints
  - No external database setup required

### Object Storage

- **Replit Object Storage** — All uploaded and AI-generated images (logos, property photos) are stored in Replit's built-in object storage (backed by Google Cloud Storage). Features include:
  - Presigned URL uploads for secure, direct-to-storage file transfers
  - Public and private storage directories
  - Automatic path management via `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR`

### AI Integrations

Replit provides native AI model integrations that handle API key management, billing, and rate limiting automatically — no external API keys required for:

- **Google Gemini** (`gemini-2.5-flash-image` / "Nano Banana") — Primary model for AI image generation (logos, property photos)
- **OpenAI** (`gpt-image-1`) — Fallback image generation model
- **Anthropic Claude** — AI-powered financial methodology review and market research
- **Google Gemini Pro** — Market research analysis and property valuation research

All three AI providers are accessed through Replit's AI Integrations layer, which handles authentication, secret rotation, and usage tracking via Replit credits.

### Authentication

- **Replit Auth** — The application supports "Log in with Replit" as an authentication method alongside traditional email/password login. Session management uses Express sessions stored in PostgreSQL.

### Secrets Management

- **Replit Secrets** — Sensitive values (`ADMIN_PASSWORD`, `CHECKER_PASSWORD`, `REYNALDO_PASSWORD`) are stored as encrypted secrets in Replit's secret management system, accessible as environment variables at runtime but never exposed in code or logs.

### Additional Integrations

The project has access to these Replit-managed integrations:

| Integration | Purpose |
|------------|---------|
| GitHub | Source control and repository management |
| Stripe | Payment processing infrastructure |
| Google Sheets / Docs / Drive / Calendar | Google Workspace connectivity |
| Google Mail | Email notifications |
| Twilio | SMS/communication capabilities |

---

## Financial Engine

The financial engine lives in `client/src/lib/financialEngine.ts` and generates monthly projections using a single-source architecture:

```
User Input (UI)
    │
    ▼
Global Assumptions (DB) + Property Data (DB)
    │
    ▼
financialEngine.ts → generatePropertyProForma()
    │
    ▼
MonthlyFinancials[] (up to 360 months of projections)
    │
    ├── Dashboard charts (aggregated portfolio view)
    ├── Property detail tables (individual analysis)
    ├── Company P&L (management company roll-up)
    ├── Balance sheet (consolidated view)
    └── Cash flow statement (GAAP indirect method)
```

All named constants are defined in a single source of truth: `client/src/lib/constants.ts`. The system uses a three-tier fallback: **property-specific value → global assumption → DEFAULT constant**.

Every save action in the application triggers a **full financial recalculation** — there is no partial cache invalidation. This ensures that every number displayed is always current and internally consistent.

---

## Calculation Methodology

### Revenue

| Stream | Formula | Default Share |
|--------|---------|---------------|
| Room Revenue | Room Count x ADR x Occupancy x 30.5 days | -- |
| Event Revenue | Room Revenue x Event Share x Catering Boost | 43% of room revenue |
| F&B Revenue | Room Revenue x F&B Share x Catering Boost | 22% of room revenue |
| Other Revenue | Room Revenue x Other Share | 7% of room revenue |

- **30.5 days/month** is an immutable industry standard (365 / 12)
- ADR grows annually at the configured growth rate (default 3%)
- Occupancy ramps over configurable months, then grows by step increments

### Operating Expenses (USALI Standard)

| Category | Default Rate | Basis |
|----------|-------------|-------|
| Room Department | 36% | Room Revenue |
| F&B Department | 15% | F&B Revenue |
| Events | 65% | Event Revenue |
| Admin & General | 8% | Total Revenue |
| Marketing | 5% | Total Revenue |
| Property Operations | 4% | Total Revenue |
| Utilities | 5% (60% variable / 40% fixed) | Total Revenue |
| Insurance | 2% | Total Revenue |
| Property Taxes | 3% | Total Revenue |
| IT Systems | 2% | Total Revenue |
| FF&E Reserve | 4% | Total Revenue |

### Profitability Waterfall

```
Total Revenue
  - Operating Expenses
  = Gross Operating Profit (GOP)
  - Management Fees (base + incentive)
  - FF&E Reserve
  = Net Operating Income (NOI)
  - Interest Expense
  - Depreciation (27.5-year straight-line per IRS Pub 946)
  = Net Income
```

### Debt Service

- **PMT formula**: `P x r x (1+r)^n / ((1+r)^n - 1)` — standard amortization
- Default: 75% LTV, 9% interest, 25-year amortization
- Each payment splits into interest (operating expense per ASC 470) and principal (financing activity)
- Refinancing uses a two-pass calculation: project NOI forward → appraise → new loan → re-amortize

### Cash Flow Statement (GAAP Indirect Method)

```
Net Income
  + Depreciation (non-cash add-back)
  = Operating Cash Flow                    [ASC 230]
  - Capital Expenditures
  = Free Cash Flow (FCF)
  - Principal Payments                     [ASC 470 — financing activity]
  = Free Cash Flow to Equity (FCFE)
```

### Balance Sheet

```
Assets = Liabilities + Equity             [FASB Conceptual Framework]

Assets:      Purchase Price + Improvements - Accumulated Depreciation + Cash
Liabilities: Outstanding Loan Balance (after principal payments / refinancing)
Equity:      Initial Equity + Retained Earnings
```

Verified every month across every property — any imbalance triggers a critical audit finding.

---

## Verification and Proof System

The system provides **independent three-tier verification** of all financial calculations, backed by **1,330 automated tests** across 59 test files.

### Tier 1: Server-Side Independent Recalculation

`server/calculationChecker.ts` reimplements all financial math from scratch — it does **not** import from the client-side engine. This ensures true independence. Approximately 18 checks per property plus company and consolidated checks, covering:

- Revenue calculations (ASC 606)
- Depreciation (ASC 360)
- Loan amortization and interest/principal split (ASC 470)
- Balance sheet equation (FASB)
- Cash flow classification (ASC 230)
- NOI margin reasonableness (industry benchmarks)

### Tier 2: Client-Side GAAP Auditor

Three client-side modules run in the browser:

| Module | Purpose |
|--------|---------|
| `financialAuditor.ts` | GAAP audit with ASC references for each property |
| `formulaChecker.ts` | Mathematical relationship validation (GOP = Rev - OpEx, etc.) |
| `gaapComplianceChecker.ts` | Cash flow classification and compliance checks |

### Tier 3: AI-Powered Methodology Review

An optional LLM review (Anthropic Claude, OpenAI, or Google Gemini — via Replit AI Integrations) analyzes the full verification report for methodology issues, streamed via SSE.

### Audit Opinions

| Opinion | Criteria |
|---------|----------|
| **UNQUALIFIED** | 0 critical, 0 material issues — clean opinion |
| **QUALIFIED** | 0 critical, some material issues — minor discrepancies |
| **ADVERSE** | Any critical issues — significant errors found |

Tolerance: 1% variance allowed for floating-point comparison.

### Calculation Transparency

Two toggles in **Settings > Other** control whether formula explanations (? tooltip icons beside each line item) are visible:

- `showCompanyCalculationDetails` — Management Company reports
- `showPropertyCalculationDetails` — Property reports

When ON (default), every financial line item shows a help icon explaining its formula and meaning. When OFF, the view is clean and investor-ready.

---

## GAAP Standards Referenced

| Standard | Topic | Application |
|----------|-------|-------------|
| ASC 230 | Statement of Cash Flows | Indirect method, operating/investing/financing classification |
| ASC 360 | Property, Plant & Equipment | 27.5-year straight-line depreciation, asset valuation |
| ASC 470 | Debt | Loan amortization, interest/principal separation |
| ASC 606 | Revenue Recognition | Revenue timing and calculation verification |
| USALI | Uniform System of Accounts for Lodging | Hospitality-specific expense categorization |
| FASB Conceptual Framework | General | Balance sheet equation, double-entry integrity |

---

## Multi-Tenancy and Role-Based Access

The application supports multiple user groups, each with its own branding and access level.

### User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full access — all pages, Administration panel, user management, system configuration |
| **Partner** | Management-level — Dashboard, Properties, Company, Settings, Reports (no Administration) |
| **Checker** | Financial verification — same as Partner, plus access to verification tools and checker manual |
| **Investor** | Limited view — Dashboard, Properties, Profile, Help only |

### User Groups

User Groups define multi-tenant branding: each group gets a `companyName`, `logoId`, `themeId`, and `assetDescriptionId`. Users inherit branding from their assigned group. Admins manage branding at the group level — there are no per-user branding overrides.

---

## AI Capabilities

All AI features use Replit's native AI Integrations — no external API keys required.

### Image Generation

- **Primary model:** Nano Banana (`gemini-2.5-flash-image`) via Google Gemini — fast, high-quality image generation
- **Fallback model:** OpenAI `gpt-image-1`
- **Reusable component:** `AIImagePicker` supports three modes: file upload, AI prompt generation, and manual URL input
- **Use cases:** Logo creation, property photo generation, branding assets
- **Server endpoint:** `POST /api/generate-property-image` — generates image, uploads to Replit Object Storage, returns the object path

### Market Research

AI-powered market research analysis for property markets, using multi-provider LLM access (Anthropic Claude, Google Gemini, OpenAI) via Replit's AI Integrations.

### Financial Methodology Review

Optional AI analysis of verification reports to flag potential methodology issues beyond what automated checks cover.

### AnimatedLogo

Logos are rendered through an SVG wrapper component (`AnimatedLogo`) that converts raster images into vector-like elements supporting scaling and animations (pulse, glow, spin, bounce).

---

## Branding Architecture

Branding resolution follows a strict hierarchy:

```
User → User Group → Default
```

- **Design Themes** are standalone entities (not user-owned). Each has an `isDefault` flag.
- **User Groups** define company branding: `companyName`, `logoId`, `themeId`, `assetDescriptionId`.
- **Users** inherit branding from their assigned User Group.
- **Admin** manages branding at the group level — there are no per-user overrides.

---

## Admin Page Structure

The Administration page (`/admin`) is organized into these tabs:

| Tab | Purpose |
|-----|---------|
| **Users** | Create, edit, delete users; manage roles and passwords |
| **Companies** | Manage SPV companies for individual properties |
| **Activity** | View user activity logs and audit trail |
| **Verification** | Run and view financial verification results |
| **User Groups** | Manage multi-tenant groups with branding assignments |
| **Logos** | Upload, AI-generate, or URL-import logo images |
| **Branding** | View branding configuration summary |
| **Themes** | Manage design themes (colors, typography) |
| **Navigation** | Configure sidebar navigation visibility |
| **Database** | Database management and diagnostics |

---

## Tech Stack

| Layer | Technology | Provided By |
|-------|-----------|-------------|
| Frontend | React 18 + TypeScript, Wouter, TanStack Query, shadcn/ui, Tailwind CSS, Recharts, Three.js | -- |
| Backend | Node.js + Express 5, TypeScript ESM | -- |
| Database | PostgreSQL (Neon-backed) with Drizzle ORM | **Replit** |
| Object Storage | Google Cloud Storage (presigned URL uploads) | **Replit** |
| AI Image Generation | Gemini (`gemini-2.5-flash-image`), OpenAI (`gpt-image-1`) | **Replit AI Integrations** |
| AI Text/Analysis | Anthropic Claude, Google Gemini Pro, OpenAI GPT | **Replit AI Integrations** |
| Authentication | Express sessions + Replit Auth (OpenID Connect) | **Replit** |
| Secrets Management | Encrypted environment secrets | **Replit** |
| Build | Vite (client), esbuild (server) | -- |
| Deployment | Automatic TLS, health checks, `.replit.app` domain | **Replit Deployments** |
| Development | AI-assisted coding agent with persistent memory | **Replit Agent** |
| Exports | jsPDF, xlsx, pptxgenjs | -- |

---

## Codebase Overview

```
284 source files  |  63,035 lines of code  |  1,330 tests  |  18 rules  |  84 skills

shared/
  schema.ts                           # Drizzle ORM schema — single source of truth for all 18 tables

client/src/
  pages/
    Dashboard.tsx                     # Portfolio overview — charts, KPIs, consolidated statements
    PropertyDetail.tsx                # Individual property financial analysis
    Company.tsx                       # Management company P&L and projections
    CompanyAssumptions.tsx            # Global model configuration
    PropertyEdit.tsx                  # Property-level assumption editing
    FinancingAnalysis.tsx             # Loan and refinancing analysis
    SensitivityAnalysis.tsx           # Multi-variable sensitivity tables
    Methodology.tsx                   # Calculation methodology documentation
    Admin.tsx                         # Administration — users, companies, branding, verification
    Settings.tsx                      # User preferences and calculation transparency
    Help.tsx                          # In-app help and documentation
  lib/
    financialEngine.ts                # Core financial calculation engine
    constants.ts                      # All named constants and defaults
    loanCalculations.ts               # Loan amortization and refinance logic
    financialAuditor.ts               # Client-side GAAP audit engine
    formulaChecker.ts                 # Mathematical relationship validation
    gaapComplianceChecker.ts          # Cash flow compliance checks
    cashFlowSections.ts               # Cash flow statement section builder
    runVerification.ts                # Verification orchestrator
  components/
    ui/                               # Reusable UI components (60+ files)
      ai-image-picker.tsx             # Generic AI image picker (upload + generate + URL)
      animated-logo.tsx               # SVG logo wrapper with animation support
      help-tooltip.tsx                # Financial line item explanation tooltips
      status-badge.tsx                # Status indicator with animation
      image-preview-card.tsx          # Image card with overlay actions
      entity-card.tsx                 # Reusable entity card system
      financial-chart.tsx             # Configurable financial charts
    financial-table-rows.tsx          # Composable financial statement row primitives
    FinancialStatement.tsx            # Monthly pro forma table
    YearlyIncomeStatement.tsx         # Annual income statement
    YearlyCashFlowStatement.tsx       # Annual cash flow statement
    ConsolidatedBalanceSheet.tsx       # Balance sheet view
  features/
    property-images/                  # Property image picker (wraps AIImagePicker)
  hooks/
    use-upload.ts                     # Presigned URL file upload hook
    use-auth.ts                       # Authentication state hook

server/
  routes.ts                           # Express API routes (120+ endpoints)
  storage.ts                          # Database access layer (IStorage interface)
  auth.ts                             # Authentication & session management
  calculationChecker.ts               # Independent server-side verification engine
  seed.ts                             # Database seeding with sample properties
  replit_integrations/
    image/client.ts                   # AI image generation (Nano Banana + OpenAI fallback)

calc/                                 # Standalone calculation modules (57 files)
  analysis/                           # Portfolio consolidation and scenario comparison
  returns/                            # IRR vector and return calculations
  validation/                         # Cross-calculator validation and reconciliation
  shared/                             # Shared calculation utilities

.claude/                              # Agent knowledge base
  rules/                              # 18 rule files governing code quality and conventions
  skills/                             # 84 skill files for specialized task guidance
  manuals/                            # Checker manual and user manual
  tools/                              # Tool schemas for financial analysis
  commands/                           # Slash commands for common operations
```

---

## Getting Started

This application is designed to run on Replit. To get started:

```bash
# Install dependencies
npm install

# Start development server (port 5000)
npm run dev

# Seed database with sample data
npx tsx server/seed.ts

# Force re-seed (clears existing properties & assumptions)
npx tsx server/seed.ts --force

# Push schema changes to database
npx drizzle-kit push
```

### Quick Commands

```bash
npm run health         # TypeScript + tests + verification in one shot
npm run test:summary   # Run all 1,330 tests (1-line output on pass)
npm run verify:summary # 4-phase financial verification (compact output)
npm run lint:summary   # TypeScript type checking
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

---

## Environment Variables

| Variable | Purpose | Managed By |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Replit (auto-configured) |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Individual database connection parameters | Replit (auto-configured) |
| `ADMIN_PASSWORD` | Admin user password | Replit Secrets |
| `CHECKER_PASSWORD` | Checker/verifier user password | Replit Secrets |
| `REYNALDO_PASSWORD` | Additional user password | Replit Secrets |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Object storage public asset paths | Replit Object Storage |
| `PRIVATE_OBJECT_DIR` | Object storage private directory | Replit Object Storage |
| `REPLIT_DB_URL` | Replit key-value store URL | Replit (auto-configured) |
| `REPL_ID` | Replit workspace identifier | Replit (auto-configured) |

No external API keys are required for AI features — Replit's AI Integrations handle authentication and billing through Replit credits.

---

## Testing and Quality

| Metric | Value |
|--------|-------|
| **Total Tests** | 1,330 across 59 test files |
| **Test Coverage** | Revenue, expenses, depreciation, loan amortization, balance sheet, cash flow, management fees, scenarios, refinancing, IRR, sensitivity analysis |
| **Verification Opinion** | UNQUALIFIED (clean — 0 critical, 0 material issues) |
| **TypeScript** | Strict mode, 0 errors |
| **Source Files** | 284 files, 63,035 lines |
| **Rules** | 18 rule files governing code quality, financial accuracy, UI patterns, and conventions |
| **Skills** | 84 skill files providing specialized guidance for finance, UI, testing, exports, and architecture |

The proof system runs automatically and can be triggered manually via `npm run verify`. Every financial calculation is independently verified by both the server-side checker and client-side auditor before an audit opinion is issued.

---

*Built with Replit — from first line of code to production deployment.*
