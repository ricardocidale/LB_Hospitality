# 15 — Testing Methodology: 7-Phase Verification Workflow

> **CRITICAL SECTION.** This document defines the structured, phased approach that checkers must follow to verify the correctness of all financial calculations, data flows, and system behaviors in the Hospitality Business Business Simulation Portal.

---

## Core Verification Principle

Every financial output in this application is **deterministic** — the same inputs must always produce the same outputs. The checker's role is to independently verify that the application's outputs match hand-calculated expected results derived from the documented formulas.

> **Scenario Creation Reminder:** Checkers can and should create saved scenarios to test different assumption configurations. Use the Scenarios feature to save baseline states, apply changes, and compare results. This is the most efficient way to test multiple configurations without manually resetting assumptions each time.

---

## Verification Phases Overview

| Phase | Name | Focus | Primary References |
|-------|------|-------|--------------------|
| 1 | Input Verification | Assumptions, defaults, USALI benchmarks | `shared/constants.ts`, `skills/04-global-assumptions.md`, `skills/05-property-assumptions.md` |
| 2 | Calculation Verification | Revenue, cost, and fee formula cross-validation | `formulas/property-financials.md`, `formulas/company-financials.md` |
| 3 | Financial Statement Reconciliation | Balance sheet, cash flow, income statement integrity | `formulas/property-financials.md` §Balance Sheet/Cash Flow, `tools/balance-sheet-checks.json`, `tools/cash-flow-checks.json` |
| 4 | IRR / DCF / FCF Verification | Investment return analytics validation | `formulas/dcf-fcf-irr.md`, `analytics/returns/irr.ts` |
| 5 | Scenario & Stress Testing | Edge cases, boundary conditions, scenario comparison | `tools/constraint-checks.json`, `skills/10-scenarios.md` |
| 6 | Reports & Exports Completeness | Export formats, on-screen accuracy, chart rendering | `skills/08-exports.md` |
| 7 | Documentation & Sign-Off | Audit opinion, final checklist, sign-off | This document |

---

## Standard Test Execution Protocol

**For every test across all phases**, follow this six-step protocol:

| Step | Action | Purpose |
|------|--------|---------|
| 1 | **Document Setup** | Record which assumptions were changed and their values |
| 2 | **Export Baseline** | Export current state to Excel/CSV before making changes |
| 3 | **Make the Change** | Apply the specific assumption or configuration change being tested |
| 4 | **Export New State** | Export the updated state to Excel/CSV |
| 5 | **Compare** | In a spreadsheet, compare expected results (hand-calculated) vs. actual (exported) |
| 6 | **Log Results** | Record pass/fail status, any discrepancies, and observations in the activity feed |

---

# Phase 1: Input Verification

> Verify all assumptions load correctly, defaults match `shared/constants.ts`, and key metrics fall within USALI benchmark ranges for boutique hospitality.

## 1.1 — Default Value Verification

Every assumption field must display the correct default value as defined in `shared/constants.ts`. Load a fresh scenario (or reset to defaults) and verify each field against the source of truth.

### Revenue Share Defaults

| Field | Constant Name | Expected Default | Source |
|-------|--------------|-----------------|--------|
| Revenue Share — Events | `DEFAULT_REV_SHARE_EVENTS` | 43% | `shared/constants.ts` line 6 |
| Revenue Share — F&B | `DEFAULT_REV_SHARE_FB` | 22% | `shared/constants.ts` line 7 |
| Revenue Share — Other | `DEFAULT_REV_SHARE_OTHER` | 7% | `shared/constants.ts` line 8 |
| Catering Boost % | `DEFAULT_CATERING_BOOST_PCT` | 30% | `shared/constants.ts` line 12 |

### Expense Rate Defaults

| Field | Constant Name | Expected Default | Source |
|-------|--------------|-----------------|--------|
| Event Expense Rate | `DEFAULT_EVENT_EXPENSE_RATE` | 65% | `shared/constants.ts` line 15 |
| Other Expense Rate | `DEFAULT_OTHER_EXPENSE_RATE` | 60% | `shared/constants.ts` line 16 |
| Utilities Variable Split | `DEFAULT_UTILITIES_VARIABLE_SPLIT` | 60% | `shared/constants.ts` line 17 |

### USALI Cost Rate Defaults

| Field | Constant Name | Expected Default | USALI Category |
|-------|--------------|-----------------|----------------|
| Cost Rate — Rooms | `DEFAULT_COST_RATE_ROOMS` | 36% | Rooms Dept |
| Cost Rate — F&B | `DEFAULT_COST_RATE_FB` | 32% | F&B Dept |
| Cost Rate — Admin | `DEFAULT_COST_RATE_ADMIN` | 8% | Undistributed |
| Cost Rate — Marketing | `DEFAULT_COST_RATE_MARKETING` | 5% | Undistributed |
| Cost Rate — Property Ops | `DEFAULT_COST_RATE_PROPERTY_OPS` | 4% | Undistributed |
| Cost Rate — Utilities | `DEFAULT_COST_RATE_UTILITIES` | 5% | Undistributed |
| Cost Rate — Insurance | `DEFAULT_COST_RATE_INSURANCE` | 2% | Fixed Charges |
| Cost Rate — Taxes | `DEFAULT_COST_RATE_TAXES` | 3% | Fixed Charges |
| Cost Rate — IT | `DEFAULT_COST_RATE_IT` | 2% | Undistributed |
| Cost Rate — FF&E | `DEFAULT_COST_RATE_FFE` | 4% | Reserve |
| Cost Rate — Other | `DEFAULT_COST_RATE_OTHER` | 5% | Other |

