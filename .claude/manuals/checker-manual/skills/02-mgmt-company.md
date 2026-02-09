# 02 — Management Company Entity

## Overview

The Management Company (referred to as "Hospitality Business Company" in the default configuration) is a **hospitality management services company**. It is **not** a property owner or real estate holding company. Its business model follows the asset-light hotel management paradigm common among independent hospitality operators (per AHLA industry classification).

The Management Company earns revenue exclusively from management fees charged to the property SPVs it manages. It does not hold real property on its balance sheet, does not earn room revenue, and does not directly operate hotel departments.

> **Cross-reference:** See `formulas/company-financials.md` for all Management Company calculation formulas.

---

## Revenue Model — Management Fees

The Management Company's sole revenue source is management fees, structured as two components consistent with standard Hotel Management Agreement (HMA) terms:

| Fee Type | Calculation Basis | Default Rate | USALI Classification |
|----------|------------------|-------------|---------------------|
| **Base Management Fee** | Percentage of property **Total Revenue** | 5% | Management Fee — Base (USALI Schedule 1) |
| **Incentive Management Fee** | Percentage of property **Gross Operating Profit (GOP)** | 15% | Management Fee — Incentive (USALI Schedule 1) |

**Key rules:**

- Fees are calculated **per property, per month** based on that property's operating results
- Fees are only charged for months when the property is **operational** (post `operationsStartDate`)
- The Incentive Management Fee is only earned when GOP is **positive** (negative GOP → $0 incentive fee)
- Both fee rates are configurable as global assumptions on the Settings page

> **Cross-reference:** See `formulas/property-financials.md` §5 for the property-side fee expense calculation and `formulas/company-financials.md` §1 for the company-side fee revenue aggregation.

---

## Fee Linkage — Dual-Entry Flow

Management fees create a **dual-entry linkage** between the two entity types. This is the most critical cross-entity validation point for the checker:

| Flow Direction | Entity | Line Item | Classification |
|---------------|--------|-----------|---------------|
| **Property → Management Co.** | Property SPV | Management Fee Expense (Base) | Operating Expense (below GOP line per USALI) |
| **Property → Management Co.** | Property SPV | Management Fee Expense (Incentive) | Operating Expense (below GOP line per USALI) |
| **Management Co. ← Property** | Management Company | Base Fee Revenue | Revenue |
| **Management Co. ← Property** | Management Company | Incentive Fee Revenue | Revenue |

```
┌─────────────────────┐         Management Fees          ┌─────────────────────┐
│   Property SPV #1   │ ──── Base Fee (5% × Revenue) ──→ │                     │
│   Property SPV #2   │ ──── Base Fee (5% × Revenue) ──→ │  Management Company │
│   Property SPV #3   │ ──── Base Fee (5% × Revenue) ──→ │                     │
│        ...          │                                   │  Revenue = Σ Fees   │
│   Property SPV #N   │ ── Incentive Fee (15% × GOP) ──→ │  from all properties│
└─────────────────────┘                                   └─────────────────────┘
```

**Verification rule:** The sum of all property management fee expenses must equal the Management Company's total fee revenue for every period. Any variance indicates a calculation error.

> **Cross-reference:** See `tools/fee-linkage-checks.json` for the automated fee reconciliation schema.

---

## Funding — SAFE Notes

The Management Company is funded primarily by private equity investors via **SAFE (Simple Agreement for Future Equity)** notes, a Y Combinator-originated instrument commonly used in early-stage venture financing.

| Parameter | Default Value | Description |
|-----------|--------------|-------------|
| `safeTranche1Amount` | $1,000,000 | First tranche of SAFE funding |
| `safeTranche1Date` | 2026-06-01 | Disbursement date for Tranche 1 |
| `safeTranche2Amount` | $1,000,000 | Second tranche of SAFE funding |
| `safeTranche2Date` | 2027-04-01 | Disbursement date for Tranche 2 |
| `safeValuationCap` | $2,500,000 | Maximum pre-money valuation for SAFE conversion |
| `safeDiscountRate` | 20% | Discount rate applied to conversion price |

### Mandatory Business Rule #1 — Funding Gate

> **The Management Company cannot operate before SAFE funding is received.**

This is a hard business rule enforced by the financial engine. The `companyOpsStartDate` (default: 2026-06-01) must be on or after the `safeTranche1Date`. If the company operations start date precedes the first SAFE tranche date, the engine will not generate revenue or incur operating expenses for the Management Company during the unfunded period.

