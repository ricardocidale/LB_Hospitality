# GOP and NOI

## Section ID: `noi-gop`

## Content Summary
Two key profitability metrics:

### Gross Operating Profit (GOP)
```
GOP = Total Revenue − Department Expenses (Rooms + F&B + Events + Other)
```
- Measures property-level operational efficiency
- Does not include undistributed expenses or management fees
- Typical GOP margin for stabilized boutique hotel: 40-60%

### Net Operating Income (NOI)
```
NOI = GOP − Undistributed Expenses − Management Fees − FF&E Reserve
```
- Key metric for property valuation (used in cap rate calculation)
- Does NOT include interest, depreciation, or income tax
- Typical NOI margin: 15-45% for stabilized hotel

### Management Fees (deducted from GOP to get NOI)
- Base fee: `baseManagementFee` (default 5%) × Total Revenue
- Incentive fee: `incentiveManagementFee` (default 15%) × GOP above threshold

## Cross-References
- Formulas: `.claude/manuals/checker-manual/formulas/property-financials.md` § GOP, NOI
- Rules: `.claude/rules/financial-engine.md` → "Profitability"
