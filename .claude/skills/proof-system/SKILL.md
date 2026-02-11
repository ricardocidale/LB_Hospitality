---
name: proof-system
description: Automated financial proof system with 963 tests and 5 golden scenarios. Use when running verification, adding tests, debugging financial calculations, or reviewing proof coverage.
---

# Automated Financial Proof System

## Purpose
Eliminates human Excel verification. Code proves itself correct through 963 automated tests across 5 golden scenarios, input-to-output pipeline verification, and magic number detection.

## Commands
```bash
npm test                          # Run all 963 tests
npm run verify                    # Full 4-phase verification (UNQUALIFIED = pass)
npx vitest run tests/proof/       # Run only proof tests
npx tsx tests/proof/verify-runner.ts  # 4-phase orchestrator directly
```

## 4-Phase Verification
1. **Scenarios** — 5 golden scenarios test every financial structure
2. **Hardcoded Detection** — Scans 8 finance files for magic numbers
3. **Reconciliation** — Generates artifact reports with math checks
4. **Artifact Summary** — Produces JSON + Markdown proof reports

## Audit Opinion Outputs
- **UNQUALIFIED** — All checks pass. No human verification needed.
- **QUALIFIED** — Minor issues detected. Review required.
- **ADVERSE** — Critical failures. Do not ship.

Only UNQUALIFIED is acceptable for production.

## 5 Golden Scenarios

| # | Scenario | What It Proves |
|---|----------|---------------|
| 1 | Cash purchase (no debt) | Pure equity model, no loan paths active |
| 2 | Financed purchase (LTV) | Debt sizing, amortization, DSCR, debt service |
| 3 | Cash → refinance year 3 | Refi mechanics, cash-out, loan swap, payoff |
| 4 | Portfolio aggregate | Multi-property aggregation, fee linkage |
| 5 | Consolidated + eliminations | Full intercompany elimination, consolidated statements |

## 31 Enforced Guarantees
See `tests/proof/NO_EXCEL_GUARANTEE.md` for the full checklist mapping each guarantee to its enforcing test file.

## Key Test Files
```
tests/proof/
├── scenarios.test.ts           # 5 golden scenario tests
├── input-verification.test.ts  # 29 input-to-output pipeline tests
├── hardcoded-detection.test.ts # Magic number scanner (8 finance files)
├── reconciliation-report.test.ts # Artifact generator + debt reconciliation
├── verify-runner.ts            # 4-phase orchestrator
└── NO_EXCEL_GUARANTEE.md       # 31-item guarantee checklist
```

## Input-to-Output Pipeline Coverage
- Revenue: rooms × ADR × occupancy × DAYS_PER_MONTH (recomputed from scratch)
- ADR: compounds at adrGrowthRate annually, flat within each year
- Occupancy: ramps from startOccupancy in steps, capped at maxOccupancy
- Variable costs: revenue × costRate (rooms, F&B, events, marketing, utilities, FF&E)
- Fixed costs: Year 1 base × costRate × (1 + escalationRate)^year
- Refi: NOI-cap valuation × LTV, proceeds = gross − closing costs

## Artifacts
`test-artifacts/` contains per-scenario JSON + Markdown reconciliation reports:
- Sources & Uses at acquisition
- NOI → FCF bridge
- Begin Cash → End Cash bridge
- Debt schedule reconciliation
- Intercompany elimination summary

## Key Invariants Tested
- Balance Sheet: A = L + E (ASC 210)
- OCF = NI + Depreciation (ASC 230-10-45)
- NI = NOI - Interest - Depreciation - Tax (ASC 220)
- CFF = -Principal + Refi Proceeds (ASC 230-10-45-15)
- Ending Cash = Beginning Cash + Net Cash Change (ASC 230-10-45-24)
- Fee Linkage: Σ(SPV fees) = OpCo revenue (intercompany)
- Consolidated eliminations net to zero
- FCFE Direct ≡ FCFE From-NI (two-method reconciliation)
- NPV = 0 at computed IRR (cross-validation)

## Hardcoded Value Detection
- Scans: `financialEngine.ts`, `refinance-calculator.ts`, `financial-identities.ts`, `schedule-reconcile.ts`, `consolidation.ts`
- Safe numbers: 0, 1, -1, 2, 12, 100
- Context exceptions: loop counters, array indices, Math functions, string literals

## Detailed Testing Skills
For per-statement and per-analysis test coverage, see:

| Skill | Path | Scope |
|-------|------|-------|
| Property Statements | `.claude/skills/testing/property-statements.md` | IS, CF, BS at property level |
| Consolidated Statements | `.claude/skills/testing/consolidated-statements.md` | Portfolio aggregation, eliminations |
| Management Company | `.claude/skills/testing/management-company.md` | OpCo pro forma, fee linkage, funding |
| Analysis: Returns | `.claude/skills/testing/analysis-returns.md` | IRR, NPV, MOIC, sensitivity |
| Analysis: DCF/FCF | `.claude/skills/testing/analysis-dcf-fcf.md` | FCF, FCFE reconciliation |
| Financing & Refinancing | `.claude/skills/testing/financing-refinance-funding.md` | Debt, refi, funding instruments |

## Maintenance
1. Run `npm test` — all 963 tests must pass
2. Run `npm run verify` — all 4 phases must pass
3. Check `test-artifacts/*.md` for UNQUALIFIED opinions
4. New constants go in `shared/constants.ts` (never inline magic numbers)
5. Update testing skills when adding new test suites
