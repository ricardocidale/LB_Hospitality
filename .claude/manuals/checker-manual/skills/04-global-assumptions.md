# 04 — Global / Systemwide Assumptions

## Overview

Global assumptions are model-wide parameters accessible via the **Settings** page (`/settings`). These parameters affect **all properties and the Management Company simultaneously**. Changing any global assumption triggers an **instant, client-side recalculation** of every financial statement in the model.

Global assumptions are stored in the `global_assumptions` database table (one row per user) and are loaded into the financial engine at runtime. When a property-level value is not explicitly set, the engine falls back to the corresponding global assumption, and ultimately to the hardcoded `DEFAULT` constant in `shared/constants.ts`.

> **Cross-reference:** See `skills/05-property-assumptions.md` for property-level overrides and the fallback chain.

---

## Complete Global Assumptions Reference

### Model Parameters

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `companyName` | Display name for the management company | "Hospitality Business Company" | text | Both |
| `companyLogo` | URL to uploaded company logo | null | URL | Both |
| `propertyLabel` | Label used for property type throughout UI | "Boutique Hotel" | text | Both |
| `modelStartDate` | First month of the financial model | 2026-04-01 | date | Both |
| `projectionYears` | Number of years to project | 10 | count | Both |
| `companyOpsStartDate` | Date the Management Company begins operations | 2026-06-01 | date | Mgmt Co. |
| `fiscalYearStartMonth` | Month number when the fiscal year begins (1=Jan, 4=Apr) | 1 | count (1–12) | Both |

### Inflation & Escalation

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `inflationRate` | Annual inflation rate applied to salaries and variable costs | 3% | % | Both |
| `fixedCostEscalationRate` | Annual escalation rate for Management Company fixed overhead | 3% | % | Mgmt Co. |

### Management Fees

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `baseManagementFee` | Base management fee as % of property Total Revenue | 5% | % | Both |
| `incentiveManagementFee` | Incentive management fee as % of property GOP | 15% | % | Both |

The incentive fee base is Gross Operating Profit (GOP). The incentive fee is earned only when GOP > 0.

### SAFE Funding

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `fundingSourceLabel` | Label for the funding instrument type | "SAFE" | text | Mgmt Co. |
| `safeTranche1Amount` | Amount of first SAFE tranche | $1,000,000 | $ | Mgmt Co. |
| `safeTranche1Date` | Disbursement date for first SAFE tranche | 2026-06-01 | date | Mgmt Co. |
| `safeTranche2Amount` | Amount of second SAFE tranche | $1,000,000 | $ | Mgmt Co. |
| `safeTranche2Date` | Disbursement date for second SAFE tranche | 2027-04-01 | date | Mgmt Co. |
| `safeValuationCap` | Maximum pre-money valuation for SAFE conversion to equity | $2,500,000 | $ | Mgmt Co. |
| `safeDiscountRate` | Discount rate applied when SAFE converts to equity | 20% | % | Mgmt Co. |

> **Cross-reference:** See `formulas/funding-financing-refi.md` §1 for SAFE conversion mechanics.

### Partner Compensation

Annual compensation pool and headcount per year across the projection horizon:

| Field | Year | Default Comp Pool | Default Count |
|-------|------|------------------|--------------|
| `partnerCompYear1` / `partnerCountYear1` | 1 | $540,000 | 3 |
| `partnerCompYear2` / `partnerCountYear2` | 2 | $540,000 | 3 |
| `partnerCompYear3` / `partnerCountYear3` | 3 | $540,000 | 3 |
| `partnerCompYear4` / `partnerCountYear4` | 4 | $600,000 | 3 |
| `partnerCompYear5` / `partnerCountYear5` | 5 | $600,000 | 3 |
| `partnerCompYear6` / `partnerCountYear6` | 6 | $700,000 | 3 |
| `partnerCompYear7` / `partnerCountYear7` | 7 | $700,000 | 3 |
| `partnerCompYear8` / `partnerCountYear8` | 8 | $800,000 | 3 |
| `partnerCompYear9` / `partnerCountYear9` | 9 | $800,000 | 3 |
| `partnerCompYear10` / `partnerCountYear10` | 10 | $900,000 | 3 |

Units: Comp Pool in $/year (total for all partners); Count is integer headcount.
Impacts: Management Company only.

### Staffing

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `staffSalary` | Average annual salary per staff FTE | $75,000 | $/year | Mgmt Co. |
| `staffTier1MaxProperties` | Max properties for Tier 1 staffing | 3 | count | Mgmt Co. |
| `staffTier1Fte` | FTE headcount at Tier 1 | 2.5 | FTE | Mgmt Co. |
| `staffTier2MaxProperties` | Max properties for Tier 2 staffing | 6 | count | Mgmt Co. |
| `staffTier2Fte` | FTE headcount at Tier 2 | 4.5 | FTE | Mgmt Co. |
| `staffTier3Fte` | FTE headcount at Tier 3 (>6 properties) | 7.0 | FTE | Mgmt Co. |

