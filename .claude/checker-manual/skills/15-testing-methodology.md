# 15 — Testing Methodology for the Checker

> **CRITICAL SECTION.** This document defines the structured, phased approach that checkers must follow to verify the correctness of all financial calculations, data flows, and system behaviors in the L+B Hospitality Business Simulation Portal.

---

## Core Verification Principle

Every financial output in this application is **deterministic** — the same inputs must always produce the same outputs. The checker's role is to independently verify that the application's outputs match hand-calculated expected results derived from the documented formulas.

---

## Phase 1: Simple Scenarios (Start Here)

Begin with the simplest possible configurations to establish a baseline of trust in the calculation engine.

### Test 1.1 — Single Property, All-Cash Acquisition (No Debt)

Set up a single property with `type = "Full Equity"` (no financing). This eliminates debt service, interest expense, and amortization from the verification scope.

**Verify the following monthly calculations:**

| Calculation | Formula | Formula Reference |
|-------------|---------|-------------------|
| Room Revenue | `ADR × Occupancy × Rooms × 30.5` | `formulas/property-financials.md` §2.1 |
| Event Revenue | `Room Revenue × revShareEvents` | `formulas/property-financials.md` §2.2 |
| F&B Revenue | `Room Revenue × revShareFB × (1 + cateringBoostPercent)` | `formulas/property-financials.md` §2.3 |
| Other Revenue | `Room Revenue × revShareOther` | `formulas/property-financials.md` §2.4 |
| Total Revenue | `Room + Event + F&B + Other` | — |
| Operating Expenses | `Σ (costRate_i × Total Revenue)` for each cost category | `formulas/property-financials.md` §3 |
| GOP | `Total Revenue − Operating Expenses` | `formulas/property-financials.md` §3 |
| Base Management Fee | `Total Revenue × baseManagementFee` | `formulas/company-financials.md` §1.1 |
| Incentive Management Fee | `GOP × incentiveManagementFee` | `formulas/company-financials.md` §1.2 |
| FF&E Reserve | `Total Revenue × costRateFFE` | `formulas/property-financials.md` §3 |
| NOI | `GOP − Management Fees − FF&E Reserve` | `formulas/property-financials.md` §4 |

**Procedure:**
1. Load the default seed scenario
2. Set one property to Full Equity (all-cash)
3. Export to Excel
4. Manually replicate the first 3 months of calculations in a separate spreadsheet
5. Compare each line item: application output vs. hand calculation

### Test 1.2 — Management Company Fee Linkage

With a single property active, verify that the Management Company's fee revenue equals the property's fee expense:

| Property Side (Expense) | Management Company Side (Revenue) | Must Match? |
|------------------------|----------------------------------|-------------|
| Base Management Fee paid | Base Management Fee earned | ✅ Exact match |
| Incentive Management Fee paid | Incentive Management Fee earned | ✅ Exact match |
| Total Fees paid | Total Fee Revenue | ✅ Exact match |

> **Cross-reference:** See `formulas/company-financials.md` §1 and `tools/fee-linkage-checks.json`.

### Test 1.3 — Excel Export Accuracy

Export both the property financials and Management Company financials to Excel. Verify:
- All values in the Excel export match the on-screen display
- Column headers align with fiscal years
- Monthly detail (if exported) aggregates correctly to annual totals

---

## Phase 2: Moderate Complexity

### Test 2.1 — Add Acquisition Financing

Change a property from Full Equity to Leveraged. Configure LTV, interest rate, and term.

| Calculation | Formula | Formula Reference |
|-------------|---------|-------------------|
| Loan Amount | `Purchase Price × LTV` | `formulas/funding-financing-refi.md` §2.1 |
| Monthly Payment (PMT) | `PMT(rate/12, term×12, -loanAmount)` | `formulas/funding-financing-refi.md` §2.2 |
| Interest Component | `Outstanding Balance × (rate / 12)` | `formulas/funding-financing-refi.md` §2.3 |
| Principal Component | `PMT − Interest` | `formulas/funding-financing-refi.md` §2.3 |
| Outstanding Balance | `Prior Balance − Principal` | `formulas/funding-financing-refi.md` §2.4 |
| Equity Invested | `Total Property Cost − Loan Amount` | `formulas/funding-financing-refi.md` §1 |
| Closing Costs | `Loan Amount × closingCostRate` | `formulas/funding-financing-refi.md` §1.2 |

