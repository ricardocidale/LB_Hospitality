# Audit Doctrine — Finance + Engineering + Product

## Purpose
An “audit” in this repo is not only GAAP/accounting compliance. It is a full correctness review across math, code, dataflow, and product workflows. The goal is user trust: numbers must be right, reproducible, and explainable.

## Mandatory Audit Dimensions
Every audit must explicitly cover all dimensions below. If a dimension cannot be assessed, state why and what evidence is missing.

1) Formula and Math Correctness
- Validate key formulas and their dimensional consistency (units, time basis, rates).
- Detect silent math bugs: double-counting, sign errors, off-by-one month, wrong aggregation.
- Confirm monthly-to-yearly rollups, sums, and weighted averages are correct.
- Verify interest, amortization, refinancing proceeds, and payoff math.

2) Data Lineage and Traceability
- Every reported number must trace to:
  - assumptions → schedules/calculators → postings → statements → exports
- Identify orphan values that bypass the calculation graph.

3) Assumptions and Variables Integrity
- Detect hardcoded constants that should be variables.
- Detect duplicated variables representing the same concept.
- Confirm default values come from constants.ts (or the declared single source of truth).
- Confirm variable naming is consistent and unambiguous.

4) Workflow Correctness (User Journeys)
- Validate the end-to-end flows:
  - create property → set assumptions → acquire → operate → refinance → exit → view statements → export
- Ensure Save/Load (“Save As”) preserves scenario integrity and recalculates deterministically.

5) Reporting and Presentation Correctness
- Tables and charts must reflect the same underlying data as statements.
- Ensure consistent definitions in UI labels/tooltips (ADR, RevPAR, GOP, NOI, FCF).
- Confirm exports use the same data layer as on-screen views.

6) Code Quality and Risk Controls
- Identify fragile areas: duplicated logic, inconsistent rounding, implicit timezone/date behavior.
- Confirm pure calculations are isolated from UI state and network calls.
- Confirm tests exist for finance-critical logic or recommend minimal tests.

7) Accounting/GAAP and Industry Standards (Still Required)
- Confirm GAAP classification policy is consistent (ASC 230, 360, 470, 606 as applicable).
- Confirm hotel departmental structure aligns with USALI where used.
- Confirm consolidation eliminations for intercompany items are correct.

## Audit Output Format (Required)
Every audit response must contain:
- Executive Summary (3–7 bullets)
- Findings by Dimension (use headings 1–7 above)
- Highest-Risk Issues (ranked)
- Quick Wins (fix in <1 hour)
- Recommended Test Additions (minimal set)
- “Evidence Used” (files, functions, or paths examined)

## Stop-the-Line Issues (Always Flag)
- Hardcoded values in production calculation paths that should be assumptions
- Negative cash when negative cash is disallowed
- Statements not tying out (BS not balancing, CF not matching change in cash)
- Refinance math that does not reconcile to debt balances and cash movement
- Inconsistent definitions between UI, exports, and statements
