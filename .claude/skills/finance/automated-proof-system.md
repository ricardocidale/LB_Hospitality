# Automated Financial Proof System

## Purpose
Eliminates the need for human Excel verification by proving the financial engine correct through automated tests, reconciliation tie-outs, and artifact generation.

## Architecture

### 4 Verification Phases
1. **Proof Scenarios** (`tests/proof/scenarios.test.ts`) — 5 end-to-end golden scenarios
2. **Hardcoded Detection** (`tests/proof/hardcoded-detection.test.ts`) — Blocks magic numbers in finance files
3. **Reconciliation Reports** (`tests/proof/reconciliation-report.test.ts`) — JSON+MD artifacts to `test-artifacts/`
4. **Verify Runner** (`tests/proof/verify-runner.ts`) — Orchestrates all phases

### 5 Golden Proof Scenarios
| # | Scenario | Key Assertions |
|---|----------|----------------|
| 1 | Cash Purchase (Full Equity) | Zero debt, NI=NOI-Dep-Tax, OCF=NI+Dep, no negative cash, ASC 360 property value |
| 2 | Financed Purchase (75% LTV) | I+P=PMT, debt declines, NI excludes principal (ASC 470), debt replay method |
| 3 | Cash → Refinance Year 3 | Zero debt pre-refi, positive debt post-refi, proceeds appear once, debt amortizes post-refi |
| 4 | OpCo+SPV Fee Linkage | Fee = rate × revenue, incentive = rate × max(0,GOP), portfolio NOI sums correctly |
| 5 | Consolidated Eliminations | Fee linkage balanced, eliminations net to zero, BS balances post-elimination |

### Hardcoded Value Detection
- Scans: `financialEngine.ts`, `refinance-calculator.ts`, `financial-identities.ts`, `schedule-reconcile.ts`, `consolidation.ts`
- Safe numbers: 0, 1, -1, 2, 12, 100
- Context exceptions: loop counters, array indices, Math functions, string literals (GAAP references)

### Reconciliation Reports (test-artifacts/)
Each scenario produces JSON + Markdown with:
- Sources & Uses at acquisition
- NOI → FCF bridge (includes refi proceeds)
- Begin Cash → End Cash bridge (OCF + FCF + Refi)
- Debt schedule reconciliation
- Financial identity checks (opinion: UNQUALIFIED/QUALIFIED/ADVERSE)

## Commands
```bash
npm test                    # All 355 tests including 40 proof tests
npx tsx tests/proof/verify-runner.ts  # Full 4-phase verification
```

## Key Invariants Tested
- Balance Sheet: A = L + E (ASC 210)
- OCF = NI + Depreciation (ASC 230-10-45)
- NI = NOI - Interest - Depreciation - Tax (ASC 220)
- CFF = -Principal + Refi Proceeds (ASC 230-10-45-15)
- Ending Cash = Beginning Cash + Net Cash Change (ASC 230-10-45-24)
- Fee Linkage: Σ(SPV fees) = OpCo revenue (intercompany)
- Consolidated eliminations net to zero

## Maintenance
When modifying the financial engine:
1. Run `npm test` — all 355 tests must pass
2. Run `npx tsx tests/proof/verify-runner.ts` — all 4 phases must pass
3. Check `test-artifacts/*.md` for UNQUALIFIED opinions
4. If adding new constants, update `shared/constants.ts` (never inline magic numbers)