**Verify:** Amortization schedule sums (total interest + total principal = total payments over term).

### Test 2.2 — Multiple Properties Consolidation

Add 2–3 properties with different assumptions. Verify:

| Check | Expected Result |
|-------|----------------|
| Consolidated Revenue | Σ of individual property revenues (per year) |
| Consolidated GOP | Σ of individual property GOPs |
| Consolidated NOI | Σ of individual property NOIs |
| Management Company Total Fee Revenue | Σ of all property management fee expenses |
| Dashboard KPI totals | Match consolidated statement totals exactly |

### Test 2.3 — Refinancing Event

Enable refinancing on a property (`willRefinance = "Yes"`). Verify:

| Calculation | Formula | Formula Reference |
|-------------|---------|-------------------|
| Refi Loan Amount | `Property Value at Refi Date × refiLTV` | `formulas/funding-financing-refi.md` §3.1 |
| Net Refi Proceeds | `Refi Loan − Payoff of Original Debt − Refi Closing Costs` | `formulas/funding-financing-refi.md` §3.2 |
| New Monthly PMT | `PMT(refiRate/12, refiTerm×12, -refiLoanAmount)` | `formulas/funding-financing-refi.md` §3.3 |

**Verify:** After the refinance date, debt service switches from the original loan schedule to the new refi schedule. Net refi proceeds appear as a CFF inflow.

### Test 2.4 — Global Assumption Cascade

Change a global assumption (e.g., `inflationRate` or `baseManagementFee`). Verify:

| Check | Expected Behavior |
|-------|-------------------|
| All property cost escalation | Operating costs adjust by the new inflation rate in subsequent years |
| All property fee expenses | Recalculate using the new management fee rate |
| Management Company revenue | Updates to reflect new fee rates across all properties |
| Dashboard totals | Reflect the cascading changes immediately |

### Test 2.5 — Scenario Persistence

1. Save the current state as a named scenario
2. Make significant changes (add/remove properties, alter assumptions)
3. Load the saved scenario
4. Verify all assumptions, properties, and financials revert to the saved state exactly

---

## Phase 3: Edge Cases

These tests verify system behavior at boundary conditions and unusual configurations.

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| 3.1 | Zero revenue months (property not yet operating) | Revenue = $0 for months before `operationsStartDate`; expenses begin at operations start |
| 3.2 | 100% LTV acquisition (zero equity) | Loan Amount = Purchase Price; Equity Invested = Building Improvements + Pre-Opening + Reserve + Closing Costs only |
| 3.3 | Very high cap rate (15%+) | Exit value decreases significantly; IRR may turn negative; system should not error |
| 3.4 | Very low cap rate (2%–3%) | Exit value increases dramatically; verify no overflow or rendering issues |
| 3.5 | Negative NOI scenario | Revenue < Expenses; NOI goes negative; cash balance may deplete; verify no division-by-zero in ratios |
| 3.6 | Mid-year property acquisition | Property appears in consolidated financials only for the months it is operational; partial-year revenue |
| 3.7 | Fiscal year crossover | If `fiscalYearStartMonth ≠ 1` (e.g., April), verify monthly-to-annual bucketing aligns correctly |
| 3.8 | Maximum projection period (10 years) | All arrays sized correctly; no index-out-of-bounds; charts render all 10 years |
| 3.9 | Remove all properties | Management Company fee revenue = $0; Dashboard KPIs = $0; consolidated statements show zeros |
| 3.10 | Simultaneous refinance and exit year | Refinance occurs in the same fiscal year as the terminal exit; verify both cash flows are correctly captured |
| 3.11 | Zero room count | Revenue = $0; all percentage-based calculations produce $0 (not NaN or errors) |
| 3.12 | Zero ADR | Revenue = $0; downstream calculations gracefully handle zero revenue base |

---

## Standard Test Execution Protocol