The funding gate ensures that:
- No management fees are collected before funding
- No staff are hired before capital is available
- No fixed overhead (office lease, insurance) is incurred before the company is capitalized

> **Cross-reference:** See `formulas/funding-financing-refi.md` §1 for SAFE conversion mechanics and `tools/constraint-checks.json` for the funding gate validation rule.

---

## Expense Structure

Management Company expenses are organized into four categories:

### 1. Partner Compensation

| Parameter | Description | Default Pattern |
|-----------|-------------|----------------|
| `partnerCompYear1`–`partnerCompYear10` | Total annual partner compensation pool | $540K → $900K escalating schedule |
| `partnerCountYear1`–`partnerCountYear10` | Number of partners per year | 3 (all years) |

- Partner compensation is **configurable per year** across the 10-year projection
- The default schedule escalates roughly at inflation + 10% per step increase
- Compensation is subject to a **$30,000/month cap per partner** as a reasonableness constraint
- Monthly partner cost = `partnerCompYearN / 12`

### 2. Staff Compensation

Staff headcount is determined by a **tiered staffing model** based on the number of operational properties in the portfolio:

| Tier | Max Properties | FTE Headcount | Description |
|------|---------------|--------------|-------------|
| Tier 1 | ≤ 3 | 2.5 FTE | Startup phase — lean team |
| Tier 2 | ≤ 6 | 4.5 FTE | Growth phase — expanded support |
| Tier 3 | > 6 | 7.0 FTE | Scale phase — full operations team |

- Staff cost per month = `FTE × avgStaffSalary / 12`
- `avgStaffSalary` default: $75,000/year
- Staff salary escalates annually with the `inflationRate`

### 3. Fixed Overhead

Fixed costs escalate annually at the `fixedCostEscalationRate` (default: 3%):

| Cost Category | Annual Starting Amount | Field Name |
|--------------|----------------------|-----------|
| Office Lease | $36,000 | `officeLeaseStart` |
| Professional Services (legal, accounting) | $24,000 | `professionalServicesStart` |
| Technology Infrastructure | $18,000 | `techInfraStart` |
| Business Insurance | $12,000 | `businessInsuranceStart` |
| **Total Fixed Overhead** | **$90,000** | — |

Monthly fixed cost = `annualCost × (1 + fixedCostEscalationRate)^yearIndex / 12`

### 4. Variable Costs

Variable costs scale with the number of managed properties and/or portfolio revenue:

| Cost Category | Basis | Default Rate/Amount | Field Name |
|--------------|-------|-------------------|-----------|
| Travel (site visits) | Per managed property | $12,000/property/year | `travelCostPerClient` |
| IT Licensing | Per managed property | $3,000/property/year | `itLicensePerClient` |
| Marketing | % of total portfolio revenue | 5% | `marketingRate` |
| Miscellaneous Operations | % of total portfolio revenue | 3% | `miscOpsRate` |

- Per-client costs escalate with `inflationRate`
- Revenue-based costs naturally scale as the portfolio grows

> **Cross-reference:** See `formulas/company-financials.md` §2–§5 for detailed expense computation formulas.

---

## Financial Statements Produced

The Management Company generates:

| Statement | Content | Frequency |
|-----------|---------|-----------|
| **Income Statement** | Fee revenue, operating expenses, EBITDA, net income | Monthly (aggregated to annual) |
| **Cash Flow Statement** | SAFE inflows, operating cash flow, cumulative cash position | Monthly (aggregated to annual) |

The Management Company does **not** produce a Balance Sheet (it holds no real property assets) or IRR calculations (returns are measured at the property/portfolio level).

---

## Company Tax Rate

Pre-tax income is subject to the `companyTaxRate` (default: 30%) to derive after-tax cash flow. This rate applies to positive net income only — tax losses do not generate refunds in the current model.

> **Cross-reference:** See `formulas/company-financials.md` §6 for tax calculation rules.

---

## Checker Verification Points

| Check | What to Verify |
|-------|---------------|
| Fee reconciliation | Sum of property fee expenses = Management Company fee revenue (every period) |
| Funding gate | No revenue or expenses before `safeTranche1Date` |
| Staff tiering | FTE headcount matches property count tier for each period |
| Fixed cost escalation | Year-over-year fixed costs grow at exactly `fixedCostEscalationRate` |
| Partner cap | No partner monthly compensation exceeds $30,000 |
| Cash flow | SAFE inflows appear on correct dates; cumulative cash never goes negative after funding |
