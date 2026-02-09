# Property Lifecycle

## Section ID: `property-lifecycle`

## Content Summary
Four-phase lifecycle for each property:

### Phase 1: Acquisition
- Purchase price set per property
- Closing costs: `DEFAULT_ACQ_CLOSING_COST_RATE` (2%) of purchase price
- Debt sizing: `DEFAULT_LTV` (75%) × purchase price for financed properties
- Full equity properties: no debt, 100% cash investment

### Phase 2: Operations
- Revenue begins on `operationsStartDate`
- Occupancy ramps from `DEFAULT_START_OCCUPANCY` (55%) to `DEFAULT_MAX_OCCUPANCY` (85%)
- ADR grows annually at `DEFAULT_ADR_GROWTH_RATE` (3%)
- Expenses calculated as percentages of revenue (USALI structure)

### Phase 3: Refinancing (Optional)
- Occurs at configurable date (default: 3 years after ops start)
- New loan at `DEFAULT_REFI_LTV` (65%) of appraised value
- Closing costs: `DEFAULT_REFI_CLOSING_COST_RATE` (3%)
- Excess proceeds above old loan payoff returned to investors

### Phase 4: Exit
- Property sold at end of projection period
- Exit value: NOI ÷ `DEFAULT_EXIT_CAP_RATE` (8.5%)
- Commission: `DEFAULT_COMMISSION_RATE` (5%) of gross sale price
- All outstanding debt repaid from proceeds

## Cross-References
- Formulas: `.claude/checker-manual/formulas/property-financials.md`
- Formulas: `.claude/checker-manual/formulas/funding-financing-refi.md`
- Constants: `.claude/rules/constants-and-config.md`
