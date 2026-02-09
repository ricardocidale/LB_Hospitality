# Investment Returns

## Section ID: `returns`

## Content Summary
How the model calculates investor returns:

### Exit Value
```
Exit Value = Final Year NOI ÷ Exit Cap Rate
Net Proceeds = Exit Value − Commission − Outstanding Debt
```
- Exit Cap Rate: `DEFAULT_EXIT_CAP_RATE` (8.5%)
- Commission: `DEFAULT_COMMISSION_RATE` (5%)

### Return Metrics
- **IRR (Internal Rate of Return)**: Newton-Raphson solver applied to the full cash flow timeline (equity invested, FCF distributions, exit proceeds)
- **Equity Multiple (MOIC)**: Total distributions ÷ Total equity invested
- **Cash-on-Cash Return**: Annual FCF ÷ Equity invested

### IRR Calculation
- Uses `analytics/returns/` engine with Newton-Raphson iteration
- Cash flows: negative (equity in) → positive (FCF distributions) → large positive (exit proceeds)
- IRR above `IRR_HIGHLIGHT_THRESHOLD` (15%) shown with accent color in UI

## Cross-References
- Formulas: `.claude/checker-manual/formulas/dcf-fcf-irr.md`
- Engine: `analytics/returns/` (Skill 6)
- Constants: `DEFAULT_EXIT_CAP_RATE`, `DEFAULT_COMMISSION_RATE`, `IRR_HIGHLIGHT_THRESHOLD`
