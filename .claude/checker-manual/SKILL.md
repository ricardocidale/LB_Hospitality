# Checker Manual — L+B Hospitality Group Business Simulation Portal

## Purpose
This skill provides the complete testing and verification manual for the Checker user role. It is organized into three sub-directories and two root files to minimize context load:

## Directory Structure

```
.claude/checker-manual/
├── SKILL.md              ← This file (master index)
├── glossary.md           ← Comprehensive RE/hospitality finance glossary with formula cross-references
├── skills/               ← Narrative explanation files (how things work conceptually)
│   ├── 01-app-overview.md
│   ├── 02-mgmt-company.md
│   ├── 03-property-portfolio.md
│   ├── 04-global-assumptions.md
│   ├── 05-property-assumptions.md
│   ├── 06-cashflow-streams.md
│   ├── 07-financial-statements.md
│   ├── 08-exports.md
│   ├── 09-design-config.md
│   ├── 10-scenarios.md
│   ├── 11-profile.md
│   ├── 12-dashboard-kpis.md
│   ├── 13-research-calibration.md
│   ├── 14-property-crud.md
│   └── 15-testing-methodology.md
├── formulas/             ← Pure formula reference files (the math, by entity)
│   ├── property-financials.md
│   ├── company-financials.md
│   ├── consolidated.md
│   ├── dcf-fcf-irr.md
│   └── funding-financing-refi.md
└── tools/                ← Validation check schemas (what the checker should verify)
    ├── balance-sheet-checks.json
    ├── cash-flow-checks.json
    ├── fee-linkage-checks.json
    ├── constraint-checks.json
    ├── irr-npv-checks.json
    ├── depreciation-checks.json
    ├── inflation-escalation-checks.json
    ├── scenario-validation-checks.json
    └── report-completeness-checks.json
```

## How to Use
1. **Start with** `skills/01-app-overview.md` for the big picture.
2. **Understand entities** via `skills/02-mgmt-company.md` and `skills/03-property-portfolio.md`.
3. **Review assumptions** in `skills/04-global-assumptions.md` and `skills/05-property-assumptions.md`.
4. **Study cash flow streams** in `skills/06-cashflow-streams.md` — this is the most complex area.
5. **Cross-reference formulas** in `formulas/` when you need the exact math.
6. **Use the glossary** (`glossary.md`) to look up any term — each entry references the formula section where applicable.
7. **Follow the 7-phase testing methodology** in `skills/15-testing-methodology.md`:
   - Phase 1: Input Verification (defaults, USALI benchmarks, inflation paths)
   - Phase 2: Calculation Verification (hand-calculated cross-validation)
   - Phase 3: Financial Statement Reconciliation (A=L+E, ASC 230 cash flow)
   - Phase 4: IRR/DCF/FCF Verification (NPV≈0 test, FCF derivation)
   - Phase 5: Scenario & Stress Testing (edge cases, saved scenario comparisons)
   - Phase 6: Reports & Exports Completeness (all 6 formats, value accuracy)
   - Phase 7: Documentation & Sign-Off (UNQUALIFIED/QUALIFIED/ADVERSE opinion)
8. **Run validation checks** defined in `tools/` JSON schemas to verify system constraints.
9. **Create scenarios** to test different assumption configurations — save baseline states, make changes, and compare results.

## Key Principle
Every financial term that involves a formula includes a cross-reference to the relevant `formulas/` file and section number. This avoids duplication and keeps each file focused.

## Rendered In-App
The manual is rendered at `/checker-manual` (accessible to checker and admin roles only) with:
- Dark glass UI matching the app's design system
- Collapsible table of contents
- PDF export of the manual
- Full Data Export (all assumptions, statements, seed data as PDF)
- Activity logging for audit trail
