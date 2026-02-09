# Balance Sheet

## Section ID: `balance-sheet`

## Content Summary
GAAP-compliant balance sheet with runtime validation:

### Assets
- **Cash**: Cumulative operating cash flow + reserves + refinance proceeds
- **Property Value**: Purchase Price + Building Improvements − Accumulated Depreciation
- **Land**: Non-depreciable portion of purchase price

### Liabilities
- **Debt Outstanding**: Loan balance after principal payments
- **Accrued Expenses**: Current period obligations

### Equity
- **Invested Capital**: Original equity contribution
- **Retained Earnings**: Cumulative net income − distributions

### Fundamental Equation
```
Assets = Liabilities + Equity (every period)
```
- Validated at runtime — variance > $1 triggers visible warning
- This is a FASB Conceptual Framework requirement

### Depreciation (ASC 360)
```
Monthly Depreciation = Depreciable Basis ÷ 27.5 ÷ 12
Depreciable Basis = Purchase Price × (1 − Land %) + Building Improvements
```
- 27.5-year useful life is IRS-mandated (Publication 946)
- Straight-line method, no salvage value
- Begins first full month after acquisition

## Cross-References
- Formulas: `.claude/checker-manual/formulas/property-financials.md` § Balance Sheet
- GAAP: ASC 360 (PP&E), FASB Conceptual Framework
- Constant: `DEPRECIATION_YEARS = 27.5` (immutable)
