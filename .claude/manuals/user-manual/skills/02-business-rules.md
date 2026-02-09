# Business Rules & Constraints

## Section ID: `business-rules`

## Content Summary
Seven mandatory financial rules enforced across the entire model. These are non-negotiable constraints — rendered as `Callout severity="critical"` in the UI.

### The 7 Rules

1. **Income Statement: Interest Only, Never Principal** — Net Income = NOI − Interest − Depreciation − Tax. Principal is a financing activity (ASC 470), not an expense.

2. **Debt-Free at Exit** — All outstanding debt is repaid from gross sale proceeds at the end of the projection period.

3. **No Negative Cash** — Cash balances for each property, the management company, and the portfolio must never go negative.

4. **No Over-Distribution** — FCF distributions and refinancing proceeds must not be distributed to the point that any entity's cash goes negative.

5. **Capital Sources on Separate Lines** — Equity, loan proceeds, and refinancing proceeds must always appear as separate line items in all reports.

6. **Funding Gates** — Management company cannot operate before SAFE funding; properties cannot operate before acquisition/funding.

7. **Balance Sheet Must Balance** — Assets = Liabilities + Equity every period, validated at runtime.

## Cross-References
- Rules: `.claude/rules/financial-engine.md` → "Mandatory Business Rules"
- GAAP: ASC 230 (cash flows), ASC 470 (debt), ASC 360 (PP&E)