### Exit & Other Defaults

| Field | Constant Name | Expected Default |
|-------|--------------|-----------------|
| Exit Cap Rate | `DEFAULT_EXIT_CAP_RATE` | 8.5% |
| Tax Rate | `DEFAULT_TAX_RATE` | 25% |
| Sales Commission Rate | `DEFAULT_COMMISSION_RATE` | 5% |
| Land Value % | `DEFAULT_LAND_VALUE_PERCENT` | 25% |
| Depreciation Period | `DEPRECIATION_YEARS` | 27.5 years |
| Days Per Month | `DAYS_PER_MONTH` | 30.5 |
| Occupancy Ramp Months | `DEFAULT_OCCUPANCY_RAMP_MONTHS` | 6 |
| SAFE Valuation Cap | `DEFAULT_SAFE_VALUATION_CAP` | $2,500,000 |
| SAFE Discount Rate | `DEFAULT_SAFE_DISCOUNT_RATE` | 20% |

> **Cross-reference:** Full global assumption table in `skills/04-global-assumptions.md`.

## 1.2 — USALI Benchmark Reasonableness Checks

After verifying defaults, confirm that the model's output metrics fall within industry-accepted USALI ranges for boutique hotel properties. Metrics outside these ranges should be flagged for further investigation — they are not necessarily errors, but require justification.

### Key Performance Indicator Benchmarks

| Metric | Acceptable Range (Boutique) | Formula / Source | Flag If Outside? |
|--------|----------------------------|------------------|-----------------|
| ADR (Average Daily Rate) | $150 – $600 | Property assumption input | ⚠️ Warning |
| Occupancy Rate | 55% – 85% | Property assumption input | ⚠️ Warning |
| RevPAR | $100 – $400 | `ADR × Occupancy` | ⚠️ Warning |
| GOP Margin | 30% – 55% | `GOP ÷ Total Revenue` | ⚠️ Warning |
| NOI Margin | 20% – 40% | `NOI ÷ Total Revenue` | ⚠️ Warning |
| Rooms Revenue % of Total | 55% – 75% | `Room Revenue ÷ Total Revenue` | ⚠️ Warning |
| F&B Revenue % of Total | 15% – 30% | `F&B Revenue ÷ Total Revenue` | ⚠️ Warning |

### Revenue Mix Validation

Verify the revenue composition adds up to 100% and each stream falls within reasonable bounds:

| Revenue Stream | Expected Range | Default Share Basis |
|---------------|---------------|---------------------|
| Room Revenue | 55% – 75% of Total | Base (1.0 relative) |
| Event Revenue | 15% – 30% of Total | `revShareEvents` (default 43% of Room Rev) |
| F&B Revenue | 10% – 25% of Total | `revShareFB × (1 + cateringBoost)` |
| Other Revenue | 3% – 10% of Total | `revShareOther` (default 7% of Room Rev) |

> **Procedure:** For each property in the model, export the Year 1 stabilized income statement. Calculate revenue percentages and KPIs. Compare against the benchmark table above. Document any outliers with justification.

## 1.3 — Inflation & Escalation Rate Verification

The model uses **two distinct escalation paths**. Verify that each cost category uses the correct rate.

### Escalation Path 1: `fixedCostEscalationRate`

Applies to **property-level fixed operating costs** and **Management Company fixed overhead**. Defaults to `inflationRate` if not explicitly set.

| Cost Category | Entity | Formula | Formula Ref |
|--------------|--------|---------|-------------|
| Admin & General | Property | `cost × (1 + fixedCostEscalationRate)^yearIndex` | F-P-15 |
| Sales & Marketing | Property | `cost × (1 + fixedCostEscalationRate)^yearIndex` | F-P-16 |
| Property Maintenance | Property | `cost × (1 + fixedCostEscalationRate)^yearIndex` | F-P-17 |
| Insurance | Property | `cost × (1 + fixedCostEscalationRate)^yearIndex` | F-P-18 |
| Technology / IT | Property | `cost × (1 + fixedCostEscalationRate)^yearIndex` | F-P-19 |
| Office Lease | Mgmt Co. | `annual ÷ 12 × (1 + fixedCostEscalationRate)^yearIndex` | F-C-07 |
| Professional Services | Mgmt Co. | `annual ÷ 12 × (1 + fixedCostEscalationRate)^yearIndex` | F-C-08 |
| Tech Infrastructure | Mgmt Co. | `annual ÷ 12 × (1 + fixedCostEscalationRate)^yearIndex` | F-C-09 |
| Business Insurance | Mgmt Co. | `annual ÷ 12 × (1 + fixedCostEscalationRate)^yearIndex` | F-C-10 |

