---
name: finance
description: Financial calculation engine. 16 sub-skills covering income statement, cash flow, balance sheet, IRR, DCF, fees, consolidation, and validation.
---

# Finance — Entry Point

## Purpose
Documents the financial calculation engine — GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules.

## Sub-Skills (16 files)
| File | What It Covers |
|------|---------------|
| `income-statement.md` | Revenue, expenses, NOI, net income |
| `cash-flow-statement.md` | Operating, investing, financing activities |
| `cash-line-architecture.md` | Cash flow line item structure |
| `balance-sheet.md` | Assets, liabilities, equity, A=L+E identity |
| `irr-analysis.md` | IRR, NPV, equity multiple, sensitivity |
| `dcf-analysis.md` | DCF, FCF, FCFE two-method reconciliation |
| `fee-linkage.md` | Management/incentive fee calculations |
| `consolidation.md` | Portfolio aggregation, intercompany eliminations |
| `consolidated-formula-helpers.md` | 7 reusable formula helpers for consolidated statements |
| `calculation-chain.md` | Calculation dispatch, dependency ordering |
| `cross-statement-reference.md` | Cross-statement validation rules |
| `financial-statements-construction.md` | End-to-end statement building |
| `management-company-statements.md` | Management company pro forma |
| `statement-separation-rules.md` | Statement separation conventions |
| `timing-activation-rules.md` | Acquisition/disposition timing |
| `validation-identities.md` | GAAP identity checks |
| `fb-revenue-costs.md` | F&B revenue and cost modeling |

## Key Files
- `client/src/lib/financialEngine.ts` — Core calculation engine (~1,047 lines)
- `calc/` — 57 files, 12 computation tools, typed dispatch
- `client/src/lib/audits/` — 9-module audit system
- `client/src/lib/financialAuditor.ts` — Audit orchestrator

## Related Rules
- `rules/financial-engine.md` — Engine architecture and calculation rules
- `rules/audit-persona.md` — Audit doctrine
- `rules/no-hardcoded-assumptions.md` — No literal financial values
- `rules/constants-and-config.md` — Named constants in `shared/constants.ts`
- `rules/verification-system.md` — GAAP verification pipeline
- `rules/mandatory-financial-tests.md` — Required test coverage
