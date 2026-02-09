# Capital Structure & Investor Returns

## Section ID: `capital-lifecycle`

## Content Summary
Explains the three sources of capital and the investor return path:

### Capital Sources
1. **Equity (SAFE Notes)** — Cash invested by the founding team. Tracked as SAFE tranches in global assumptions.
2. **Acquisition Debt** — Bank loans for property purchases. Sized by LTV ratio.
3. **Refinancing Proceeds** — New loans that replace original debt, potentially returning excess equity to investors.

### Investor Return Path
- **During operations**: Free Cash Flow (FCF) distributions from property NOI after debt service
- **At refinancing**: Excess proceeds above old loan payoff returned to investors
- **At exit**: Net sale proceeds after repaying debt and paying commissions

## Key Constants
- `DEFAULT_LTV` (75%) — Acquisition loan-to-value
- `DEFAULT_REFI_LTV` (65%) — Refinance loan-to-value
- `DEFAULT_COMMISSION_RATE` (5%) — Sales commission at exit

## Cross-References
- Formulas: `.claude/checker-manual/formulas/funding-financing-refi.md`
- Formulas: `.claude/checker-manual/formulas/dcf-fcf-irr.md`
