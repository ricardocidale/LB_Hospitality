# 01 — Application Overview

## L+B Hospitality Group Business Simulation Portal

The L+B Hospitality Group Business Simulation Portal is a full-stack financial modeling platform purpose-built for a boutique hotel management company. It enables real-time financial simulation, multi-year projection, and scenario analysis for hospitality business planning across a portfolio of luxury boutique hotels in North America and Latin America.

---

## Two-Entity Architecture

The model is structured around two distinct legal entity types, consistent with standard real estate private equity fund structures:

| Entity | Legal Form | Role | Financial Statements |
|--------|-----------|------|---------------------|
| **Management Company** | Operating company (OpCo) | Provides hotel management services; earns fees | Income Statement, Cash Flow Statement |
| **Property SPVs** | Special Purpose Vehicles | Each property is an independent SPV holding a single asset | Income Statement (USALI-aligned), Cash Flow Statement, Balance Sheet, FCF, IRR |

The Management Company does **not** own property. Properties are held in SPVs and pay management fees to the Management Company. This separation follows industry-standard asset-light management structures (per ASC 606 revenue recognition for service contracts).

> **Cross-reference:** See `formulas/company-financials.md` for Management Company fee calculations and `formulas/property-financials.md` for property-level P&L formulas.

---

## Purpose

| Capability | Description |
|-----------|-------------|
| Financial Simulation | Monthly granularity across 10-year (configurable) projection horizon; USALI-aligned income statements, GAAP-compliant balance sheets |
| Projection | ADR growth, occupancy ramp, inflation escalation, debt amortization, refinancing events |
| Scenario Analysis | Save/load complete model snapshots; compare base case vs. alternatives side-by-side |
| Sensitivity Analysis | Vary key inputs (ADR, occupancy, cap rate, LTV) and observe impact on IRR, NOI, FCF |
| Financing Analysis | Model acquisition debt, refinancing, loan comparison, DSCR, debt yield |
| Investment Returns | Levered/unlevered IRR, equity multiple, cash-on-cash return, FCF waterfall |

---

## Target Market

Luxury boutique hotels on private estates, typically characterized by:

- 10–80 guest rooms (per configurable boutique definition)
- Full-service food & beverage (F&B) operations
- Event and catering revenue streams (weddings, corporate retreats, wellness programs)
- Independent ownership (not chain-affiliated)
- Markets: North America and Latin America

---

## Navigation Sections

The application is organized into the following primary navigation areas:

| Section | Path | Purpose |
|---------|------|---------|
| **Dashboard** | `/` | Portfolio KPIs, aggregated financials, charts, performance summary |
| **Properties** | `/portfolio` | List of all property SPVs; click through to individual property detail and financials |
| **Management Co.** | `/company` | Management Company income statement, cash flow, fee revenue breakdown |
| **Property Finder** | `/property-finder` | Search and save prospective acquisition targets from external listing data |
| **Sensitivity Analysis** | `/sensitivity` | Multi-variable sensitivity tables; IRR/NOI/FCF impact matrices |
| **Financing Analysis** | `/financing` | Loan comparison, DSCR analysis, debt yield, refinance modeling |
| **Systemwide Assumptions** | `/settings` | Global model parameters affecting all entities (inflation, fees, SAFE funding, staffing, costs) |
| **My Profile** | `/profile` | User account settings, display preferences |
| **My Scenarios** | `/scenarios` | Saved model snapshots; create, load, compare, delete scenarios |
| **Administration** | `/admin` | User management, login logs, system configuration (admin role only) |
| **Methodology** | `/methodology` | Documentation of financial methodology, formulas, and GAAP/USALI references |

---

## Calculation Architecture

All financial calculations execute **client-side** in the browser using a deterministic financial engine (`client/src/lib/financialEngine.ts`). Key architectural principles:

| Principle | Implementation |
|-----------|---------------|
| **No hardcoded values** | Every financial parameter is configurable via assumptions (global or property-level) |
| **Centralized constants as fallbacks only** | Default values are defined in `shared/constants.ts` and re-exported via `client/src/lib/constants.ts`; they serve as fallbacks when no user-configured value exists |
| **Fallback chain** | Property value → Global assumption → DEFAULT constant |
| **Deterministic** | Same inputs always produce identical outputs; no server-side computation for financial projections |
| **Monthly granularity** | All projections computed at monthly resolution, then aggregated to annual for presentation |
| **Real-time recalculation** | Changing any assumption instantly recalculates all dependent financial statements |

> **Cross-reference:** See `formulas/property-financials.md` §1 for the complete monthly computation pipeline and `formulas/company-financials.md` §1 for the Management Company computation pipeline.

---

## Data Export

Every data page in the application supports export functionality:

| Format | Content | Use Case |
|--------|---------|----------|
| **Excel (.xlsx)** | Multi-sheet workbook with formatted financial statements, assumptions, and summary data | Offline analysis, audit trail, investor presentations |
| **CSV (.csv)** | Raw tabular data | Data pipeline integration, spreadsheet import |

The checker should use exports extensively to verify calculations offline against independent spreadsheet models. Export is available from the toolbar on Dashboard, Property Detail, Management Company, Sensitivity Analysis, and Financing Analysis pages.

---

## Verification Note for Checkers

When verifying the application:

1. Start by reviewing global assumptions on the Settings page — these drive every downstream calculation.
2. Compare exported Excel/CSV data against the on-screen presentation to confirm rendering accuracy.
3. Use the Sensitivity Analysis page to stress-test edge cases (zero occupancy, extreme ADR, 100% LTV).
4. Cross-check Management Company fee revenue against the corresponding fee expense on each property's income statement.
5. Verify that the Balance Sheet equation holds: **Assets = Liabilities + Equity** for every property in every period.

> **Cross-reference:** See `skills/15-testing-methodology.md` for the complete verification protocol and `tools/` directory for automated constraint checks.