Staff salary escalates annually at `inflationRate`.

### Fixed Overhead (Management Company)

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `officeLeaseStart` | Annual office lease cost (Year 1) | $36,000 | $/year | Mgmt Co. |
| `professionalServicesStart` | Annual legal, accounting, and advisory cost (Year 1) | $24,000 | $/year | Mgmt Co. |
| `techInfraStart` | Annual technology infrastructure cost (Year 1) | $18,000 | $/year | Mgmt Co. |
| `businessInsuranceStart` | Annual business insurance cost (Year 1) | $12,000 | $/year | Mgmt Co. |

All fixed costs escalate annually at `fixedCostEscalationRate`. Monthly cost = `annualCost × (1 + fixedCostEscalationRate)^yearIndex / 12`.

### Variable Costs (Management Company)

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `travelCostPerClient` | Annual travel cost per managed property | $12,000 | $/property/year | Mgmt Co. |
| `itLicensePerClient` | Annual IT licensing cost per managed property | $3,000 | $/property/year | Mgmt Co. |
| `marketingRate` | Marketing spend as % of total portfolio revenue | 5% | % | Mgmt Co. |
| `miscOpsRate` | Miscellaneous operations as % of total portfolio revenue | 3% | % | Mgmt Co. |

Per-client costs escalate with `inflationRate`. Revenue-based costs scale naturally with portfolio growth.

### Revenue Variables (Property-Level Expense Rates)

These global rates govern how specific property revenue streams translate to departmental expenses:

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `eventExpenseRate` | Expense rate applied to Event Revenue | 65% | % | Properties |
| `otherExpenseRate` | Expense rate applied to Other Revenue | 60% | % | Properties |
| `utilitiesVariableSplit` | Portion of utilities expense treated as variable | 60% | % | Properties |

> **Cross-reference:** See `formulas/property-financials.md` §3 for how these rates apply to departmental expense calculations.

### Exit & Sale

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `exitCapRate` | Capitalization rate for terminal value calculation | 8.5% | % | Properties |
| `salesCommissionRate` | Broker commission at disposition | 5% | % | Properties |
| `companyTaxRate` | Corporate income tax rate for Management Company | 30% | % | Mgmt Co. |

### Debt Assumptions (JSON Object: `debtAssumptions`)

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `interestRate` | Default loan interest rate (acquisition) | 9% | % | Properties |
| `amortizationYears` | Default loan amortization period | 25 | years | Properties |
| `acqLTV` | Default acquisition loan-to-value ratio | 75% | % | Properties |
| `acqClosingCostRate` | Closing costs as % of acquisition loan amount | 2% | % | Properties |
| `refiLTV` | Default refinance loan-to-value ratio | 75% | % | Properties |
| `refiClosingCostRate` | Closing costs as % of refinance loan amount | 3% | % | Properties |
| `refiInterestRate` | Interest rate on refinance loan (optional override) | — | % | Properties |
| `refiAmortizationYears` | Amortization period for refinance loan (optional override) | — | years | Properties |
| `refiPeriodYears` | Default years after ops start before refinance eligibility | — | years | Properties |

> **Cross-reference:** See `formulas/funding-financing-refi.md` §2–§3 for acquisition and refinance debt calculations.

### Standard Acquisition Package (JSON Object: `standardAcqPackage`)

Default capital budget for new property acquisitions:

| Field | Definition | Default Value | Unit | Impacts |
|-------|-----------|--------------|------|---------|
| `purchasePrice` | Default property purchase price | $2,300,000 | $ | Properties |
| `buildingImprovements` | Default building improvement / renovation budget | $800,000 | $ | Properties |
| `preOpeningCosts` | Pre-opening expenses (staffing, training, marketing) | $150,000 | $ | Properties |
| `operatingReserve` | Cash reserve for initial operations | $200,000 | $ | Properties |
| `monthsToOps` | Default months from acquisition to operations start | 6 | months | Properties |

### Boutique Definition (JSON Object: `boutiqueDefinition`)

Defines the target property profile for the Property Finder and validation:

| Field | Definition | Default Value | Unit |
|-------|-----------|--------------|------|
| `minRooms` | Minimum room count | 10 | count |
| `maxRooms` | Maximum room count | 80 | count |
| `hasFB` | Property has food & beverage operations | true | boolean |
| `hasEvents` | Property has event/meeting space | true | boolean |
| `hasWellness` | Property has wellness programming | true | boolean |
| `minAdr` | Minimum target ADR | $150 | $ |
| `maxAdr` | Maximum target ADR | $600 | $ |
| `level` | Service level classification | "luxury" | enum |
| `eventLocations` | Number of distinct event spaces | 2 | count |
| `maxEventCapacity` | Maximum event guest capacity | 150 | count |
| `acreage` | Minimum property acreage | 10 | acres |
| `privacyLevel` | Guest privacy classification | "high" | enum |
| `parkingSpaces` | Minimum parking spaces | 50 | count |
| `description` | Free-text description of target property type | (see schema) | text |

