# 05 — Property-Level Assumptions

## Overview

Property-level assumptions are accessible via the **Property Edit** page (`/property/:id/edit`). These parameters override or supplement the global defaults for each individual SPV. Every property can have its own unique revenue drivers, cost structure, financing terms, and exit assumptions — enabling heterogeneous portfolio modeling.

The financial engine applies a **three-tier fallback chain** when resolving any property parameter:

```
Property-specific value (if set)
    → Global assumption (if property value is null/undefined)
        → DEFAULT constant from shared/constants.ts (hardcoded fallback)
```

This ensures that every calculation always has a valid input, while allowing maximum configurability at any level.

> **Cross-reference:** See `skills/04-global-assumptions.md` for global defaults and `formulas/property-financials.md` for how these assumptions feed into financial calculations.

---

## Complete Property Assumptions Reference

### Identity & Classification

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `name` | Property display name | — (required) | text | UI display |
| `location` | City/region description | — (required) | text | UI display, market research |
| `market` | Geographic market classification | — (required) | text ("North America" / "Latin America") | Portfolio grouping |
| `imageUrl` | URL to property hero image | — (required) | URL | UI display |
| `status` | Current lifecycle stage | — (required) | text ("Development" / "Acquisition" / "Operating") | UI display, filtering |
| `type` | Capital structure at acquisition | — (required) | text ("Full Equity" / "Financed") | Financing calculations |

### Timing

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `acquisitionDate` | Date the property is acquired / capital deployed | — (required) | date (YYYY-MM-DD) | Balance Sheet, Cash Flow, Total Project Cost timing |
| `operationsStartDate` | Date hotel operations begin (revenue starts) | — (required) | date (YYYY-MM-DD) | Revenue start, management fee start, depreciation start |

The gap between `acquisitionDate` and `operationsStartDate` represents the pre-opening / renovation period. During this period, no revenue is generated but capital costs are incurred.

### Capital Structure

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `purchasePrice` | Property acquisition price | $2,300,000 (from `standardAcqPackage`) | $ | Total Project Cost, loan sizing, depreciation basis |
| `buildingImprovements` | Renovation / improvement budget | $800,000 (from `standardAcqPackage`) | $ | Total Project Cost, depreciable basis |
| `landValuePercent` | Non-depreciable land allocation (per IRS Pub. 946) | 25% | % | Depreciation calculation (ASC 360) |
| `preOpeningCosts` | Pre-opening expenses (staff training, soft opening, marketing) | $150,000 (from `standardAcqPackage`) | $ | Total Project Cost |
| `operatingReserve` | Cash reserve for initial operations | $200,000 (from `standardAcqPackage`) | $ | Total Project Cost |

**Depreciable Basis** = (Purchase Price + Building Improvements) × (1 − `landValuePercent`)
**Depreciation Period** = 27.5 years (IRS Publication 946 / ASC 360 for residential rental property)

> **Cross-reference:** See `formulas/property-financials.md` §4 for depreciation schedule formulas.

### Revenue Drivers

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `roomCount` | Number of guest rooms | 10 | count | Available room nights, revenue capacity |
| `startAdr` | Average Daily Rate at operations start | $250 | $/night | Room revenue |
| `adrGrowthRate` | Annual ADR growth rate | 3% | % | Room revenue escalation |
| `startOccupancy` | Occupancy rate at operations start | 55% | % | Sold room nights |
| `maxOccupancy` | Maximum stabilized occupancy | 85% | % | Occupancy ceiling |
| `occupancyRampMonths` | Months between occupancy growth steps | 6 | months | Ramp-up timeline |
| `occupancyGrowthStep` | Occupancy increase per ramp step | 5% | % (absolute) | Ramp-up trajectory |
| `stabilizationMonths` | Months from ops start to stabilization | 24 | months | Stabilization milestone |

**Monthly Room Revenue** = `roomCount` × `DAYS_PER_MONTH (30.5)` × `currentOccupancy` × `currentADR`

ADR grows monthly: `currentADR = startAdr × (1 + adrGrowthRate)^(monthIndex/12)`
Occupancy ramps in steps: every `occupancyRampMonths`, occupancy increases by `occupancyGrowthStep` until `maxOccupancy` is reached.

> **Cross-reference:** See `formulas/property-financials.md` §1 for the complete monthly revenue computation.

### Revenue Shares (as % of Room Revenue)

