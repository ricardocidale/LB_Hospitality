# 03 — Property Portfolio

## Overview

Each property in the L+B Hospitality portfolio is modeled as an independent **Special Purpose Vehicle (SPV)** — a single-asset entity consistent with standard real estate private equity fund structures (per ASC 810 / GAAP consolidation guidance). Every SPV produces its own complete set of financial statements, enabling both individual property analysis and aggregated portfolio reporting.

The portfolio targets luxury boutique hotels in North America and Latin America, with properties characterized by intimate scale (10–80 rooms), full-service F&B, and event/catering revenue streams.

> **Cross-reference:** See `formulas/property-financials.md` for all property-level financial formulas and `formulas/consolidated.md` for portfolio aggregation methodology.

---

## Financial Statements per SPV

Each property SPV produces the following GAAP/USALI-aligned financial statements:

| Statement | Standard | Granularity | Key Outputs |
|-----------|----------|-------------|-------------|
| **Income Statement** | USALI 12th Ed. | Monthly → Annual | Room Revenue, F&B Revenue, Event Revenue, GOP, NOI, Net Income |
| **Cash Flow Statement** | ASC 230 | Monthly → Annual | Operating CF, Investing CF, Financing CF, Net Cash Flow |
| **Balance Sheet** | ASC 210 | Monthly → Annual | Total Assets, Total Liabilities, Total Equity (must balance) |
| **Free Cash Flow (FCF)** | Industry standard | Annual | Unlevered FCF, Levered FCF, Cumulative FCF |
| **IRR Analysis** | Industry standard | Over hold period | Levered IRR, Unlevered IRR, Equity Multiple, Cash-on-Cash |

> **Cross-reference:** See `formulas/dcf-fcf-irr.md` for FCF and IRR calculation formulas.

---

## Seed Properties

The model ships with five seeded properties representing the initial target portfolio:

| Property | Location | Market | Rooms | Starting ADR | Purchase Price | Building Improvements | Financing Type | Ops Start |
|----------|----------|--------|-------|-------------|---------------|----------------------|---------------|-----------|
| **The Hudson Estate** | Upstate New York | North America | 20 | $330 | $2,300,000 | $800,000 | Full Equity (Refi planned) | 2026-12-01 |
| **Eden Summit Lodge** | Eden, Utah | North America | 20 | $390 | $2,300,000 | $800,000 | Full Equity (Refi planned) | 2027-07-01 |
| **Austin Hillside** | Austin, Texas | North America | 20 | $270 | $2,300,000 | $800,000 | Full Equity (Refi planned) | 2028-01-01 |
| **Casa Medellín** | Medellín, Colombia | Latin America | 30 | $180 | $3,500,000 | $800,000 | Financed (75% LTV) | 2028-07-01 |
| **Blue Ridge Manor** | Asheville, North Carolina | North America | 30 | $342 | $3,500,000 | $800,000 | Financed (75% LTV) | 2028-07-01 |

All seed properties share common assumptions unless overridden:

| Parameter | Shared Default |
|-----------|---------------|
| ADR Growth Rate | 2.5% (4.0% for Casa Medellín — emerging market premium) |
| Starting Occupancy | 60% |
| Max Occupancy | 90% |
| Occupancy Growth Step | 5% per ramp period |
| Occupancy Ramp Months | 6 months between steps |
| Stabilization Period | 36 months |
| Pre-Opening Costs | $150,000 |
| Operating Reserve | $200,000 |
| Exit Cap Rate | 8.5% |
| Tax Rate | 25% |

---

## Acquisition Structures

Properties can be acquired under two capital structures:

| Structure | Description | Key Fields | Equity Required |
|-----------|-------------|-----------|----------------|
| **Full Equity** | 100% cash purchase; no acquisition debt | `type = "Full Equity"` | 100% of Total Project Cost |
| **Financed** | Debt + equity; constrained by LTV | `type = "Financed"`, `acquisitionLTV`, `acquisitionInterestRate`, `acquisitionTermYears` | (1 − LTV) × Total Project Cost |

**Total Project Cost** = Purchase Price + Building Improvements + Pre-Opening Costs + Operating Reserve + Closing Costs

