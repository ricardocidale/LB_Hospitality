# L+B Hospitality Group — Business Simulation Portal

A financial modeling and portfolio management portal for L+B Hospitality Group, a boutique hotel management company. Generates monthly and yearly pro forma projections, income statements, balance sheets, and cash flow statements for hospitality assets across North America and Latin America — with independent GAAP-compliant financial verification.

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

## Calculation Methodology

### Revenue

| Stream | Formula | Default Share |
|--------|---------|---------------|
| Room Revenue | Room Count × ADR × Occupancy × 30.5 days | — |
| Event Revenue | Room Revenue × Event Share × Catering Boost | 43% of room revenue |
| F&B Revenue | Room Revenue × F&B Share × Catering Boost | 22% of room revenue |
| Other Revenue | Room Revenue × Other Share | 7% of room revenue |

- **30.5 days/month** is an immutable industry standard (365 ÷ 12)
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
  − Operating Expenses
  = Gross Operating Profit (GOP)
  − Management Fees (base + incentive)
  − FF&E Reserve
  = Net Operating Income (NOI)
  − Interest Expense
  − Depreciation (27.5-year straight-line per IRS Pub 946)
  = Net Income
```

### Debt Service

- **PMT formula**: `P × r × (1+r)^n / ((1+r)^n - 1)` — standard amortization
- Default: 75% LTV, 9% interest, 25-year amortization
- Each payment splits into interest (operating expense per ASC 470) and principal (financing activity)
- Refinancing uses a two-pass calculation: project NOI forward → appraise → new loan → re-amortize

### Cash Flow Statement (GAAP Indirect Method)

```
Net Income
  + Depreciation (non-cash add-back)
  = Operating Cash Flow                    [ASC 230]
  − Capital Expenditures
  = Free Cash Flow (FCF)
  − Principal Payments                     [ASC 470 — financing activity]
  = Free Cash Flow to Equity (FCFE)
```

### Balance Sheet

```
Assets = Liabilities + Equity             [FASB Conceptual Framework]

Assets:      Purchase Price + Improvements − Accumulated Depreciation + Cash
Liabilities: Outstanding Loan Balance (after principal payments / refinancing)
Equity:      Initial Equity + Retained Earnings
```

Verified every month across every property — any imbalance triggers a critical audit finding.

## Verification System

The system provides **independent three-tier verification** of all financial calculations:

### 1. Server-Side Independent Recalculation

`server/calculationChecker.ts` reimplements all financial math from scratch — it does **not** import from the client-side engine. This ensures true independence. Approximately 18 checks per property plus company and consolidated checks, covering:

- Revenue calculations (ASC 606)
- Depreciation (ASC 360)
- Loan amortization and interest/principal split (ASC 470)
- Balance sheet equation (FASB)
- Cash flow classification (ASC 230)
- NOI margin reasonableness (industry benchmarks)

### 2. Client-Side GAAP Auditor

Three client-side modules run in the browser:

| Module | Purpose |
|--------|---------|
| `financialAuditor.ts` | GAAP audit with ASC references for each property |
| `formulaChecker.ts` | Mathematical relationship validation (GOP = Rev − OpEx, etc.) |
| `gaapComplianceChecker.ts` | Cash flow classification and compliance checks |

### 3. AI-Powered Methodology Review

An optional LLM review (Anthropic Claude, OpenAI, or Google Gemini) analyzes the full verification report for methodology issues, streamed via SSE.

### Audit Opinions

| Opinion | Criteria |
|---------|----------|
| **UNQUALIFIED** | 0 critical, 0 material issues — clean opinion |
| **QUALIFIED** | 0 critical, some material issues — minor discrepancies |
| **ADVERSE** | Any critical issues — significant errors found |

Tolerance: 1% variance allowed for floating-point comparison.

## GAAP Standards Referenced

| Standard | Topic | Application |
|----------|-------|-------------|
| ASC 230 | Statement of Cash Flows | Indirect method, operating/investing/financing classification |
| ASC 360 | Property, Plant & Equipment | 27.5-year straight-line depreciation, asset valuation |
| ASC 470 | Debt | Loan amortization, interest/principal separation |
| ASC 606 | Revenue Recognition | Revenue timing and calculation verification |
| USALI | Uniform System of Accounts for Lodging | Hospitality-specific expense categorization |
| FASB Conceptual Framework | General | Balance sheet equation, double-entry integrity |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Wouter, TanStack Query, shadcn/ui, Tailwind CSS v4, Recharts |
| Backend | Node.js + Express 5, TypeScript ESM |
| Database | PostgreSQL with Drizzle ORM |
| Build | Vite (client), esbuild (server) |
| AI | Multi-provider (OpenAI, Anthropic Claude, Google Gemini) for market research |

## Getting Started

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

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Admin user password (required) |
| `CHECKER_PASSWORD` | Checker/verifier user password (required) |
| `DATABASE_URL` | PostgreSQL connection string (auto-configured) |

## Project Structure

```
shared/schema.ts                  # Drizzle ORM schema (single source of truth)
client/src/
  pages/                          # React page components
    Dashboard.tsx                 # Portfolio overview with charts and KPIs
    PropertyDetail.tsx            # Individual property financial analysis
    Company.tsx                   # Management company P&L and projections
    CompanyAssumptions.tsx        # Global model configuration
    PropertyEdit.tsx              # Property-level assumption editing
    Methodology.tsx               # Calculation methodology documentation
    Admin.tsx                     # User management, verification, login logs
  lib/
    financialEngine.ts            # Core financial calculation engine
    constants.ts                  # All named constants and defaults
    loanCalculations.ts           # Loan amortization and refinance logic
    financialAuditor.ts           # Client-side GAAP audit engine
    runVerification.ts            # Verification orchestrator
  components/                     # Shared UI components
server/
  routes.ts                       # Express API routes
  storage.ts                      # Database access layer (IStorage interface)
  auth.ts                         # Authentication & session management
  calculationChecker.ts           # Independent server-side verification
  seed.ts                         # Database seeding script
```
