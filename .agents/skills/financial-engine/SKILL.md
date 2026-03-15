---
name: financial-engine
description: The technical contract for the deterministic financial calculation engines. Covers the dual-engine architecture (Property Engine + Company Engine), pipeline stages, calc module taxonomy, return metrics, financial statements, consolidated reporting, and TypeScript type contracts. Use this skill whenever working on financial calculations, engine inputs/outputs, pro forma generation, or return metric computation.
---

# Financial Engine

This skill documents the deterministic financial calculation engines that power the HBG Portal. The engines generate month-by-month pro forma projections for hotel properties and the management company. **No AI approximations are permitted in any calculation path** — every number must be traceable to a formula.

**Related skills:** `hbg-business-model` (business domain), `verification-system` (audit checks), `api-backend-contract` (server architecture), `hbg-product-vision` (product direction)

---

## Dual-Engine Architecture

### Client-Side Engines (Real-Time UI)
| Engine | File | Purpose |
|--------|------|---------|
| Property Engine | `client/src/lib/financial/property-engine.ts` | Single-property monthly pro forma (default 120 months / 10 years) |
| Company Engine | `client/src/lib/financial/company-engine.ts` | ManCo P&L rolling up all property pro formas |

These run in the browser for instant recalculation as users adjust assumptions.

### Server-Side Verification (Independent Check)
| Module | Directory | Purpose |
|--------|-----------|---------|
| Calculation Checker | `server/calculation-checker/` | Independent recalculation from raw assumptions |

The server checker **never shares code** with the client engines. This independence is critical — if both sides produce the same results independently, the projections can be trusted.

---

## Property Engine Contract

**Input:** `PropertyInput` (per-hotel assumptions)
**Output:** `MonthlyFinancials[]` — one entry per month for the projection horizon (default: 120 months / 10 years)

### 8-Step Monthly Pipeline

```
For each month i = 0..119:

1. TEMPORAL GATES
   - Is this month ≥ operationsStartDate? → isOperational
   - Is this month ≥ acquisitionDate? → isAcquired
   - Revenue/variable expenses only flow when isOperational
   - Debt/depreciation only flow when isAcquired

2. OCCUPANCY RAMP
   - Step-function: occupancy increases by occupancyGrowthStep every
     occupancyRampMonths until maxOccupancy
   - Formula: min(maxOccupancy, startOccupancy + floor(monthsSinceOps / rampMonths) × step)

3. REVENUE
   - Room Revenue = roomCount × 30.5 × currentADR × occupancy
   - currentADR = baseADR × (1 + adrGrowthRate)^opsYear
   - Events = roomRevenue × revShareEvents
   - F&B = roomRevenue × revShareFB × (1 + cateringBoostPct)
   - Other = roomRevenue × revShareOther

4. DEPARTMENTAL EXPENSES
   - Variable: applied as % of their respective revenue stream
   - Fixed: anchored to Y1 base revenue, escalated by fixedCostEscalationRate

5. UNDISTRIBUTED EXPENSES + MANAGEMENT FEES
   - Service fee categories (if active): sum individual category rates × revenueTotal
   - Else: flat baseManagementFeeRate × revenueTotal
   - Incentive fee: max(0, GOP × incentiveFeeRate)
   - GOP → AGOP → NOI → ANOI computed per USALI waterfall

6. DEBT SERVICE
   - Monthly payment via PMT formula: pmt(loanAmount, monthlyRate, totalPayments)
   - Interest = prevDebtOutstanding × effectiveMonthlyRate
   - Principal = monthlyPayment − interest
   - Day-count conventions: 30/360 (default), ACT/360, ACT/365
   - IO (Interest-Only) periods supported via separate IO term

7. INCOME STATEMENT
   - Depreciation: straight-line 27.5 years (IRS residential rental property
     classification per §168(c); the model uses 27.5yr rather than 39yr
     nonresidential because boutique hotels qualify as residential if >50%
     of units are residential-use) or cost segregation with 5yr/7yr/15yr/27.5yr
     buckets (land excluded from basis)
   - NOL carryforward: losses accumulate; future income offset at 80% cap (IRC §172)
   - Pre-tax = ANOI − interest − depreciation
   - Income tax = max(0, adjustedPreTax × taxRate)
   - Net Income = ANOI − interest − depreciation − tax

8. CASH FLOW & BALANCE SHEET
   - Cash Flow = ANOI − debtPayment − incomeTax
   - Operating CF = Net Income + Depreciation (ASC 230 indirect method)
   - Financing CF = −principalPayment
   - Working capital: AR/AP tracking based on arDays/apDays
   - Operating reserve seeded at acquisition month
```

