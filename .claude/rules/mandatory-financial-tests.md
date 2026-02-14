# Mandatory Financial Integrity Tests

**This rule is non-negotiable. These tests MUST pass before any code is considered complete.**

## Critical Test File

`tests/engine/operating-reserve-cash.test.ts` — 10 tests that catch the exact bugs that caused negative cash balances and incorrect auditor results.

## What These Tests Guard Against

### 1. Operating Reserve Bugs
- Operating reserve MUST seed ending cash at the acquisition month
- Reserve difference MUST show up in ending cash (with vs without)
- Reserve MUST flow through to cumulative cash tracking
- Cumulative cash + reserve MUST equal ending cash (for both Full Equity and Financed properties)
- Without reserve, cumulative cash MUST equal ending cash

### 2. Per-Property Financing Bugs
- Engine MUST use `acquisitionInterestRate` (NOT legacy `debtAssumptions.interestRate`)
- Engine MUST use `acquisitionTermYears` (NOT legacy `debtAssumptions.amortizationYears`)
- Different term years MUST produce different monthly debt payments
- Auditor (`financialAuditor.ts`) MUST use: `property.acquisitionInterestRate ?? property.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE`

### 3. Pre-Operations Gap Bugs
- Financed properties with a gap between acquisition and operations start MUST have debt payments during the gap
- Operating reserve MUST be large enough to cover pre-ops debt service (no negative cash)

## When to Run

These tests MUST be run:
1. **After ANY change to `financialEngine.ts`** — the calculation engine
2. **After ANY change to `financialAuditor.ts`** — the client-side auditor
3. **After ANY change to `calculationChecker.ts`** — the server-side checker
4. **After ANY change to `runVerification.ts`** — the verification orchestrator
5. **After ANY change to `loanCalculations.ts`** — loan math
6. **After ANY change to `cashFlowAggregator.ts`** — cash flow aggregation
7. **After ANY change to seed data** — property defaults
8. **After ANY change to `shared/schema.ts`** that touches financial fields
9. **Before marking ANY financial task as complete**
10. **As part of `npm run test:summary`** — they run automatically with all tests

## Quick Command

```bash
npm run test:file -- tests/engine/operating-reserve-cash.test.ts
```

## Known Historical Bugs These Prevent

| Bug | Root Cause | Property Affected |
|-----|-----------|-------------------|
| Negative cash balance | Operating reserve not seeded at acquisition month | Casa Medellín, Blue Ridge Manor |
| Auditor false failures | Auditor using legacy `debtAssumptions` instead of per-property fields | All Financed properties |
| Cumulative cash mismatch | Cash flow reconciliation audit not including operating reserve | All properties with reserves |
| Wrong debt payments | Engine using wrong interest rate field | Casa Medellín (9.5% vs default) |

## If Tests Fail

**STOP. Do not proceed.** These failures indicate a fundamental calculation integrity issue:
1. Check if operating reserve is being seeded at the acquisition month index
2. Check if per-property financing fields are being used (not legacy `debtAssumptions`)
3. Check if `convertToAuditInput()` passes all required fields
4. Run full verification: `npm run verify:summary`
