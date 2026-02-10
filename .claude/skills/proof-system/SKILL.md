---
name: proof-system
description: Automated financial proof system with 384 tests and 5 golden scenarios. Use when running verification, adding tests, debugging financial calculations, or reviewing proof coverage.
---

# Automated Financial Proof System

## Purpose
Eliminates human Excel verification. Code proves itself correct through 384 automated tests across 5 golden scenarios, input-to-output pipeline verification, and magic number detection.

## Commands
```bash
npm test                          # Run all 384 tests
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

## Detailed Reference
See `.claude/skills/finance/automated-proof-system.md` for implementation details.
