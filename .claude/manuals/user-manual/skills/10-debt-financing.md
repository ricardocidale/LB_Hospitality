# Debt & Financing

## Section ID: `debt`

## Content Summary
Loan calculations for financed properties. Rendered with `ManualTable` for default loan parameters.

### Acquisition Loan
- LTV: `DEFAULT_LTV` (75%)
- Interest Rate: `DEFAULT_INTEREST_RATE` (9%)
- Term: `DEFAULT_TERM_YEARS` (25 years)
- Closing Costs: `DEFAULT_ACQ_CLOSING_COST_RATE` (2%)

### PMT Formula
```
PMT = P × r × (1+r)^n / ((1+r)^n − 1)
```
Where P = principal, r = monthly rate, n = total months

### Interest vs Principal (ASC 470)
- Interest = Outstanding Balance × Monthly Rate → **income statement expense**
- Principal = PMT − Interest → **financing activity only (NOT an expense)**
- Over time: interest decreases, principal increases (standard amortization)

### Refinancing
- New loan at `DEFAULT_REFI_LTV` (65%) of appraised value
- Closing costs: `DEFAULT_REFI_CLOSING_COST_RATE` (3%)
- Old loan fully paid off
- Excess proceeds returned to investors

## Cross-References
- Formulas: `.claude/manuals/checker-manual/formulas/funding-financing-refi.md`
- PMT source: `calc/shared/pmt.ts`
- Constants: `DEFAULT_LTV`, `DEFAULT_INTEREST_RATE`, `DEFAULT_TERM_YEARS`