For financed acquisitions:
- Loan Amount = LTV × (Purchase Price + Building Improvements)
- Monthly debt service is calculated using standard amortization (PMT function)
- Closing costs = `acquisitionClosingCostRate` × Loan Amount

> **Cross-reference:** See `formulas/funding-financing-refi.md` §2 for acquisition financing formulas.

---

## Refinancing

Properties acquired with Full Equity may be refinanced after a stabilization period to return capital to investors:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `willRefinance` | "Yes" / "No" | Whether the property will pursue refinancing |
| `refinanceDate` | Varies by property | Target date for refinance (typically 3 years post-ops start) |
| `refinanceLTV` | 75% (from global `debtAssumptions.refiLTV`) | Loan-to-value ratio at refinance |
| `refinanceInterestRate` | 9% (from global `debtAssumptions.interestRate`) | Interest rate on refinance loan |
| `refinanceTermYears` | 25 years | Amortization period for refinance loan |
| `refinanceClosingCostRate` | 3% | Closing costs as % of new loan amount |

At refinance:
1. Property is appraised (using trailing 12-month NOI ÷ cap rate)
2. New loan sized at `refinanceLTV × appraised value`
3. Existing debt (if any) is paid off from refinance proceeds
4. Net refinance proceeds are distributed to equity investors
5. New debt service begins from the refinance date forward

> **Cross-reference:** See `formulas/funding-financing-refi.md` §3 for refinance calculation formulas.

---

## Exit / Disposition

At the end of the projection horizon (default: Year 10), each property is assumed to be sold. Exit valuation uses the **direct capitalization method**:

| Calculation | Formula |
|-------------|---------|
| Terminal Value | Stabilized NOI ÷ `exitCapRate` |
| Less: Sales Commission | Terminal Value × `salesCommissionRate` (default 5%) |
| Less: Outstanding Debt | Remaining loan balance at exit |
| Less: Capital Gains Tax | (Terminal Value − Adjusted Basis) × `taxRate` |
| **Net Exit Proceeds** | Terminal Value − Commission − Debt Payoff − Tax |

Net exit proceeds flow to equity investors and are included in the IRR calculation.

> **Cross-reference:** See `formulas/dcf-fcf-irr.md` §3 for exit valuation and IRR formulas.

---

## Investor Return Waterfall

Equity investors receive returns through three channels over the hold period:

| Channel | Timing | Source |
|---------|--------|--------|
| **1. FCF Distributions** | Ongoing (after debt service) | Levered Free Cash Flow from operations |
| **2. Refinancing Proceeds** | At refinance event | Net proceeds after debt payoff and closing costs |
| **3. Exit Proceeds** | At disposition (Year 10) | Net sale proceeds after commission, debt payoff, and taxes |

The IRR calculation incorporates all three cash flow streams against the initial equity investment to produce the levered internal rate of return.

---

## Portfolio Aggregation

The system produces both individual SPV financials and consolidated portfolio views:

| View | Aggregation Method | Available On |
|------|-------------------|-------------|
| **Individual Property** | Single SPV | Property Detail page |
| **Portfolio Summary** | Sum of all SPV line items | Dashboard, Portfolio page |
| **Consolidated Balance Sheet** | Sum of all SPV balance sheets | Dashboard |
| **Portfolio IRR** | Aggregate equity-weighted IRR | Dashboard |

> **Cross-reference:** See `formulas/consolidated.md` for portfolio aggregation rules and inter-entity eliminations.

---

## Checker Verification Points

| Check | What to Verify |
|-------|---------------|
| Balance Sheet equation | Assets = Liabilities + Equity for every property, every period |
| Acquisition cost | Total Project Cost = Purchase Price + Improvements + Pre-Opening + Reserve + Closing Costs |
| Debt sizing | Loan Amount ≤ LTV × (Purchase Price + Building Improvements) |
| Fee expenses | Each property's management fee expense matches the global fee rates × its revenue/GOP |
| Refinance proceeds | Net proceeds = New Loan − Old Debt Payoff − Closing Costs |
| Exit valuation | Terminal Value = Trailing NOI ÷ Exit Cap Rate |
| IRR inputs | Initial equity outflow + periodic FCF + refi proceeds + exit proceeds |
| Portfolio totals | Sum of individual SPV line items = consolidated portfolio figures |
