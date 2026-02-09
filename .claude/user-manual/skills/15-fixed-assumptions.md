# Fixed Assumptions (Not Configurable)

## Section ID: `fixed-assumptions`

## Content Summary
Two immutable constants built into the calculation engine. Rendered with `Callout severity="warning"`.

### Immutable Constants

| Constant | Value | Source | Rationale |
|----------|-------|--------|-----------|
| `DEPRECIATION_YEARS` | 27.5 years | IRS Publication 946 / ASC 360 | Tax law for residential rental property. Cannot be changed. |
| `DAYS_PER_MONTH` | 30.5 days | Industry standard (365 ÷ 12) | Hotel revenue calculation convention. |

### Now Configurable (Callout severity="success")
Parameters that were previously fixed but are now adjustable in Company Assumptions:
- Exit Cap Rate (default 8.5%)
- Tax Rate (default 25%)
- Sales Commission (default 5%)
- Loan terms (LTV, interest rate, amortization period)
- Revenue shares (events, F&B, other)

## Cross-References
- Constants: `.claude/rules/constants-and-config.md` → "Immutable Constants"
- GAAP: ASC 360 (depreciation), IRS Publication 946
