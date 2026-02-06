# Shared Constants & Configuration

## Constants Architecture

All named constants are defined in a single source of truth: `client/src/lib/constants.ts`. Some are re-exported from `client/src/lib/loanCalculations.ts` for backwards compatibility.

## Fallback Pattern

The system uses a three-tier fallback for configurable values:

```
property-specific value → global assumption value → DEFAULT constant
```

**Example**:
```typescript
const exitCapRate = property.exitCapRate
  ?? globalAssumptions.exitCapRate
  ?? DEFAULT_EXIT_CAP_RATE;
```

For projection years specifically:
```typescript
const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
const projectionMonths = projectionYears * 12;
```

## Constant Categories

### Immutable Constants (never change)

These are mandated by external standards and must not be made configurable:

| Constant | Value | Source | Rationale |
|----------|-------|--------|-----------|
| `DEPRECIATION_YEARS` | 27.5 | IRS Pub 946 / ASC 360 | Tax law for residential rental property |
| `DAYS_PER_MONTH` | 30.5 | Industry standard | 365/12 = 30.4167, rounded |

### Default Financial Constants

Used as fallbacks when no user-configured value exists:

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_LTV` | 0.75 (75%) | Loan-to-value ratio for acquisitions |
| `DEFAULT_INTEREST_RATE` | 0.09 (9%) | Annual loan interest rate |
| `DEFAULT_TERM_YEARS` | 25 | Loan amortization period in years |
| `DEFAULT_EXIT_CAP_RATE` | 0.085 (8.5%) | Cap rate for property sale valuation |
| `DEFAULT_TAX_RATE` | 0.25 (25%) | Income tax rate |
| `DEFAULT_COMMISSION_RATE` | 0.05 (5%) | Sales commission on property sale |
| `DEFAULT_REFI_LTV` | 0.65 (65%) | Refinance loan-to-value ratio |
| `DEFAULT_REFI_CLOSING_COST_RATE` | 0.03 (3%) | Refinance closing costs |
| `DEFAULT_ACQ_CLOSING_COST_RATE` | 0.03 (3%) | Acquisition closing costs |
| `DEFAULT_COMPANY_TAX_RATE` | 0.25 (25%) | Company-level tax rate |

### Default Operational Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_EVENT_EXPENSE_RATE` | 0.65 (65%) | Event operating expense rate |
| `DEFAULT_OTHER_EXPENSE_RATE` | 0.60 (60%) | Other revenue expense rate |
| `DEFAULT_UTILITIES_VARIABLE_SPLIT` | 0.60 (60%) | Utilities: % that is variable vs fixed |
| `DEFAULT_FULL_CATERING_BOOST` | 0.50 (50%) | Revenue boost for full-service catering |
| `DEFAULT_PARTIAL_CATERING_BOOST` | 0.25 (25%) | Revenue boost for partial catering |

### Projection & Model Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PROJECTION_YEARS` | 10 | Default projection period (configurable 1-30) |
| `PROJECTION_MONTHS` | 120 | PROJECTION_YEARS × 12 |
| `DEFAULT_MODEL_START_DATE` | '2026-04-01' | Fallback model start date |

### Operating Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `OPERATING_RESERVE_BUFFER` | $50,000 | Operating reserve buffer per property |
| `COMPANY_FUNDING_BUFFER` | $100,000 | Company-level funding buffer |
| `RESERVE_ROUNDING_INCREMENT` | $10,000 | Round reserves to nearest increment |

### Staffing Tier Defaults

| Constant | Value | Description |
|----------|-------|-------------|
| `STAFFING_TIERS[0]` | {max: 3, fte: 2.5} | Up to 3 properties → 2.5 FTE |
| `STAFFING_TIERS[1]` | {max: 6, fte: 4.5} | Up to 6 properties → 4.5 FTE |
| `STAFFING_TIERS[2]` | {max: ∞, fte: 7.0} | 7+ properties → 7.0 FTE |

These are now configurable via global assumptions (`staffTier1MaxProperties`, `staffTier1Fte`, etc.)

### Partner Compensation Defaults

```typescript
DEFAULT_PARTNER_COMP = [
  540000, 540000, 540000,  // Years 1-3
  600000, 600000,           // Years 4-5
  700000, 700000,           // Years 6-7
  800000, 800000,           // Years 8-9
  900000                    // Year 10
]
```

## Consumers

Files that import from `constants.ts`:

| Consumer | What It Uses |
|----------|-------------|
| `financialEngine.ts` | All constants for calculations |
| `financialAuditor.ts` | Constants for GAAP audit validation |
| `runVerification.ts` | Constants for verification checks |
| `loanCalculations.ts` | Re-exports loan-related constants |
| `Dashboard.tsx` | PROJECTION_YEARS for dynamic projection period |
| `PropertyDetail.tsx` | PROJECTION_YEARS, DEFAULT_LTV for display |
| `Company.tsx` | PROJECTION_YEARS, STAFFING_TIERS for company model |
| `CompanyAssumptions.tsx` | Various defaults for form validation |
| `PropertyEdit.tsx` | Cost rate defaults for form fields |
| `ConsolidatedBalanceSheet.tsx` | PROJECTION_YEARS for table columns |

## Server-Side Constants

`server/calculationChecker.ts` defines its own copy of constants (not imported from client). This is intentional for independence of verification. The values must be kept in sync manually.

## Adding New Constants

1. Add the constant to `client/src/lib/constants.ts`
2. If it's a configurable value, add the database column to `shared/schema.ts`
3. Update seed endpoints in `server/routes.ts` with default values
4. Add UI controls to the appropriate assumptions page
5. Update consumers to use the fallback pattern
6. If needed, add the constant to `server/calculationChecker.ts` independently
7. Update this documentation