Ancillary revenue streams are calculated as percentages of Room Revenue:

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `revShareEvents` | Event revenue as % of Room Revenue | 43% | % | Event Revenue line |
| `revShareFB` | Food & Beverage revenue as % of Room Revenue | 22% | % | F&B Revenue line |
| `revShareOther` | Other revenue as % of Room Revenue | 7% | % | Other Revenue line |

**Total Revenue** = Room Revenue + Event Revenue + F&B Revenue + Other Revenue

> **Cross-reference:** See `formulas/property-financials.md` §1 for revenue stream calculations.

### Catering Boost

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `cateringBoostPercent` | Percentage uplift applied to base F&B revenue from catering operations | 30% | % | F&B Revenue (boosted) |

**Adjusted F&B Revenue** = Base F&B Revenue × (1 + `cateringBoostPercent`)

This reflects the blended catering uplift across all event types (fully catered, partially catered, and non-catered). The boost is applied to the base F&B share before computing F&B departmental expenses.

### Operating Cost Rates (as % of Total Revenue)

USALI-aligned departmental and undistributed expense allocations:

| Field | Definition | Default | Unit | USALI Reference |
|-------|-----------|---------|------|-----------------|
| `costRateRooms` | Rooms Department expense | 36% | % of Total Revenue | USALI Schedule 1 — Rooms |
| `costRateFB` | F&B Department expense | 32% | % of Total Revenue | USALI Schedule 2 — Food & Beverage |
| `costRateAdmin` | Administrative & General expense | 8% | % of Total Revenue | USALI Schedule 8 — A&G |
| `costRateMarketing` | Sales & Marketing expense | 5% | % of Total Revenue | USALI Schedule 9 — S&M |
| `costRatePropertyOps` | Property Operations & Maintenance | 4% | % of Total Revenue | USALI Schedule 10 — POM |
| `costRateUtilities` | Utilities expense | 5% | % of Total Revenue | USALI Schedule 11 — Utilities |
| `costRateInsurance` | Property Insurance | 2% | % of Total Revenue | Undistributed — Insurance |
| `costRateTaxes` | Property Taxes | 3% | % of Total Revenue | Undistributed — Taxes |
| `costRateIT` | Information Technology | 2% | % of Total Revenue | USALI Schedule 12 — IT |
| `costRateFFE` | FF&E Reserve (furniture, fixtures, equipment) | 4% | % of Total Revenue | Industry standard reserve |
| `costRateOther` | Other / Miscellaneous expenses | 5% | % of Total Revenue | Undistributed — Other |

**Total Operating Expenses** = Σ (each rate × Total Revenue) + Management Fees + Depreciation

> **Cross-reference:** See `formulas/property-financials.md` §3 for expense calculation details.

### Financing — Acquisition (Financed properties only)

| Field | Definition | Default (from `debtAssumptions`) | Unit | Affects |
|-------|-----------|----------------------------------|------|---------|
| `acquisitionLTV` | Loan-to-value ratio at acquisition | 75% (`acqLTV`) | % | Loan amount |
| `acquisitionInterestRate` | Annual interest rate on acquisition loan | 9% (`interestRate`) | % | Monthly debt service |
| `acquisitionTermYears` | Amortization period for acquisition loan | 25 (`amortizationYears`) | years | Monthly debt service |
| `acquisitionClosingCostRate` | Closing costs as % of loan amount | 2% (`acqClosingCostRate`) | % | Total Project Cost |

These fields are only relevant when `type = "Financed"`. For Full Equity properties, these fields are null.

> **Cross-reference:** See `formulas/funding-financing-refi.md` §2 for acquisition debt calculations.

### Financing — Refinance

| Field | Definition | Default (from `debtAssumptions`) | Unit | Affects |
|-------|-----------|----------------------------------|------|---------|
| `willRefinance` | Whether property will pursue refinance | null | "Yes" / "No" | Refinance event trigger |
| `refinanceDate` | Target date for refinance closing | null | date (YYYY-MM-DD) | Refinance timing |
| `refinanceLTV` | Loan-to-value at refinance | 75% (`refiLTV`) | % | New loan amount |
| `refinanceInterestRate` | Interest rate on refinance loan | 9% (`interestRate`) | % | New debt service |
| `refinanceTermYears` | Amortization period for refinance loan | 25 (`amortizationYears`) | years | New debt service |
| `refinanceClosingCostRate` | Closing costs as % of refinance loan | 3% (`refiClosingCostRate`) | % | Net refinance proceeds |