**For every test**, follow this six-step protocol:

| Step | Action | Purpose |
|------|--------|---------|
| 1 | **Document Setup** | Record which assumptions were changed and their values |
| 2 | **Export Baseline** | Export current state to Excel/CSV before making changes |
| 3 | **Make the Change** | Apply the specific assumption or configuration change being tested |
| 4 | **Export New State** | Export the updated state to Excel/CSV |
| 5 | **Compare** | In a spreadsheet, compare expected results (hand-calculated) vs. actual (exported) |
| 6 | **Log Results** | Record pass/fail status, any discrepancies, and observations in the activity feed |

---

## Test Checklist

Use the following checklist to track verification progress. Each test should be marked with a status upon completion.

| Test ID | Category | Description | Expected Result | Status |
|---------|----------|-------------|-----------------|--------|
| 1.1 | Phase 1 | Single property, all-cash — verify revenue formula | Room Rev = ADR × Occ × Rooms × 30.5 | ☐ |
| 1.2 | Phase 1 | Single property, all-cash — verify GOP | GOP = Total Rev − OpEx | ☐ |
| 1.3 | Phase 1 | Single property, all-cash — verify NOI | NOI = GOP − Mgmt Fees − FF&E | ☐ |
| 1.4 | Phase 1 | Fee linkage — property expense = company revenue | Exact match per fee type | ☐ |
| 1.5 | Phase 1 | Excel export matches on-screen values | All cells match | ☐ |
| 2.1 | Phase 2 | Leveraged acquisition — PMT formula | PMT matches Excel PMT() | ☐ |
| 2.2 | Phase 2 | Leveraged — amortization schedule integrity | Total P + I = Total PMT × n | ☐ |
| 2.3 | Phase 2 | Multi-property consolidation | Σ individual = consolidated | ☐ |
| 2.4 | Phase 2 | Refinancing — net proceeds | Refi Loan − Payoff − Costs | ☐ |
| 2.5 | Phase 2 | Refinancing — debt service switch | New PMT active post-refi date | ☐ |
| 2.6 | Phase 2 | Global assumption cascade | All properties recalculate | ☐ |
| 2.7 | Phase 2 | Scenario save/load | State fully restored | ☐ |
| 3.1 | Phase 3 | Pre-operations zero revenue | Revenue = $0 before ops start | ☐ |
| 3.2 | Phase 3 | 100% LTV | Loan = Purchase Price; equity = ancillary costs only | ☐ |
| 3.3 | Phase 3 | High cap rate (15%+) | Low exit value; no system error | ☐ |
| 3.4 | Phase 3 | Low cap rate (2%–3%) | High exit value; no overflow | ☐ |
| 3.5 | Phase 3 | Negative NOI | Graceful handling; no NaN | ☐ |
| 3.6 | Phase 3 | Mid-year acquisition | Partial-year in consolidation | ☐ |
| 3.7 | Phase 3 | Fiscal year crossover | Correct monthly bucketing | ☐ |
| 3.8 | Phase 3 | 10-year projection | All data renders correctly | ☐ |
| 3.9 | Phase 3 | Zero properties | All KPIs = $0; no errors | ☐ |
| 3.10 | Phase 3 | Simultaneous refi + exit | Both cash flows captured | ☐ |
| 3.11 | Phase 3 | Zero rooms | Revenue = $0; no NaN | ☐ |
| 3.12 | Phase 3 | Zero ADR | Revenue = $0; no NaN | ☐ |

---

## Discrepancy Resolution

If a test fails (actual ≠ expected):

| Step | Action |
|------|--------|
| 1 | Re-verify hand calculation using the formula from `formulas/` |
| 2 | Check assumption values — were defaults applied where you expected user values? |
| 3 | Check fiscal year alignment — is the month bucketed into the correct year? |
| 4 | Check rounding — the engine uses IEEE 754 double-precision; Excel may round differently |
| 5 | If confirmed bug, document: test ID, input values, expected output, actual output, and file/function involved |

> **Cross-reference:** See `tools/constraint-checks.json` for automated validation rules and `tools/balance-sheet-checks.json` for the A = L + E verification schema.