---

## Instant Recalculation

Changing **any** global assumption instantly recalculates all downstream financial statements:

```
Global Assumption Changed
    ├── Management Company Income Statement (recalculated)
    ├── Management Company Cash Flow Statement (recalculated)
    ├── Property #1: Income Statement, Cash Flow, Balance Sheet, FCF, IRR (recalculated)
    ├── Property #2: Income Statement, Cash Flow, Balance Sheet, FCF, IRR (recalculated)
    ├── ...
    ├── Property #N: Income Statement, Cash Flow, Balance Sheet, FCF, IRR (recalculated)
    ├── Portfolio Aggregates (recalculated)
    └── Dashboard KPIs (recalculated)
```

---

## Export for Offline Verification

The checker should export assumptions and results to **Excel (.xlsx)** or **CSV** from the Settings page and every financial statement page. This enables:

- Side-by-side comparison of assumptions before and after changes
- Independent recalculation in a spreadsheet to verify engine accuracy
- Audit trail preservation for scenario comparisons
- Offline review without application access

---

## Checker Verification Points

| Check | What to Verify |
|-------|---------------|
| Default values | All fields display correct default values per this table |
| Escalation | Fixed costs escalate at exactly `fixedCostEscalationRate` year-over-year |
| Staffing tiers | FTE transitions correctly as portfolio grows past tier thresholds |
| Fee rates | Base and incentive fee rates propagate correctly to all property income statements |
| SAFE dates | Tranche dates precede or equal `companyOpsStartDate` (funding gate) |
| Debt assumptions | Property financing defaults match `debtAssumptions` object when no property override is set |
| Acquisition package | New properties created via Property Finder default to `standardAcqPackage` values |
| Instant recalc | Changing any single assumption updates all dependent outputs without page reload |

---

## USALI Benchmark Reasonableness Ranges

| Metric | Acceptable Range (Boutique Hotels) | Red Flag Below | Red Flag Above |
|--------|-----------------------------------|----------------|----------------|
| ADR | $150 – $600 | $100 | $800 |
| Occupancy Rate | 55% – 85% | 40% | 95% |
| RevPAR | $100 – $400 | $60 | $500 |
| GOP Margin | 30% – 55% | 20% | 65% |
| NOI Margin | 20% – 40% | 10% | 50% |
| Rooms Revenue % of Total | 55% – 75% | 40% | 85% |
| F&B Revenue % of Total | 15% – 30% | 5% | 45% |
| Base Mgmt Fee | 3% – 7% | 1% | 10% |
| Incentive Mgmt Fee | 10% – 25% | 5% | 35% |
| FF&E Reserve | 3% – 6% | 1% | 10% |
| Exit Cap Rate | 6% – 12% | 4% | 15% |

---

## Inflation & Escalation Verification

### Two Escalation Paths

The model uses two distinct escalation mechanisms:

1. **`fixedCostEscalationRate`** — Applied to fixed costs: office lease, professional services (admin), marketing overhead, maintenance/tech infrastructure, and business insurance. Formula: `cost × (1 + fixedCostEscalationRate)^yearIndex`
2. **`inflationRate`** — Applied to variable costs: travel cost per client, IT licensing per client, marketing (revenue-based), and miscellaneous operations

### Fallback Behavior

If `fixedCostEscalationRate` is **not set** (null or undefined), the engine falls back to `inflationRate` for fixed cost escalation. This ensures all costs still escalate even if only one rate is configured.

### Verification Procedure

To confirm the two-path escalation is working correctly:

1. Set `inflationRate` = **3%** and `fixedCostEscalationRate` = **5%**
2. Export the Management Company Income Statement to Excel
3. Verify **fixed costs** grow at exactly **5%** year-over-year:
   - Office Lease: Year 1 = $36,000, Year 2 = $37,800 ($36,000 × 1.05), Year 3 = $39,690, etc.
   - Professional Services: Year 1 = $24,000, Year 2 = $25,200, Year 3 = $26,460, etc.
   - Tech Infrastructure: Year 1 = $18,000, Year 2 = $18,900, Year 3 = $19,845, etc.
   - Business Insurance: Year 1 = $12,000, Year 2 = $12,600, Year 3 = $13,230, etc.
4. Verify **variable costs** grow at exactly **3%** year-over-year:
   - Travel Cost Per Client: Year 1 = $12,000, Year 2 = $12,360, Year 3 = $12,731, etc.
   - IT License Per Client: Year 1 = $3,000, Year 2 = $3,090, Year 3 = $3,183, etc.
5. Confirm that setting `fixedCostEscalationRate` to null causes fixed costs to fall back to the 3% `inflationRate`
