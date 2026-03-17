# Audit Fix Plan — Batch 2: MEDIUM-Severity Issues

> Batch 1 (CRITICAL + HIGH issues #2, #3, #5, #6, #7) is being executed by Replit separately.
> This is Batch 2: the 6 MEDIUM-severity issues from the deterministic calc & rollup audit.

## Context

The audit identified 6 MEDIUM issues that won't cause wrong financial outputs today but create risk of silent failures, hidden data, or maintenance drift. Fixes are defensive hardening — NaN guards, category discovery, input validation, and a refactor to eliminate code duplication.

**Rules to follow:**
- `.claude/rules/no-hardcoded-values.md` — named constants only
- `.claude/rules/financial-engine.md` — checker independence, engine correctness
- `.claude/rules/error-handling.md` — no silent failures
- `.claude/rules/testing-strategy.md` — tests for logic changes

---

## Fix #8 — Service Fee Category Discovery Uses Only Month 0

**Problem:** `client/src/lib/company-data.ts` lines 23 and 203 discover fee category names from `financials[0]` only. If a fee category first appears after month 0 (e.g., a property adds a new service category mid-projection), it's invisible in the company income statement and cash flow statement.

**File:** `client/src/lib/company-data.ts`

**Current code (line 23):**
```typescript
const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
```

**Fix:** Scan ALL months to build a union of all category names:
```typescript
const categoryNameSet = new Set<string>();
for (const month of financials) {
  const cats = month?.serviceFeeBreakdown?.byCategory;
  if (cats) for (const key of Object.keys(cats)) categoryNameSet.add(key);
}
const categoryNames = Array.from(categoryNameSet);
```

**Apply the same fix at line 203** for the cash flow section (`cfCategoryNames`).

**WARNING:** This changes the ORDER of categories. If order matters for display, sort alphabetically or by a known sort order. Check if `DEFAULT_SERVICE_FEE_CATEGORIES` from `shared/constants.ts` provides a canonical sort order — if so, sort `categoryNames` by matching against that array's `sortOrder`.

**Test:** Run `npm run test:file -- tests/engine/company-proforma.test.ts` and `npm run test:file -- tests/engine/centralized-services.test.ts`. Check that no assertions depend on category order from month 0.

**Replit note:** This touches a client-side data helper. Replit can execute this.

---

## Fix #9 — Dashboard Fee Zero-Sum Validation

**Problem:** `client/src/components/dashboard/usePortfolioFinancials.ts` consolidates property data but never validates that Σ(property management fees) = company fee revenue. If engines diverge, the dashboard will show imbalanced numbers without warning.

**File:** `client/src/components/dashboard/usePortfolioFinancials.ts`

**Fix:** Add a validation check after the consolidation loop. This is a **development warning**, not a user-facing error:

After the property consolidation loop completes (around line 112), add:
```typescript
// Validate intercompany fee zero-sum (development guard)
if (process.env.NODE_ENV === 'development' && companyFinancials) {
  for (let y = 0; y < consolidated.length; y++) {
    const propFees = consolidated[y].feeBase + consolidated[y].feeIncentive;
    const companyFeeRev = companyFinancials[y]?.baseFeeRevenue + companyFinancials[y]?.incentiveFeeRevenue;
    if (Math.abs(propFees - companyFeeRev) > 1.0) {
      console.warn(`[WARN] [dashboard] Fee zero-sum violation in year ${y + 1}: property fees $${propFees.toFixed(0)} ≠ company revenue $${companyFeeRev.toFixed(0)}`);
    }
  }
}
```

**WARNING:**
- Read the file first to understand the exact variable names (`consolidated`, `companyFinancials` may be named differently).
- Check if `companyFinancials` is available in scope at the consolidation point. If not, this validation needs to happen at the consumer level, not inside the hook.
- This is dev-only; production should NOT show console warnings. The `process.env.NODE_ENV` guard handles this.

**Test:** No new test needed — this is a runtime guard. But verify `npm run test:summary` still passes (no import errors).

**Replit note:** This touches a React hook in the dashboard. Replit can execute this.

---

## Fix #10 — NaN Guard in Company-Engine Fee Aggregation

**Problem:** `client/src/lib/financial/company-engine.ts` lines 194-212 accumulate service fee amounts without NaN protection. If a property's `serviceFeesByCategory` contains NaN (from upstream calc error), it silently poisons the entire company P&L.

**File:** `client/src/lib/financial/company-engine.ts`

**Current code (line ~196):**
```typescript
for (const [catName, catAmount] of Object.entries(catFees)) {
  serviceFeeBreakdown.byCategory[catName] =
    (serviceFeeBreakdown.byCategory[catName] || 0) + catAmount;
```

**Fix:** Wrap `catAmount` in the existing `safeNum()` utility:

1. First, check if `safeNum` is already imported. Search the file's import block. If not, add:
   ```typescript
   import { safeNum } from "@/lib/utils";  // or wherever safeNum is defined
   ```

2. Replace the accumulation line:
   ```typescript
   const safeCatAmount = safeNum(catAmount);
   serviceFeeBreakdown.byCategory[catName] =
     (serviceFeeBreakdown.byCategory[catName] || 0) + safeCatAmount;
   ```

3. Also guard the fallback fee calculation (line ~205):
   ```typescript
   const propServiceFee = safeNum(pf[m].revenueTotal) * propBaseFeeRates[i];
   ```

**WARNING:**
- Find where `safeNum` is defined. Search: `grep -r "export function safeNum" --include="*.ts"`. It might be in `client/src/lib/utils.ts` or `client/src/lib/financial/` somewhere.
- If `safeNum` doesn't exist as a standalone function, it may be inline. In that case, define it or use `(val || 0)` which converts NaN to 0 (since `NaN || 0` evaluates to `0`). But `NaN || 0` does NOT work — `NaN` is falsy so `NaN || 0 = 0` actually works. However, for clarity, prefer an explicit guard:
  ```typescript
  const safeCatAmount = Number.isFinite(catAmount) ? catAmount : 0;
  ```

**Test:** Run `npm run test:file -- tests/engine/company-proforma.test.ts`.

---

## Fix #11 — Aggregator Duplication Refactor

**Problem:** Three aggregation functions (`aggregatePropertyByYear`, `aggregateUnifiedByYear`, `aggregateCashFlowByYear`) share 90% identical inner-loop logic for summing monthly fields. Bugs fixed in one must be manually replicated to the other two.

**Files:**
- `client/src/lib/financial/yearlyAggregator.ts` (lines 118-461)
- `client/src/lib/financial/cashFlowAggregator.ts` (lines 39-130)

**Fix strategy: Extract shared core, keep existing API.**

1. Create a private `aggregateCore()` function that handles the shared inner loop (summing ~30 monthly fields into yearly buckets):
   ```typescript
   interface YearlySums {
     // All 30+ accumulated fields
     revenueRooms: number; revenueEvents: number; revenueFB: number; ...
     noi: number; anoi: number; interestExpense: number; principalPayment: number; ...
     operationalMonths: number;
     endingCash: number; // PICK_LAST
     nolBalance: number; // PICK_LAST
   }

   function aggregateCore(data: MonthlyFinancials[], years: number): YearlySums[] {
     const result: YearlySums[] = [];
     for (let y = 0; y < years; y++) {
       const yearStart = y * 12;
       const yearEnd = Math.min(yearStart + 12, data.length);
       // ... sum all fields (the shared loop logic)
       result.push(sums);
     }
     return result;
   }
   ```

2. Rewrite `aggregatePropertyByYear` as a thin wrapper:
   ```typescript
   export function aggregatePropertyByYear(data, years): YearlyPropertyFinancials[] {
     return aggregateCore(data, years).map(sums => ({
       // Map YearlySums → YearlyPropertyFinancials (no new logic, just field mapping)
     }));
   }
   ```

3. Rewrite `aggregateCashFlowByYear` as a thin wrapper that also computes exit value and CF derivations.

4. Rewrite `aggregateUnifiedByYear` to call the core + both wrappers (or combine IS + CF outputs).

**WARNING: This is the highest-risk fix in this batch.**
- The parity test (`tests/engine/aggregator-parity.test.ts`) MUST pass unchanged after refactoring.
- Run ALL three test files after the refactor:
  ```bash
  npm run test:file -- tests/engine/aggregator-parity.test.ts
  npm run test:file -- tests/engine/cash-flow-aggregator.test.ts
  npm run test:file -- tests/engine/yearly-aggregator.test.ts
  ```
- Do NOT change any public function signatures or return types.
- If the refactor gets complex, it's acceptable to defer this to a future sprint. The duplication is a maintenance risk, not a correctness bug. The parity tests already catch any divergence.

**RECOMMENDATION:** If time is limited, SKIP this fix. The parity tests are the safety net. This is a code quality improvement, not a bug fix.

---

## Fix #12 — Treasury Rate Bounds in Prepayment Calculator

**Problem:** `calc/financing/prepayment.ts` line 228 accepts any treasury rate without validation. Negative rates, rates higher than the loan rate, or extreme values produce silently wrong prepayment penalties.

**File:** `calc/financing/prepayment.ts`

**Fix:** Add input validation at the top of the yield maintenance calculation (inside the function, before computation):

```typescript
// Validate treasury rate reasonableness
const warnings: string[] = [];
if (treasuryRate < 0) {
  warnings.push("Treasury rate is negative — clamping to 0%");
  treasuryRate = 0;
}
if (treasuryRate > loanRate) {
  warnings.push(`Treasury rate (${(treasuryRate * 100).toFixed(2)}%) exceeds loan rate (${(loanRate * 100).toFixed(2)}%) — yield maintenance penalty will be $0`);
}
if (treasuryRate > 0.15) {
  warnings.push(`Treasury rate (${(treasuryRate * 100).toFixed(2)}%) is unusually high — verify input`);
}
```

**WARNING:**
- Read the function first to understand the output interface. If it already has a `warnings` array in the output, append to it. If not, add one or use `console.warn` for development.
- The `treasuryRate` variable may be `const` — if so, create a `let effectiveTreasuryRate = Math.max(0, treasuryRate)` instead of mutating.
- Check if there are existing tests in `tests/financing/prepayment.test.ts` or `tests/calc/` that cover yield maintenance. Add a test for negative treasury rate if none exists.

**Test:** Run `npm run test:file -- tests/financing/prepayment.test.ts` (or wherever prepayment tests live).

---

## Fix #13 — Property-to-Fee-Rate Mapping: Array Index → Stable ID

**Problem:** `client/src/lib/financial/company-engine.ts` line 149 maps fee rates by array index:
```typescript
const propBaseFeeRates = properties.map(p => p.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
```
Then line 205 accesses by index `propBaseFeeRates[i]`. If the properties array is reordered between the mapping and the usage, rates are applied to wrong properties.

**File:** `client/src/lib/financial/company-engine.ts`

**Fix:** Use a Map keyed by property ID instead of an array:

```typescript
const propBaseFeeRateMap = new Map<number | string, number>();
for (const p of properties) {
  propBaseFeeRateMap.set(p.id, p.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
}
```

Then at the usage site (line ~205), replace:
```typescript
const propServiceFee = pf[m].revenueTotal * propBaseFeeRates[i];
```
With:
```typescript
const propServiceFee = pf[m].revenueTotal * (propBaseFeeRateMap.get(properties[i].id) ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
```

**WARNING:**
- This is technically defensive — the properties array isn't currently reordered between mapping and usage within a single engine call. The risk is future maintenance, not current bug.
- Read the full function to understand ALL places where `propBaseFeeRates[i]` is used. There may be more than one site.
- Also check `propIds` (line 151) — it uses `String(p.id ?? i)` which falls back to index. If converting to Map, `propIds` can be derived from the Map keys.
- If the refactor touches too many lines, it's acceptable to defer. Add a comment instead:
  ```typescript
  // INVARIANT: properties array order must not change between rate mapping and usage
  const propBaseFeeRates = properties.map(p => ...);
  ```

**RECOMMENDATION:** If time is limited, add the invariant comment instead of refactoring to Map. The current code works correctly as long as the array isn't reordered mid-function, which it isn't.

**Test:** Run `npm run test:file -- tests/engine/company-proforma.test.ts` and `npm run test:file -- tests/engine/per-property-fees.test.ts`.

---

## Execution Order

1. **Fix #10** — NaN guard (trivial, 3-line change, no risk)
2. **Fix #8** — Category discovery (small logic change, medium risk)
3. **Fix #12** — Treasury rate bounds (input validation, low risk)
4. **Fix #9** — Dashboard fee validation (dev-only guard, low risk)
5. **Fix #13** — Fee rate mapping (comment or Map refactor, low risk)
6. **Fix #11** — Aggregator refactor (SKIP if time-limited; highest risk, code quality only)

## Final Verification

```bash
npm run test:summary          # All tests pass (3,310+)
npm run verify:summary        # UNQUALIFIED across all 8 categories
```