### Pass 2: Refinance Post-Processing
If `willRefinance === "Yes"`, the engine runs a second pass via `computeRefinance()` from `calc/refinance`:
- New loan sized on stabilized NOI / cap rate × refi LTV
- Debt schedule rebuilt from refi month onward
- Net proceeds = new loan − closing costs − existing debt payoff
- Operating reserve re-seeded at acquisition month

---

## Company Engine Contract

**Input:** `GlobalInput` + all `PropertyInput[]`
**Output:** `CompanyMonthlyFinancials[]` — one entry per month

### Pipeline

```
1. GATE CHECK
   - opsGateIdx = max(companyOpsStartDate index, safeTranche1Date index)
   - No revenue or expenses before the gate

2. FEE REVENUE ROLL-UP
   - baseFeeRevenue: sum of each property's feeBase (from service categories or flat rate)
   - incentiveFeeRevenue: sum of each property's feeIncentive
   - serviceFeeBreakdown: by category, by property, by category×property

3. COST OF SERVICES (optional)
   - If service templates are provided, vendor cost-of-services is deducted
   - grossProfit = totalRevenue − totalVendorCost

4. STAFFING (tier-based FTE)
   - Tier determined by activePropertyCount each month
   - staffCompensation = FTE × staffSalary × fixedCostFactor / 12

5. FIXED OVERHEAD (inflated)
   - Office lease, professional services, tech infrastructure
   - Each escalated annually by fixedCostEscalationRate

6. VARIABLE COSTS
   - Travel + IT licensing: per active property, escalated by companyInflation
   - Marketing + misc ops: as % of total fee revenue

7. PARTNER COMPENSATION
   - From 10-year fixed schedule, divided by 12 for monthly

8. SAFE FUNDING / INTEREST
   - Tranche amounts added at their respective month indices
   - Interest accrues on cumulative principal at fundingInterestRate
   - Payment frequency: accrues_only, quarterly, or annually

9. EBITDA → PRE-TAX → NET INCOME → CASH POSITION
   - EBITDA = totalRevenue − totalVendorCost − totalExpenses
   - Pre-tax = EBITDA − fundingInterestExpense
   - Tax = max(0, preTax × companyTaxRate)
   - Cash flow = netIncome + fundingInterestExpense + safeFunding − fundingInterestPayment
   - Tracks cashShortfall flag when cumulative cash goes negative
```

---

## Calc Module Taxonomy

The `calc/` directory contains specialized calculators organized by domain:

### `calc/financing/`
| Module | Purpose |
|--------|---------|
| `dscr-calculator.ts` | Debt Service Coverage Ratio computation |
| `debt-yield.ts` | NOI / Loan Amount metric |
| `sizing.ts` | Loan sizing based on DSCR/debt yield constraints |
| `prepayment.ts` | Prepayment penalty calculations |
| `interest-rate-swap.ts` | Fixed-to-floating swap analysis |
| `loan-comparison.ts` | Side-by-side loan term comparison |
| `sensitivity.ts` | Rate/term sensitivity tables |
| `closing-costs.ts` | Acquisition/refi closing cost estimation |

### `calc/refinance/`
| Module | Purpose |
|--------|---------|
| `refinance-calculator.ts` | Full refinance computation (sizing, payoff, schedule) |
| `sizing.ts` | Refi loan amount from stabilized NOI |