### Escalation Path 2: `inflationRate`

Applies to **Management Company variable/per-client costs** and **staff salary escalation**.

| Cost Category | Entity | Formula | Formula Ref |
|--------------|--------|---------|-------------|
| Travel (per client) | Mgmt Co. | `travelCostPerClient × properties ÷ 12 × (1 + inflationRate)^yearIndex` | F-C-11 |
| IT Licensing (per client) | Mgmt Co. | `itLicensePerClient × properties ÷ 12 × (1 + inflationRate)^yearIndex` | F-C-12 |
| Marketing (% of rev) | Mgmt Co. | `portfolioRevenue × marketingRate × (1 + inflationRate)^yearIndex` | F-C-13 |
| Misc Operations (% of rev) | Mgmt Co. | `portfolioRevenue × miscOpsRate × (1 + inflationRate)^yearIndex` | F-C-14 |
| Staff Salary | Mgmt Co. | `staffSalary × (1 + inflationRate)^yearIndex` | F-C-05 |

### Inflation Verification Procedure

1. Set `inflationRate = 3%` and `fixedCostEscalationRate = 5%` (deliberately different values)
2. Export Year 1 and Year 2 financials to Excel
3. For each fixed cost line (admin, marketing, maintenance, insurance, tech): verify Year 2 = Year 1 × 1.05
4. For each variable cost line (travel, IT licensing): verify Year 2 = Year 1 × 1.03
5. Reset `fixedCostEscalationRate` to empty/null and verify it falls back to `inflationRate` (3%)

---

# Phase 2: Calculation Verification

> Cross-validate revenue, cost, and fee formulas with independent hand calculations.

## 2.1 — Single Property Revenue Verification (All-Cash / Full Equity)

Set up a single property with `type = "Full Equity"` (no financing) to eliminate debt complexity.

**Verify the following monthly calculations:**

| Calculation | Formula | Formula Ref |
|-------------|---------|-------------|
| Available Rooms | `Room Count × 30.5` | F-P-01 |
| Sold Rooms | `Available Rooms × Occupancy Rate` | F-P-02 |
| Room Revenue | `Sold Rooms × ADR` | F-P-03 |
| Event Revenue | `Room Revenue × revShareEvents` | F-P-04 |
| F&B Revenue | `Room Revenue × revShareFB × (1 + cateringBoostPercent)` | F-P-05 |
| Other Revenue | `Room Revenue × revShareOther` | F-P-06 |
| Total Revenue | `Room + Event + F&B + Other` | F-P-07 |

**Procedure:**
1. Load the default seed scenario
2. Set one property to Full Equity (all-cash)
3. Export to Excel
4. Manually replicate the first 3 months of calculations in a separate spreadsheet
5. Compare each line item: application output vs. hand calculation

## 2.2 — Operating Expense Verification

Using the same property, verify each expense line item:

| Calculation | Formula | Formula Ref |
|-------------|---------|-------------|
| Rooms Expense | `Room Revenue × costRateRooms` (default 36%) | F-P-11 |
| F&B Expense | `F&B Revenue × costRateFB` (default 32%) | F-P-12 |
| Event Expense | `Event Revenue × eventExpenseRate` (default 65%) | F-P-13 |
| Other Expense | `Other Revenue × otherExpenseRate` (default 60%) | F-P-14 |
| Admin Expense | `Base Rev × costRateAdmin × (1 + fixedCostEscalationRate)^year` | F-P-15 |
| Marketing Expense | `Base Rev × costRateMarketing × (1 + fixedCostEscalationRate)^year` | F-P-16 |
| Maintenance Expense | `Base Rev × costRateMaintenance × (1 + fixedCostEscalationRate)^year` | F-P-17 |
| Insurance Expense | `Base Rev × costRateInsurance × (1 + fixedCostEscalationRate)^year` | F-P-18 |
| Technology Expense | `Base Rev × costRateIT × (1 + fixedCostEscalationRate)^year` | F-P-19 |
| Total Operating Expenses | `Σ(all departmental expenses)` | F-P-22 |

## 2.3 — Profitability Chain Verification

| Calculation | Formula | Formula Ref |
|-------------|---------|-------------|
| GOP | `Total Revenue − Total Operating Expenses` | F-P-23 |
| Base Management Fee | `Total Revenue × baseManagementFee` (default 5%) | F-P-24 |
| Incentive Management Fee | `max(0, GOP × incentiveManagementFee)` (default 15%) | F-P-25 |
| FF&E Reserve | `Total Revenue × costRateFFE` (default 4%) | F-P-26 |
| NOI | `GOP − Base Mgmt Fee − Incentive Mgmt Fee − FF&E Reserve` | F-P-27 |

## 2.4 — Management Fee Linkage Verification

With a single property active, verify that the Management Company's fee revenue equals the property's fee expense:

