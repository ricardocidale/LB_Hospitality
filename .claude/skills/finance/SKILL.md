---
name: finance
description: Financial calculation engine. 17 sub-skills covering income statement, cash flow, balance sheet, IRR, DCF, fees, centralized services, consolidation, and validation.
---

# Finance — Entry Point

## Purpose
Documents the financial calculation engine — GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules.

## Sub-Skills (17 files)
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
| `centralized-services.md` | Cost-plus markup, vendor costs, gross profit, service templates |

## Deterministic Research Tools (`calc/research/`)

8 pure-function modules registered in `calc/dispatch.ts` as LLM-callable tools. The LLM calls these for exact arithmetic; it provides market knowledge and judgment.

| Module | Purpose |
|--------|---------|
| `property-metrics.ts` | RevPAR, revenue, GOP, NOI, margins, valuation, debt metrics |
| `depreciation-basis.ts` | IRS depreciable basis and monthly/annual depreciation |
| `debt-capacity.ts` | Max loan from NOI, DSCR target, interest rate, term |
| `occupancy-ramp.ts` | Occupancy ramp schedule from start to stabilization |
| `adr-projection.ts` | ADR growth projection over N years |
| `cap-rate-valuation.ts` | Property valuation from NOI and cap rate |
| `cost-benchmarks.ts` | Dollar-amount cost benchmarks from rates and revenue |
| `validate-research.ts` | Post-LLM validation of research output against deterministic math |

## Key Files
- `client/src/lib/financialEngine.ts` — Core calculation engine (~1,047 lines)
- `calc/` — 60+ files, 13 computation tools, typed dispatch (includes `calc/services/`, `calc/research/`)
- `client/src/lib/audits/` — 9-module audit system
- `client/src/lib/financialAuditor.ts` — Audit orchestrator

## Related Rules
- `rules/financial-engine.md` — Engine architecture and calculation rules
- `rules/audit-persona.md` — Audit doctrine
- `rules/no-hardcoded-assumptions.md` — No literal financial values
- `rules/constants-and-config.md` — Named constants in `shared/constants.ts`
- `rules/verification-system.md` — GAAP verification pipeline
- `rules/mandatory-financial-tests.md` — Required test coverage