### `calc/funding/`
| Module | Purpose |
|--------|---------|
| `funding-engine.ts` | SAFE funding analysis and tranche optimization |
| `equity-rollforward.ts` | Equity position tracking over time |
| `gates.ts` | Operational gate validation |
| `timeline.ts` | Funding timeline visualization data |

### `calc/returns/`
| Module | Purpose |
|--------|---------|
| `irr-vector.ts` | IRR via XIRR on equity cash flows |
| `equity-multiple.ts` | MOIC (Total Distributions / Total Invested) |
| `dcf-npv.ts` | Discounted Cash Flow / Net Present Value |
| `mirr.ts` | Modified IRR with reinvestment rate |
| `wacc.ts` | Weighted Average Cost of Capital |
| `exit-valuation.ts` | Terminal value via cap rate |

### `calc/research/`
| Module | Purpose |
|--------|---------|
| `property-metrics.ts` | RevPAR, ADR, occupancy computations |
| `adr-projection.ts` | ADR growth modeling |
| `occupancy-ramp.ts` | Occupancy ramp schedule generation |
| `cap-rate-valuation.ts` | Property value = NOI / Cap Rate |
| `cost-benchmarks.ts` | USALI expense benchmarks |
| `service-fee.ts` | Service fee category calculations |
| `markup-waterfall.ts` | Markup waterfall for cost-of-services |
| `depreciation-basis.ts` | Depreciable basis computation (land excluded) |
| `make-vs-buy.ts` | In-house vs vendor cost comparison |
| `validate-research.ts` | Research data validation |

### `calc/analysis/`
| Module | Purpose |
|--------|---------|
| `consolidation.ts` | Multi-property consolidated financials |
| `stress-test.ts` | Sensitivity/stress test scenarios |
| `scenario-compare.ts` | Side-by-side scenario comparison |
| `break-even.ts` | Break-even analysis |
| `hold-vs-sell.ts` | Hold vs sell decision analysis |
| `waterfall.ts` | Equity distribution waterfall |
| `revpar-index.ts` | RevPAR index benchmarking |
| `capex-reserve.ts` | Capital expenditure reserve modeling |

### `calc/validation/`
| Module | Purpose |
|--------|---------|
| `financial-identities.ts` | A=L+E, cash flow reconciliation |
| `schedule-reconcile.ts` | Debt schedule reconciliation |
| `funding-gates.ts` | Operational gate validation |
| `assumption-consistency.ts` | Cross-assumption consistency checks |
| `export-verification.ts` | Export data integrity checks |

### `calc/services/`
| Module | Purpose |
|--------|---------|
| `cost-of-services.ts` | Centralized service cost aggregation |
| `margin-calculator.ts` | Service margin computation |

---

## Key Return Metrics

| Metric | Formula | Use |
|--------|---------|-----|
| **IRR** | XIRR on equity cash flows (negative equity invested + annual ATCF + terminal exit) | Primary return measure |
| **MOIC** | Total Distributions / Total Equity Invested | Absolute return multiple |
| **Cash-on-Cash** | Average Annual FCFE / Total Equity Invested | Annual yield measure |
| **Cap Rate** | NOI / Property Value | Valuation metric |
| **Debt Yield** | NOI / Loan Amount | Lender risk metric |
| **DSCR** | NOI / Annual Debt Service (sized on amortizing payment, even during IO) | Debt coverage test |
| **RevPAR** | ADR × Occupancy (or Room Revenue / Available Rooms) | Operational efficiency |

---

## Financial Statements

### Property-Level Income Statement
Follows the USALI waterfall (see `hbg-business-model` skill).

### Property-Level Balance Sheet
```
Assets:
  Cash & Equivalents (ending cash)
  Accounts Receivable
  Property, Plant & Equipment (land + building − accumulated depreciation)
  Total Assets

Liabilities:
  Accounts Payable
  Debt Outstanding
  Total Liabilities

Equity:
  Initial Equity (total property cost − loan amount + operating reserve)
  Retained Earnings (cumulative net income)
  Total Equity

Identity: Assets = Liabilities + Equity (ASC 210)
```