| Property Side (Expense) | Company Side (Revenue) | Must Match? | Check Ref |
|------------------------|----------------------|-------------|-----------|
| Base Management Fee paid | Base Management Fee earned (F-C-01) | ✅ Exact match | FL-01 |
| Incentive Management Fee paid | Incentive Management Fee earned (F-C-02) | ✅ Exact match | FL-02 |
| Total Fees paid | Total Fee Revenue (F-C-03) | ✅ Exact match | FL-01 + FL-02 |

> **Cross-reference:** `tools/fee-linkage-checks.json` — checks FL-01 through FL-05.

## 2.5 — Acquisition Financing Verification

Change a property from Full Equity to Leveraged. Configure LTV, interest rate, and term.

| Calculation | Formula | Formula Ref |
|-------------|---------|-------------|
| Loan Amount | `Purchase Price × LTV` | `formulas/funding-financing-refi.md` §2.1 |
| Monthly Payment (PMT) | `PMT(rate/12, term×12, -loanAmount)` | `formulas/funding-financing-refi.md` §2.2 |
| Interest Component | `Outstanding Balance × (rate / 12)` | `formulas/funding-financing-refi.md` §2.3 |
| Principal Component | `PMT − Interest` | `formulas/funding-financing-refi.md` §2.3 |
| Outstanding Balance | `Prior Balance − Principal` | `formulas/funding-financing-refi.md` §2.4 |
| Equity Invested | `Total Property Cost − Loan Amount` | F-R-04 |
| Closing Costs | `Loan Amount × closingCostRate` | `formulas/funding-financing-refi.md` §1.2 |

**Verify:** Amortization schedule sums — total interest + total principal = total payments over term.

## 2.6 — Refinancing Event Verification

Enable refinancing on a property (`willRefinance = "Yes"`).

| Calculation | Formula | Formula Ref |
|-------------|---------|-------------|
| Refi Loan Amount | `Property Value at Refi Date × refiLTV` | `formulas/funding-financing-refi.md` §3.1 |
| Net Refi Proceeds | `Refi Loan − Payoff of Original Debt − Refi Closing Costs` | `formulas/funding-financing-refi.md` §3.2 |
| New Monthly PMT | `PMT(refiRate/12, refiTerm×12, -refiLoanAmount)` | `formulas/funding-financing-refi.md` §3.3 |

**Verify:** After the refinance date, debt service switches from the original loan schedule to the new refi schedule. Net refi proceeds appear as a CFF inflow.

## 2.7 — Multiple Properties Consolidation

Add 2–3 properties with different assumptions. Verify:

| Check | Expected Result | Formula Ref |
|-------|----------------|-------------|
| Consolidated Revenue | `Σ` of individual property revenues (per year) | F-X-01 |
| Consolidated GOP | `Σ` of individual property GOPs | F-X-03 |
| Consolidated NOI | `Σ` of individual property NOIs | F-X-04 |
| Mgmt Co. Total Fee Revenue | `Σ` of all property management fee expenses | F-C-01, F-C-02 |
| Dashboard KPI totals | Match consolidated statement totals exactly | — |
| Inter-company fee elimination | Property fee expense = Company fee revenue (net to zero) | F-X-07 |

---

# Phase 3: Financial Statement Reconciliation

> Verify balance sheet balances, cash flow statement reconciles per ASC 230, and income statement ties to downstream statements.

## 3.1 — Balance Sheet: A = L + E

For **every property** and **every period**, verify the fundamental accounting equation:

| Check ID | Check | Formula | Tolerance | Severity |
|----------|-------|---------|-----------|----------|
| BS-01 | Assets = Liabilities + Equity | `Total Assets == Total Liabilities + Total Equity` | ±$0.01 | CRITICAL |
| BS-02 | Accumulated Depreciation Monotonic | `AccumDepr(t) >= AccumDepr(t-1)` | $0 | CRITICAL |
| BS-03 | Cash Non-Negative | `EndingCash >= 0` for all periods | $0 | CRITICAL |
| BS-04 | Debt Outstanding Non-Negative | `DebtOutstanding >= 0` for all periods | $0 | CRITICAL |

> **Cross-reference:** `tools/balance-sheet-checks.json` for automated check schema.

### Balance Sheet Component Verification

| Component | Formula | Formula Ref |
|-----------|---------|-------------|
| Land Value | `Purchase Price × Land Value %` | F-P-28 |
| Depreciable Basis | `Purchase Price × (1 − Land Value %) + Building Improvements` | F-P-29 |
| Monthly Depreciation | `Depreciable Basis ÷ 27.5 ÷ 12` | F-P-30 |
| Total Assets | `Land + (Depreciable Basis − Accum Depr) + Cash` | F-P-34 |
| Total Liabilities | `Outstanding Debt` | F-P-35 |
| Total Equity | `Total Assets − Total Liabilities` | F-P-36 |

### Management Company Balance Sheet

| Component | Formula | Formula Ref |
|-----------|---------|-------------|
| Assets: Cash | `Ending Cash` | F-C-21 |
| Liabilities: SAFE Notes | `Cumulative SAFE Funding Received` | F-C-22 |
| Equity: Retained Earnings | `Cumulative Net Income` | F-C-23 |

