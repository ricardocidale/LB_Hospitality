# Financial Engine

## Overview

The financial engine generates monthly pro forma projections for hospitality properties. It calculates revenue, expenses, profitability metrics, debt service, balance sheet items, and GAAP-compliant cash flow statements.

## Core Files

| File | Purpose |
|------|---------|
| `client/src/lib/financialEngine.ts` | Primary calculation engine |
| `client/src/lib/loanCalculations.ts` | Loan amortization, refinance, PMT calculations |
| `client/src/lib/constants.ts` | Named constants and default values |
| `server/calculationChecker.ts` | Independent server-side recalculation |

## Main Functions

### `generatePropertyProForma(property, global, months?)`

The core function that generates monthly financial projections for a single property.

**Inputs**:
- `property: PropertyInput` - Property-specific data (rooms, ADR, cost rates, etc.)
- `global: GlobalInput` - Model-wide assumptions (inflation, fees, funding, etc.)
- `months: number` - Projection period (default: dynamic from `global.projectionYears * 12`)

**Output**: `MonthlyFinancials[]` - Array of monthly financial snapshots

### `generateCompanyProForma(properties, global, months?)`

Aggregates property-level data into management company financials including overhead, partner compensation, and staff costs.

## Calculation Flow (Monthly)

```
Month N
│
├── 1. DATE CALCULATIONS
│   ├── Is this month before/after operations start?
│   ├── Is this month before/after acquisition date?
│   └── What fiscal year does this month fall in?
│
├── 2. OCCUPANCY & ADR
│   ├── Occupancy ramps from startOccupancy to maxOccupancy
│   │   over occupancyRampMonths, then grows by occupancyGrowthStep
│   │   until stabilizationMonths
│   ├── ADR grows annually at adrGrowthRate
│   └── Monthly ADR adjusted for inflation
│
├── 3. REVENUE
│   ├── Room Revenue = rooms × ADR × occupancy × 30.5 days
│   ├── Event Revenue = rooms × ADR × eventRevShare × catering boost
│   ├── F&B Revenue = rooms × ADR × fbRevShare × catering boost
│   ├── Other Revenue = rooms × ADR × otherRevShare
│   └── Total Revenue = sum of all revenue streams
│
├── 4. EXPENSES
│   ├── Room Costs = Room Revenue × costRateRooms
│   ├── F&B Costs = F&B Revenue × costRateFB
│   ├── Event Costs = Event Revenue × eventExpenseRate
│   ├── Admin Costs = Total Revenue × costRateAdmin
│   ├── Marketing = Total Revenue × costRateMarketing
│   ├── Maintenance = Total Revenue × costRateMaintenance
│   ├── Utilities = split between variable (revenue-based) and fixed
│   ├── Management Fees = base fee on revenue + incentive fee on GOP
│   └── FF&E Reserve = Total Revenue × ffEReserveRate
│
├── 5. PROFITABILITY
│   ├── GOP = Total Revenue - Department Expenses
│   ├── NOI = GOP - Undistributed Expenses - Management Fees - FF&E
│   ├── Depreciation = buildingValue / 27.5 / 12 (monthly)
│   └── Net Income = NOI - Interest Expense - Depreciation
│
├── 6. DEBT SERVICE (if financed)
│   ├── PMT = standard amortization formula
│   ├── Interest = outstanding balance × monthly rate
│   ├── Principal = PMT - Interest
│   ├── Outstanding Balance decreases by principal
│   └── Refinance logic at specified refinance date
│
├── 7. CASH FLOW (GAAP Indirect Method)
│   ├── Operating CF = Net Income + Depreciation (non-cash add-back)
│   ├── Investing CF = Capital expenditures
│   ├── Financing CF = -Principal payments + new debt proceeds
│   ├── Free Cash Flow = NOI - Total Debt Service
│   └── FCFE = FCF - Principal (to equity holders)
│
└── 8. BALANCE SHEET
    ├── Property Value = Purchase Price + Improvements - Accumulated Depreciation
    ├── Debt Outstanding = Loan balance after payments
    ├── Equity = Assets - Liabilities
    └── Cash = Cumulative cash flow
```

## Key Financial Rules

### Revenue Calculation
- **Days per month**: 30.5 (industry standard, 365/12 rounded)
- **Room Revenue**: `roomCount × ADR × occupancy × 30.5`
- **Catering boost**: Full Service adds 50% to event/F&B revenue; Partial adds 25%
- Revenue only starts after `operationsStartDate`

### Cost Escalation
- **Variable costs**: Escalate at the inflation rate
- **Fixed costs**: Escalate at `fixedCostEscalationRate` (default 3%)
- Escalation applied annually, compounding year over year

### Depreciation
- **Method**: Straight-line over 27.5 years (IRS Publication 946)
- **Basis**: Purchase price + building improvements
- **Start**: First full month after acquisition date
- **Monthly amount**: `buildingValue / 27.5 / 12`
- This is immutable - 27.5 years is IRS-mandated for residential rental property

### Debt Service
- **PMT formula**: Standard amortization `P × r × (1+r)^n / ((1+r)^n - 1)`
- **Interest/principal split**: Interest = balance × monthly rate; Principal = PMT - interest
- **Refinance**: At specified date, new loan at refinance LTV with closing costs
- **Timing**: Debt only exists after acquisition date; returns 0 before

### Management Fees
- **Base fee**: Percentage of total revenue (default 5%)
- **Incentive fee**: Percentage of GOP above threshold (default 15%)
- Applied monthly, based on that month's revenue/GOP

### Partner Compensation
- Defined per-year (Year 1 through Year N) in global assumptions
- Monthly amount = annual amount / 12
- Only starts after `companyOpsStartDate`

### Staffing Model
- Dynamic tiers based on number of active properties:
  - Tier 1: Up to N properties → X FTE
  - Tier 2: Up to M properties → Y FTE  
  - Tier 3: Above M properties → Z FTE
- All tier values configurable in global assumptions
- Staff cost = FTE count × average staff salary

## Configurable vs Immutable Values

### Immutable (hardcoded constants)
| Constant | Value | Reason |
|----------|-------|--------|
| DEPRECIATION_YEARS | 27.5 | IRS Publication 946 / ASC 360 |
| DAYS_PER_MONTH | 30.5 | Industry standard (365/12) |

### Configurable (in global assumptions)
| Parameter | Default | Range | Location |
|-----------|---------|-------|----------|
| projectionYears | 10 | 1-30 | Company Assumptions page |
| inflationRate | 3% | 0-15% | Company Assumptions page |
| fixedCostEscalationRate | 3% | 0-10% | Company Assumptions page |
| baseManagementFee | 5% | 0-15% | Company Assumptions page |
| exitCapRate | 8.5% | 1-20% | Company Assumptions page |
| All staffing tiers | varies | varies | Company Assumptions page |

### Configurable (per property)
| Parameter | Default | Location |
|-----------|---------|----------|
| costRateRooms | 36% | Property Edit page |
| costRateFB | 38% | Property Edit page |
| eventExpenseRate | 65% | Property Edit page |
| exitCapRate | (global) | Property Edit page |
| taxRate | (global) | Property Edit page |