### Property-Level Cash Flow Statement (ASC 230 Indirect Method)
```
Operating Activities:
  Net Income
  + Depreciation (non-cash add-back)
  ± Working Capital Changes (ΔAR − ΔAP)
  = Cash from Operations

Investing Activities:
  − Acquisition Cost (in acquisition year)
  − FF&E Reserve (capital expenditures)
  + Exit Sale Proceeds (in final year)
  = Cash from Investing

Financing Activities:
  + Equity Contribution (in acquisition year)
  + Loan Proceeds (in acquisition year)
  − Principal Repayment
  + Refinancing Proceeds
  = Cash from Financing

Net Change in Cash = CFO + CFI + CFF
```

### Consolidated Statements
```
1. Aggregate all property financials
2. Add ManCo financials
3. Eliminate intercompany fees (ASC 810):
   - Management fees paid by properties cancel against fee revenue received by ManCo
4. Verify: Assets = Liabilities + Equity
5. Verify: Portfolio Revenue = Σ Property Revenues
```

---

## Yearly Aggregation

Monthly data is rolled up to yearly via `yearlyAggregator.ts`:
- **SUM fields**: Revenue, expenses, NOI, debt service, cash flows
- **PICK-LAST fields**: Ending cash (stock, not flow), ADR (end-of-year rate)
- **DERIVED fields**: `expenseUtilities = expenseUtilitiesVar + expenseUtilitiesFixed`
- **Fiscal year alignment**: Configurable via `fiscalYearStartMonth`

---

## TypeScript Type Contracts

### PropertyInput
Per-hotel assumptions: room count, ADR, occupancy rates, cost rates, financing terms, dates, fee categories. See `client/src/lib/financial/types.ts`.

### GlobalInput
Model-wide assumptions: model start date, inflation, staffing tiers, partner comp schedule, SAFE funding parameters, exit cap rate. See `client/src/lib/financial/types.ts`.

### MonthlyFinancials
One month of engine output per property: all revenue lines, expense lines, profitability metrics (GOP/AGOP/NOI/ANOI), debt service, depreciation, tax, cash flow, balance sheet items. See `client/src/lib/financial/types.ts`.

### CompanyMonthlyFinancials
One month of ManCo output: fee revenue breakdown, staffing costs, overhead, SAFE funding, EBITDA, net income, cash position. See `client/src/lib/financial/types.ts`.

---

## Critical Invariant

> **The financial engine is deterministic and authoritative.** No AI model may approximate, estimate, or substitute for any value produced by the engine. AI agents (Marcela, Rebecca) must call engine tools for calculations — they never compute financial values themselves.

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/lib/financial/property-engine.ts` | Property pro forma generator |
| `client/src/lib/financial/company-engine.ts` | Company pro forma generator |
| `client/src/lib/financial/types.ts` | PropertyInput, GlobalInput, MonthlyFinancials types |
| `client/src/lib/financial/loanCalculations.ts` | Loan sizing, amortization, exit value |
| `client/src/lib/financial/amortization.ts` | Generic loan amortization helpers (ASC 470) |
| `client/src/lib/financial/equityCalculations.ts` | Equity investment, loan amount, acquisition year |
| `client/src/lib/financial/cashFlowSections.ts` | ASC 230 cash flow sections (CFO/CFI/CFF) |
| `client/src/lib/financial/cashFlowAggregator.ts` | Monthly-to-yearly cash flow rollup |
| `client/src/lib/financial/yearlyAggregator.ts` | Monthly-to-yearly income statement rollup |
| `client/src/lib/financial/funding-predictor.ts` | SAFE funding analysis and tranche optimization |
| `client/src/lib/constants.ts` | Client-side financial constants |
| `shared/constants.ts` | Shared financial constants (USALI rates, fee defaults) |
| `calc/` | Specialized calculators (financing, returns, research, analysis, validation) |