### Consolidated Balance Sheet (ASC 810)

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| Total Portfolio Assets | `Σ(Property[i].Total Assets)` | F-X-08 |
| Total Portfolio Liabilities | `Σ(Property[i].Total Liabilities)` | F-X-09 |
| Total Portfolio Equity | `Σ(Property[i].Total Equity)` = F-X-08 − F-X-09 | F-X-10 |

## 3.2 — Cash Flow Reconciliation (ASC 230 Indirect Method)

For **every property** and **every period**, verify the three-section cash flow statement:

| Check ID | Check | Formula | Severity |
|----------|-------|---------|----------|
| CF-01 | Three-section sum | `CFO + CFI + CFF == Net Change in Cash` | CRITICAL |
| CF-02 | Opening cash continuity | `Opening Cash(t) == Closing Cash(t−1)` | CRITICAL |
| CF-03 | Closing cash derivation | `Closing Cash == Opening Cash + Net Change` | CRITICAL |
| CF-04 | Interest classification | Interest expense reduces CFO only (not CFI or CFF) | HIGH |
| CF-05 | Principal classification | Principal payments appear in CFF only (not CFO) | HIGH |
| CF-06 | Depreciation add-back | Depreciation is added back in CFO (non-cash charge) | HIGH |

> **Cross-reference:** `tools/cash-flow-checks.json` for automated check schema.

### Cash Flow Component Formulas

| Component | Formula | Formula Ref |
|-----------|---------|-------------|
| CFO (Operating) | `Net Income + Depreciation` | F-P-37 |
| CFI (Investing) | `−Total Property Cost` (acquisition year only) | F-P-38 |
| CFF (Financing) | `Loan Proceeds − Principal Payments + Equity Invested + Refi Proceeds` | F-P-39 |
| Net Change in Cash | `CFO + CFI + CFF` | F-P-40 |
| Ending Cash | `Opening Cash + Net Change in Cash` | F-P-41 |

## 3.3 — Income Statement Ties

Verify that income statement bottom-line flows through to balance sheet and cash flow:

| Check | Verification |
|-------|-------------|
| Net Income → Cash Flow | Net Income on Income Statement = Net Income starting line in CFO |
| Net Income → Balance Sheet | Cumulative Net Income = Retained Earnings on Balance Sheet |
| Depreciation Consistency | Depreciation on Income Statement = Depreciation add-back in CFO = Period increase in Accumulated Depreciation on Balance Sheet |
| Tax Consistency | `Income Tax = max(0, Taxable Income × Tax Rate)` — verify no negative tax (F-P-32) |

### Income Statement Formulas

| Component | Formula | Formula Ref |
|-----------|---------|-------------|
| Taxable Income | `NOI − Interest Expense − Depreciation` | F-P-31 |
| Income Tax | `max(0, Taxable Income × Tax Rate)` | F-P-32 |
| GAAP Net Income | `NOI − Interest − Depreciation − Income Tax` | F-P-33 |

---

# Phase 4: IRR / DCF / FCF Verification

> Validate investment return analytics: NPV≈0 at calculated IRR, FCF derivation, DCF terminal value.

## 4.1 — Free Cash Flow (FCF) Verification

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| Unlevered FCF | `FCF = NOI − Income Tax − Capital Expenditures (FF&E)` | F-R-01 |
| Levered FCFE | `FCFE = FCF − Debt Service + Net Borrowings` | F-R-02 |
| Alternative FCFE | `FCFE = NOI − Debt Service − Income Tax` (must equal F-R-02) | F-R-03 |

**Verification:** Calculate both FCFE formulas independently (F-R-02 and F-R-03). They must produce the same result within rounding tolerance (±$0.01).

### FCF = NI + D&A ± Working Capital ± CFF Cross-Check

For the simplified model (no working capital changes), verify:
```
FCF = Net Income + Depreciation & Amortization − Capital Expenditures
FCFE = FCF − Principal Payments + Net Borrowing Proceeds
```

## 4.2 — IRR (NPV ≈ 0) Test

The IRR is the discount rate `r` that makes NPV equal to zero. To verify:

1. **Extract** the IRR value displayed in the application for a given property
2. **Extract** the FCFE cash flow vector: `[−Equity₀, FCFE₁, FCFE₂, ..., FCFE_N + Exit Proceeds]` (F-R-07)
3. **Discount** each cash flow: `PV_t = CF_t ÷ (1 + IRR)^t`
4. **Sum** all present values: `NPV = Σ(PV_t)`
5. **Verify:** `|NPV| < $1.00` (should be approximately zero)

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| IRR Cash Flow Vector | `[−Equity, FCFE₁, ..., FCFE_N + Exit Proceeds]` | F-R-07 |
| NPV at IRR | `Σ(FCFE_t ÷ (1 + IRR)^t) ≈ 0` | F-R-06 |
| Solution Method | Newton-Raphson iteration | F-R-08 |

> **Tolerance:** NPV at the calculated IRR should be within ±$1.00 of zero. Larger deviations indicate an IRR solver convergence issue.

## 4.3 — Equity Multiple (MOIC) Verification

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| Equity Multiple | `Total Distributions ÷ Total Equity Invested` | F-R-09 |
| Total Distributions | `Σ(FCFE) + Refi Proceeds + Net Exit Proceeds` | F-R-10 |

