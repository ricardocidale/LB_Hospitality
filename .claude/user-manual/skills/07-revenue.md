# Revenue Calculations

## Section ID: `revenue`

## Content Summary
Four revenue streams, all derived from room revenue:

### Room Revenue (Base)
```
Room Revenue = roomCount × ADR × occupancy × 30.5 days
```

### Ancillary Revenue Streams
| Stream | Formula | Default Share |
|--------|---------|---------------|
| Events | Room Revenue × `DEFAULT_REV_SHARE_EVENTS` | 43% |
| F&B | Room Revenue × `DEFAULT_REV_SHARE_FB` × (1 + `DEFAULT_CATERING_BOOST_PCT`) | 22% × 1.30 |
| Other | Room Revenue × `DEFAULT_REV_SHARE_OTHER` | 7% |

### Key Rules
- Revenue = 0 before `operationsStartDate`
- 30.5 days/month is the industry standard (365 ÷ 12, rounded)
- ADR grows at `DEFAULT_ADR_GROWTH_RATE` (3%) compounding annually
- Catering boost is a blended percentage uplift on F&B revenue (default 30%)
- Revenue shares are property-configurable

## Cross-References
- Formulas: `.claude/checker-manual/formulas/property-financials.md` § Revenue
- Constants: `DAYS_PER_MONTH`, `DEFAULT_REV_SHARE_*`, `DEFAULT_CATERING_BOOST_PCT`
