# Default Values & Assumptions

## Section ID: `defaults`

## Content Summary
Explains the three-tier fallback pattern and lists all default values. Rendered as a `ManualTable` in the UI.

### Fallback Pattern
```
Property-specific value → Global assumption → DEFAULT constant
```

### Key Defaults Table
Rendered from constants — values auto-update when constants change.

| Parameter | Default | Source Constant |
|-----------|---------|----------------|
| Projection Period | 10 years | `PROJECTION_YEARS` |
| Exit Cap Rate | 8.5% | `DEFAULT_EXIT_CAP_RATE` |
| Tax Rate | 25% | `DEFAULT_TAX_RATE` |
| Sales Commission | 5% | `DEFAULT_COMMISSION_RATE` |
| Start Occupancy | 55% | `DEFAULT_START_OCCUPANCY` |
| Max Occupancy | 85% | `DEFAULT_MAX_OCCUPANCY` |
| ADR Growth Rate | 3% | `DEFAULT_ADR_GROWTH_RATE` |
| Occupancy Ramp Step | 5% | `DEFAULT_OCCUPANCY_GROWTH_STEP` |
| Occupancy Ramp Period | 6 months | `DEFAULT_OCCUPANCY_RAMP_MONTHS` |

## Cross-References
- Constants: `.claude/rules/constants-and-config.md` (complete constant list)
- Constants source: `shared/constants.ts` + `client/src/lib/constants.ts`