**Verify:** The equity multiple displayed matches the hand-calculated value. A multiple of 2.0× means the investor doubled their money.

## 4.4 — Exit / Terminal Value Verification

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| Gross Disposition Value | `Terminal Year NOI ÷ Exit Cap Rate` | F-R-11 |
| Sales Commission | `Gross Disposition Value × Commission Rate` (default 5%) | F-R-12 |
| Outstanding Debt at Exit | Amortized loan balance at terminal year | F-R-13 |
| Net Proceeds to Equity | `Gross Value − Commission − Outstanding Debt` | F-R-14 |
| Debt-Free Rule | All debt must be repaid at exit | F-R-15, BC-04 |

### DCF Terminal Value Reasonableness

Check that the terminal value is reasonable relative to total portfolio value:

| Reasonableness Check | Expected Range |
|---------------------|---------------|
| Terminal Value as % of Total NPV | 40% – 70% (typical for 10-year holds) |
| Exit Cap Rate vs. Entry Cap Rate | Exit cap rate ≥ entry cap rate (conservative) |
| Terminal NOI growth implied | Should not exceed inflation + 1–2% |

## 4.5 — Portfolio IRR Verification

| Check | Formula | Formula Ref |
|-------|---------|-------------|
| Portfolio Cash Vector | `[−Σ(Equity), Σ(FCFE₁), ..., Σ(FCFE_N) + Σ(Exit Proceeds)]` | F-R-16 |
| Portfolio IRR | Solve for `r` using aggregated vector | F-R-17 |

---

# Phase 5: Scenario & Stress Testing

> Test edge cases, boundary conditions, and extreme configurations. Create saved scenarios to systematically compare results.

> **IMPORTANT: Checkers can and should create saved scenarios to test different assumption configurations. Use the Scenarios feature to save baseline states, apply changes, and compare results. This is the most efficient way to run through stress tests without losing your reference point.**

## 5.1 — Scenario Persistence Verification

1. Save the current state as a named scenario
2. Make significant changes (add/remove properties, alter assumptions)
3. Load the saved scenario
4. Verify all assumptions, properties, and financials revert to the saved state exactly

## 5.2 — Global Assumption Cascade

Change a global assumption (e.g., `inflationRate` or `baseManagementFee`). Verify:

| Check | Expected Behavior |
|-------|-------------------|
| All property cost escalation | Operating costs adjust by the new rate in subsequent years |
| All property fee expenses | Recalculate using the new management fee rate |
| Management Company revenue | Updates to reflect new fee rates across all properties |
| Dashboard totals | Reflect the cascading changes immediately |
| Instant recalculation | All downstream statements update without page reload |

## 5.3 — Edge Case Matrix

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| 5.3.1 | Zero revenue months (pre-operations) | Revenue = $0 for months before `operationsStartDate`; expenses begin at operations start |
| 5.3.2 | 100% LTV acquisition (zero equity) | Loan Amount = Purchase Price; Equity = Building Improvements + Pre-Opening + Reserve + Closing Costs only |
| 5.3.3 | Very high cap rate (15%+) | Exit value decreases significantly; IRR may turn negative; no system error |
| 5.3.4 | Very low cap rate (2%–3%) | Exit value increases dramatically; no overflow or rendering issues |
| 5.3.5 | Negative NOI scenario | Revenue < Expenses; NOI goes negative; cash balance may deplete; no division-by-zero in ratios |
| 5.3.6 | Mid-year property acquisition | Property appears in consolidated financials only for operational months; partial-year revenue |
| 5.3.7 | Fiscal year crossover | If `fiscalYearStartMonth ≠ 1` (e.g., April), monthly-to-annual bucketing aligns correctly |
| 5.3.8 | Maximum projection period (10 years) | All arrays sized correctly; no index-out-of-bounds; charts render all 10 years |
| 5.3.9 | Remove all properties | Management Company fee revenue = $0; Dashboard KPIs = $0; consolidated statements show zeros |
| 5.3.10 | Simultaneous refinance and exit year | Refinance occurs in same fiscal year as terminal exit; both cash flows captured |
| 5.3.11 | Zero room count | Revenue = $0; all percentage-based calculations produce $0 (not NaN or errors) |
| 5.3.12 | Zero ADR | Revenue = $0; downstream calculations gracefully handle zero revenue base |

## 5.4 — Business Constraint Enforcement

Verify the 5 Mandatory Business Rules from `tools/constraint-checks.json`:

| Check ID | Rule | Verification Method |
|----------|------|-------------------|
| BC-01 | Mgmt Co. Funding Gate | Set `companyOpsStartDate` before `safeTranche1Date` — system must block/flag |
| BC-02 | Property Activation Gate | Set `operationsStartDate` before `acquisitionDate` — system must block/flag |
| BC-03 | No Negative Cash | Reduce revenue to cause cash depletion — `EndingCash >= 0` must hold |
| BC-04 | Debt-Free at Exit | Verify outstanding loan balance is repaid from sale proceeds at disposition |
| BC-05 | No Over-Distribution | Verify distributions cannot exceed available cash |

