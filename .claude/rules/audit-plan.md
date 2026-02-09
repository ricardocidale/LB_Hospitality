# Audit Plan — Automated Financial Proof System
## Objective
Eliminate the need for any human to verify calculations by hand or in Excel. Every financial output must be provably correct through automated tests, tie-outs, and reconciliation reports.
## Files & Functions to Inspect (Priority Order)
### 1. Core Calculation Chain (Formula Correctness)
| File | Focus | Risk |
|------|-------|------|
| `client/src/lib/financialEngine.ts` | `generatePropertyProForma()` — revenue, expenses, NOI, debt service, cash flow, refinance pass 2 | Double-counting, sign errors, wrong aggregation |
| `client/src/lib/loanCalculations.ts` | PMT, amortization schedule, debt outstanding tracking | Interest/principal split, payoff math |
| `calc/refinance/refinance-calculator.ts` | Refinance proceeds, new debt schedule, cash-out computation | Debt balance discontinuity at refi month |
| `client/src/lib/yearlyAggregator.ts` | Monthly→yearly rollups | Sum vs average errors, fiscal year boundary |
| `client/src/lib/cashFlowAggregator.ts` | Cash flow statement construction | ASC 230 classification errors |
### 2. Statement Tie-Outs (Invariants)
| Identity | Where Checked | GAAP Ref |
|----------|--------------|----------|
| BS Balance: A = L + E | `statements/reconcile.ts`, `calc/validation/financial-identities.ts` | ASC 210 |
| CF Tie-out: ΔCash = Net CF | `statements/reconcile.ts` | ASC 230 |
| IS→RE: Cumulative NI = Retained Earnings | `statements/reconcile.ts` | FASB |
| OCF = NI + Depreciation | `calc/validation/financial-identities.ts` | ASC 230-10-45 |
| NI = NOI - Interest - Depreciation - Tax | `calc/validation/financial-identities.ts` | ASC 220 |
| CFF = -Principal + Refi Proceeds | `calc/validation/financial-identities.ts` | ASC 230-10-45-15 |
| Debt roll-forward: Begin + Draws - Payments = End | `calc/validation/schedule-reconcile.ts` | ASC 470 |
| Fee linkage: Σ(SPV fees) = OpCo revenue | `calc/analysis/consolidation.ts` | Intercompany |
| Consolidated eliminations net to zero | `calc/analysis/consolidation.ts` | Consolidation |
### 3. Hardcoded Value Detection
| Scope | Rule |
|-------|------|
| `client/src/lib/financialEngine.ts` | All numeric literals must trace to `constants.ts` or function parameters |
| `client/src/lib/loanCalculations.ts` | Same |
| `client/src/lib/cashFlowAggregator.ts` | Same |
| `client/src/lib/yearlyAggregator.ts` | Same |
| Safe constants (exempt) | `0`, `1`, `12`, `100`, `-1` (sign flip) |
### 4. Golden Scenario Coverage
| # | Scenario | Tests |
|---|----------|-------|
| 1 | Cash purchase (Full Equity, no debt) | Revenue, NOI, NI, CF, BS invariants, no-negative-cash |
| 2 | Financed purchase (LTV, amortization) | Debt schedule, I+P=PMT, debt outstanding decline |
| 3 | Cash purchase → refinance year 3 | Pre/post refi debt, cash-out proceeds, CF discontinuity |
| 4 | OpCo fees + SPV fees (portfolio aggregate) | Fee linkage: SPV expense = OpCo revenue per period |
| 5 | Consolidated group with eliminations | Eliminations net to zero, BS balances post-elimination |
### 5. Reconciliation Reports (test-artifacts/)
For each scenario: Sources & Uses, NOI→FCF bridge, Begin→End Cash bridge, Debt schedule reconciliation, Intercompany elimination summary. Output: JSON (machine-readable) + Markdown (human-readable).
## Commands
```bash
npm test          # Unit + snapshot + proof tests
npm run verify    # Tests + verification runner + artifact generation
```