> **Cross-reference:** See `formulas/funding-financing-refi.md` §3 for refinance calculation formulas.

### Exit & Tax

| Field | Definition | Default | Unit | Affects |
|-------|-----------|---------|------|---------|
| `exitCapRate` | Capitalization rate for terminal value | 8.5% | % | Exit valuation (NOI ÷ Cap Rate) |
| `taxRate` | Income / capital gains tax rate | 25% | % | After-tax FCF, exit tax liability |

> **Cross-reference:** See `formulas/dcf-fcf-irr.md` §3 for exit valuation and tax calculations.

---

## Fallback Chain in Detail

The financial engine resolves every property parameter using a strict three-tier fallback:

| Priority | Source | Example |
|----------|--------|---------|
| **1 (Highest)** | Property-specific value set on Property Edit page | Property `exitCapRate = 0.07` |
| **2** | Global assumption from Settings page | Global `exitCapRate = 0.085` |
| **3 (Lowest)** | DEFAULT constant from `shared/constants.ts` | `DEFAULT_EXIT_CAP_RATE = 0.085` |

The engine checks each tier in order and uses the first non-null, non-undefined value found. This allows:

- **Individual property customization** (e.g., a Colombian property with a different tax rate)
- **Portfolio-wide changes** via a single global assumption update
- **Guaranteed computation** — no calculation ever fails due to a missing input

---

## Export for Offline Verification

Property assumptions and computed financials can be exported from:

| Page | Export Content |
|------|---------------|
| **Property Detail** (`/property/:id`) | Full financial statements (Income Statement, Cash Flow, Balance Sheet, FCF, IRR) |
| **Property Edit** (`/property/:id/edit`) | Current assumption values |
| **Portfolio** (`/portfolio`) | Aggregated property summary |
| **Settings** (`/settings`) | Global assumptions snapshot |

Supported formats: **Excel (.xlsx)** and **CSV**. Use exports to build independent verification spreadsheets.

---

## Checker Verification Points

| Check | What to Verify |
|-------|---------------|
| Fallback chain | When a property field is null, the global value is used; when global is null, the DEFAULT constant is used |
| Revenue drivers | `roomCount × DAYS_PER_MONTH × occupancy × ADR` = Room Revenue for each month |
| ADR growth | ADR compounds monthly at `adrGrowthRate / 12` (approximately) |
| Occupancy ramp | Occupancy increases by `occupancyGrowthStep` every `occupancyRampMonths` until `maxOccupancy` |
| Revenue shares | Event/F&B/Other revenue = respective `revShare` × Room Revenue |
| Catering boost | Reported F&B Revenue = base F&B × (1 + `cateringBoostPercent`) |
| Cost rates | Each departmental expense = `costRate` × Total Revenue |
| Depreciation | Monthly depreciation = (Purchase Price + Improvements) × (1 − landValuePercent) ÷ (27.5 × 12) |
| Financing | Loan Amount = LTV × (Purchase Price + Building Improvements); PMT uses standard amortization |
| Balance Sheet | Assets = Liabilities + Equity every period |
| Exit | Terminal Value = Trailing NOI ÷ `exitCapRate` |

---

## In-App Help & Research Integration

Every input field on the Property Edit page includes:

1. **HelpTooltip** (? icon) — Explains the field's purpose, impact on calculations, and for GAAP-regulated values, the authoritative source
2. **ResearchBadge** (amber/gold) — Shown when AI market research data exists for the field. Displays the recommended range and applies the midpoint on click

Currently mapped research badges: `startAdr`, `maxOccupancy`, `startOccupancy`, `occupancyRampMonths`, `cateringBoostPercent`, `exitCapRate`, `landValuePercent`

### GAAP-Standardized Fields

The following property-level fields are governed by authoritative standards and should have narrow acceptable ranges:

| Field | Standard | Authority |
|-------|----------|-----------|
| Depreciation basis (land exclusion) | `landValuePercent` × purchase price is non-depreciable | IRS Pub 946 / ASC 360 |
| Depreciation period | 27.5 years straight-line | IRS Pub 946 |
| Loan amortization | 20–30 years | Market convention |
| Closing costs | 1–3% of loan | Market convention |