## 5.5 — Stress Test Scenarios (Save as Named Scenarios)

Create and save the following stress test scenarios for comparison:

| Scenario Name | Configuration | Key Metric to Watch |
|--------------|--------------|-------------------|
| "Baseline" | Default seed assumptions | Reference point for all comparisons |
| "Bear Case" | ADR −20%, Occupancy 55%, Inflation 5% | NOI margin, cash runway, IRR |
| "Bull Case" | ADR +20%, Occupancy 85%, Inflation 2% | IRR, equity multiple, exit value |
| "High Leverage" | LTV 90%, Interest Rate 11% | DSCR, cash-after-debt, negative NOI risk |
| "Zero Debt" | All properties Full Equity | Unlevered IRR, FCF vs FCFE convergence |
| "Rapid Expansion" | 5+ properties, staggered acquisition dates | Consolidation accuracy, fee linkage |

---

# Phase 6: Reports & Exports Completeness

> Verify all export formats generate correctly, exported values match on-screen display, and charts render properly.

## 6.1 — Export Format Verification

| Export Format | Source Page(s) | Verify |
|--------------|---------------|--------|
| Excel (.xlsx) | All financial statements, Settings | File generates without error; all sheets present; formulas/values match on-screen |
| CSV (.csv) | Financial statements | File generates; column headers correct; data parseable |
| PDF | Checker Manual, financial statements | Renders correctly; page breaks clean; all sections included |
| PNG | Charts | Image captures complete chart; no clipping; labels readable |
| PowerPoint (.pptx) | Portfolio summary | Slides generate; data matches source |

## 6.2 — Value Accuracy Checks

For each export format, verify a sample of values:

| Check | Method |
|-------|--------|
| Revenue totals | Compare exported Year 1 Total Revenue to on-screen value |
| NOI | Compare exported NOI to on-screen NOI for each property |
| IRR | Compare exported IRR to on-screen IRR |
| Balance sheet equation | In exported data: verify `Assets = Liabilities + Equity` |
| Monthly → Annual aggregation | Sum exported monthly values; compare to exported annual totals |

## 6.3 — Chart Rendering Verification

| Chart Type | Verify |
|-----------|--------|
| Revenue waterfall | All revenue streams present; bars sum to total |
| Cash flow timeline | CFO, CFI, CFF sections visible; net change line accurate |
| IRR sensitivity | Axes labeled; data points match underlying sensitivity table |
| Portfolio comparison | All properties represented; correct color coding |
| Occupancy ramp | Ramp curve matches configured ramp months and start/max occupancy |

## 6.4 — Excel Export Deep Verification

| Check | Expected Result |
|-------|----------------|
| Column headers | Align with fiscal years (not calendar years if fiscal year ≠ January) |
| Monthly detail sheets | If exported, monthly values aggregate correctly to annual totals |
| Cell formatting | Currency cells formatted as currency; percentage cells as percentage |
| Multiple properties | Each property on a separate sheet or clearly labeled section |
| Management Company | Separate sheet with fee revenue matching property fee expenses |

---

# Phase 7: Documentation & Sign-Off

> Formalize the audit opinion, complete the final checklist, and sign off on the verification.

## 7.1 — Audit Opinion Framework

After completing Phases 1–6, the checker must issue one of three opinions:

### UNQUALIFIED (Clean Opinion)

> All calculations verified. All financial statements reconcile. All business rules enforced. No material discrepancies found.

**Criteria:**
- All Phase 1 defaults match `shared/constants.ts` ✅
- All Phase 2 hand calculations match application output within ±$0.01 ✅
- All Phase 3 balance sheet and cash flow checks pass ✅
- Phase 4 IRR NPV test passes (|NPV| < $1.00 at calculated IRR) ✅
- All Phase 5 edge cases handled without errors ✅
- All Phase 6 exports generate correctly with matching values ✅

### QUALIFIED (Clean with Exceptions)

> Calculations are materially correct, but specific exceptions were identified that do not invalidate the overall model.

**Criteria:**
- One or more tests failed but the failure is **immaterial** (< 1% variance)
- Rounding differences between IEEE 754 and Excel-style rounding
- Cosmetic issues in exports that do not affect numerical accuracy
- Edge cases that produce warnings but not errors

**Required:** List each exception with test ID, expected value, actual value, and variance percentage.

### ADVERSE (Material Misstatement)

> Material calculation errors were found that affect the reliability of the financial model.

**Criteria:**
- Any Phase 2 calculation differs by > 1% from hand-calculated expectation
- Any Phase 3 balance sheet fails to balance (|A − (L + E)| > $0.01)
- Phase 4 IRR NPV test fails (|NPV| > $100 at calculated IRR)
- Any Phase 5 business constraint (BC-01 through BC-05) is not enforced
- Exported values differ from on-screen values

**Required:** Detailed finding report for each material misstatement with reproduction steps.

## 7.2 — Final Sign-Off Checklist

