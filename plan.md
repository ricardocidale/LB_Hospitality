# Plan: Fix Client-Side Audit Report Failures

## Root Cause Analysis

**All three audit failure patterns share a single root cause: timezone-dependent date parsing.**

When JavaScript parses `new Date("2026-04-01")` in a non-UTC timezone (e.g., US EST/EDT), the UTC midnight date becomes the **last day of the previous month** in local time (March 31, 2026, 7:00 PM EDT). This cascades through date-fns functions:

1. **`addMonths(March 31, N)`** produces end-of-month dates (April 30, May 30/31, June 30, etc.) instead of 1st-of-month dates
2. **`differenceInMonths(June 30, May 31)`** returns `0` instead of `1` because day 30 < day 31 triggers the day-of-month adjustment
3. **`monthsSinceAcquisition`** in the engine is systematically lower by ~1 compared to the auditor's linear counting from `acqMonthIndex`

### How This Causes Each Failure

**Pattern 1 — Balance Sheet +0.25% variance (all properties):**
- Engine computes `accumulatedDepreciation = monthlyDep * (monthsSinceAcquisition + 1)` where `monthsSinceAcquisition` is 1 less than expected due to the day-of-month adjustment
- Auditor accumulates `depreciationExpense` linearly from `acqMonthIndex`, getting 1 more month
- Result: engine shows higher property value (less depreciation) by exactly 1 month of depreciation

**Pattern 2 — Blue Ridge Manor & Eden Summit Lodge $0 values:**
- `acqMonthIndex = differenceInMonths(acqDate, modelStart)` gives N-1 due to day adjustment (e.g., 14 instead of 15)
- But the engine's `isAcquired = !isBefore(currentDate, acquisitionDate)` at month N-1 returns false because `addMonths(March 31, N-1)` produces a date that's still before `acquisitionDate`
- Auditor starts checking at month N-1 where engine has all zeros

**Pattern 3 — Casa Medellín principal variance +1.59%:**
- Engine's `monthsSinceAcquisition` oscillates (0, 0, 2, 2, 4, 5, 5, ...) because end-of-month dates alternate between matching and not matching the acquisition date's day
- Auditor syncs to engine's `debtOutstanding` each month, but on "jump" months where `monthsSinceAcquisition` increases by 2, the balance drops more than expected
- The auditor's expected principal (based on previous month's synced balance) doesn't match the engine's actual principal (based on the jumped-to balance)

## Fix Strategy

**Normalize all date parsing to the 1st of the month in local time.** Both the engine and auditor parse date strings as `YYYY-MM-01` format. Using `startOfMonth` from date-fns ensures consistent behavior regardless of timezone.

## Files to Modify

### 1. `client/src/lib/financialEngine.ts`
- Add `import { startOfMonth } from "date-fns"` (already imports from date-fns)
- Normalize all date parsing at lines 273-275:
  ```typescript
  const modelStart = startOfMonth(new Date(global.modelStartDate));
  const opsStart = startOfMonth(new Date(property.operationsStartDate));
  const acquisitionDate = property.acquisitionDate ? startOfMonth(new Date(property.acquisitionDate)) : opsStart;
  ```
- Also normalize the refinance date parsing (~line 530) if present

### 2. `client/src/lib/financialAuditor.ts`
- Add `startOfMonth` to the date-fns import
- Normalize all date parsing in each audit function:
  - `auditDepreciation` (lines 143-145)
  - `auditLoanAmortization` (lines 312-314)
  - `auditIncomeStatement` (lines 477-478)
  - `auditTimingRules` (lines 691-693)
  - `auditManagementFees` (lines 800-801)
  - `auditBalanceSheet` (lines 880-882)
  - `auditCashFlowReconciliation` (lines 1002-1004)

### 3. `server/calculationChecker.ts`
- Apply same `startOfMonth` normalization for consistency (even though server likely runs in UTC)

## Verification Steps

1. Run `npm run test:file -- tests/engine/operating-reserve-cash.test.ts` — must pass (13 tests)
2. Run `npm run test:summary` — all tests pass
3. Run `npm run verify:summary` — UNQUALIFIED opinion
4. TypeScript check: `npx tsc --noEmit` — 0 errors