| Phase | Check | Status |
|-------|-------|--------|
| **Phase 1** | | |
| 1.1 | All defaults match `shared/constants.ts` | ☐ |
| 1.2 | USALI benchmark ranges reviewed; outliers documented | ☐ |
| 1.3 | Inflation escalation paths verified (fixed vs. variable) | ☐ |
| **Phase 2** | | |
| 2.1 | Single property revenue formulas verified | ☐ |
| 2.2 | Operating expense formulas verified | ☐ |
| 2.3 | Profitability chain (GOP → NOI) verified | ☐ |
| 2.4 | Management fee linkage verified (property expense = company revenue) | ☐ |
| 2.5 | Acquisition financing (PMT, amortization schedule) verified | ☐ |
| 2.6 | Refinancing event verified | ☐ |
| 2.7 | Multi-property consolidation verified | ☐ |
| **Phase 3** | | |
| 3.1 | Balance sheet A = L + E for all properties and periods | ☐ |
| 3.2 | Cash flow CFO + CFI + CFF = Net Change for all periods | ☐ |
| 3.3 | Income statement ties to balance sheet and cash flow | ☐ |
| **Phase 4** | | |
| 4.1 | FCF and FCFE formulas verified | ☐ |
| 4.2 | IRR NPV ≈ 0 test passed | ☐ |
| 4.3 | Equity multiple verified | ☐ |
| 4.4 | Exit/terminal value verified | ☐ |
| 4.5 | Portfolio IRR verified | ☐ |
| **Phase 5** | | |
| 5.1 | Scenario save/load integrity verified | ☐ |
| 5.2 | Global assumption cascade verified | ☐ |
| 5.3 | Edge cases (5.3.1–5.3.12) tested | ☐ |
| 5.4 | Business constraints (BC-01–BC-05) enforced | ☐ |
| 5.5 | Stress test scenarios saved and compared | ☐ |
| **Phase 6** | | |
| 6.1 | All export formats generate without errors | ☐ |
| 6.2 | Exported values match on-screen display | ☐ |
| 6.3 | Charts render correctly | ☐ |
| 6.4 | Excel export deep verification completed | ☐ |
| **Phase 7** | | |
| 7.1 | Audit opinion issued (UNQUALIFIED / QUALIFIED / ADVERSE) | ☐ |
| 7.2 | This checklist completed and signed | ☐ |

## 7.3 — Discrepancy Resolution Protocol

If a test fails (actual ≠ expected):

| Step | Action |
|------|--------|
| 1 | Re-verify hand calculation using the formula from `formulas/` directory |
| 2 | Check assumption values — were defaults applied where you expected user values? |
| 3 | Check fiscal year alignment — is the month bucketed into the correct year? |
| 4 | Check rounding — the engine uses IEEE 754 double-precision; Excel may round differently |
| 5 | Check escalation rate used — was `fixedCostEscalationRate` applied when `inflationRate` was expected, or vice versa? |
| 6 | If confirmed bug: document test ID, input values, expected output, actual output, and file/function involved |

> **Cross-reference:** `tools/constraint-checks.json` for automated validation rules and `tools/balance-sheet-checks.json` for the A = L + E verification schema.

## 7.4 — Sign-Off Record

```
Checker Name:     ____________________________
Date:             ____________________________
Audit Opinion:    ☐ UNQUALIFIED  ☐ QUALIFIED  ☐ ADVERSE
Exceptions (if QUALIFIED):
  1. ___________________________________________
  2. ___________________________________________
  3. ___________________________________________
Material Findings (if ADVERSE):
  1. ___________________________________________
  2. ___________________________________________

Signature:        ____________________________
```

---

## Quick Reference: Formula File Cross-References

| Formula File | Contents | Key IDs |
|-------------|----------|---------|
| `formulas/property-financials.md` | Revenue, expenses, profitability, depreciation, income statement, balance sheet, cash flow | F-P-01 through F-P-41 |
| `formulas/company-financials.md` | Mgmt Co. revenue, expenses, cash flow, balance sheet | F-C-01 through F-C-23 |
| `formulas/consolidated.md` | Portfolio aggregation, inter-company eliminations | F-X-01 through F-X-10 |
| `formulas/dcf-fcf-irr.md` | FCF, FCFE, IRR, equity multiple, exit value, portfolio IRR | F-R-01 through F-R-17 |
| `formulas/funding-financing-refi.md` | SAFE funding, acquisition debt, refinancing | §1 through §3 |

## Quick Reference: Tool Schema Cross-References

| Tool Schema | Contents | Key IDs |
|------------|----------|---------|
| `tools/balance-sheet-checks.json` | A = L + E, depreciation monotonicity, cash/debt non-negative | BS-01 through BS-04 |
| `tools/cash-flow-checks.json` | CFO+CFI+CFF reconciliation, opening cash continuity, classification | CF-01 through CF-06 |
| `tools/fee-linkage-checks.json` | Base/incentive fee consistency, fee calculation, fee floor | FL-01 through FL-05 |
| `tools/constraint-checks.json` | 5 Mandatory Business Rules (funding gate, activation, cash, debt-free, no over-distribution) | BC-01 through BC-05 |
