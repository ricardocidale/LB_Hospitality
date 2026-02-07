```markdown
# Claude Code Skill Specs — Financing + GAAP-Safe Statements

## Design Intent
These Skills are “blast-radius contracts” for Claude Code. Each one constrains: (1) where code can change, (2) what commands can run, (3) what accounting invariants must hold, and (4) what tests/reconciliations must pass. GAAP compliance here means: accrual-based statements, consistent classification, and deterministic reconciliations. This is an engineering guardrail, not accounting advice.

## Repo Assumptions (Adjust Paths to Your Codebase)
- /domain/** = pure business logic + types
- /calc/** = calculators (financing/refi/funding)
- /engine/** = timeline + event application
- /statements/** = IS/CF/BS builders
- /analytics/** = FCF/IRR/metrics
- /tests/** = unit + property-based + golden tests
- /ui/** = UI only (read-only for these skills)
- /infra/**, /.env, /auth/** = forbidden

## Global GAAP Guardrails (Apply to All Skills Below)
- Accrual basis: recognize revenues/expenses in the period incurred, not when cash moves.
- Balance sheet must balance every period: Assets = Liabilities + Equity.
- Cash flow must reconcile: Begin Cash + Net CF = End Cash.
- Debt:
  - Interest accrues by period on outstanding principal (and on capitalized fees if using effective interest method, if implemented).
  - Principal payments reduce debt (liability) only; they are not expenses.
  - Debt issuance costs/closing costs must be explicitly modeled and classified (default: amortized over term; cash flow classification depends on your accounting policy choice—see below).
- Equity:
  - Equity contributions/distributions flow through equity accounts and cash flow financing section; they do not touch the income statement.
- Non-cash items must be identifiable and removable from cash flow ops via reconciliation (e.g., depreciation, amortization).
- Policy flags must be explicit, not implicit (e.g., CF classification options).

## Shared Accounting Policy Object (Required)
Create/maintain a single policy object used by statements:
- accounting_basis: "GAAP_ACCRUAL"
- cash_flow_classification:
  - interest_paid: "OPERATING" | "FINANCING" (default to OPERATING under US GAAP practice)
  - interest_received: "OPERATING" | "INVESTING"
  - distributions: "FINANCING"
  - debt_issuance_costs: "FINANCING" (default; keep consistent)
- depreciation_method: "STRAIGHT_LINE"
- amortization_method: "STRAIGHT_LINE" | "EIR" (if EIR not implemented, lock to STRAIGHT_LINE and document)
- rounding_policy: deterministic (e.g., cents; banker's rounding true/false)

This policy object is the “one throat to choke” for GAAP-ish classification consistency.

---

# Skill 1 — Financing Calculator (Acquisition + New Debt)
## Name
Finance.NewDebtCalculator

## Purpose
Create deterministic financing outputs (loan sizing, fees, amortization, debt service schedule, initial journal impacts) given variables.

## Allowed Scope
- Read/write: /calc/financing/**, /domain/types/**, /tests/financing/**
- Read-only: /engine/**, /statements/**, /analytics/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Allowed Commands
- npm test | pnpm test | pytest (pick your stack)
- lint/format/test only (no dependency installs)

## Required Inputs
- purchase_date (period index or YYYY-MM)
- purchase_price
- loan_type (amortizing | IO_then_amortizing)
- interest_rate_annual, compounding="monthly"
- term_months, amortization_months
- ltv_max and/or loan_amount_override
- closing_cost_pct (of loan) + any fixed fees
- upfront_reserves (optional)
- rounding_policy, accounting_policy_ref

## Required Outputs
- loan_amount_gross, loan_amount_net
- closing_costs_total + breakdown
- initial_cash_in (net proceeds)
- debt_service_schedule (at least full term or full model horizon)
- journal_hooks (structured deltas to BS/CF, not direct posting)

## GAAP Invariants
- Closing costs do not hit P&L immediately unless policy says so; default: amortize.
- Only interest hits IS; principal hits BS/CF.
- Schedule must reconcile: ending_balance = beginning_balance - principal_paid.

## Tests (Must Exist)
- Unit tests: sizing, schedule, IO-to-amort transition.
- Golden test: known scenario with fixed expected payments/balances.
- Reconciliation test: principal roll-forward ties to schedule.

---

# Skill 2 — Refinancing Calculator (Payoff + New Debt + Cash-Out)
## Name
Finance.RefinanceCalculator

## Purpose
Compute refinance proceeds, payoff amounts, penalties, new debt schedule, and equity cash-out.

## Allowed Scope
- Read/write: /calc/refinance/**, /domain/types/**, /tests/refinance/**
- Read-only: /engine/**, /statements/**, /analytics/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Allowed Commands
- tests + lint/format only

## Required Inputs
- refinance_date
- current_loan_balance
- property_value_at_refi OR (stabilized_noi + cap_rate) (choose one input path; do not mix)
- ltv_max
- closing_cost_pct
- prepayment_penalty (none | pct_of_balance | fixed)
- accrued_interest_to_payoff (optional)
- dscr_min (optional) + noi_for_dscr (if used)
- new_loan_terms (rate/term/amort/IO months)
- accounting_policy_ref, rounding_policy

## Required Outputs
- new_loan_amount_gross, new_loan_amount_net
- payoff_total (balance + penalty + accrued interest)
- cash_out_to_equity (net proceeds - payoff)
- proceeds_breakdown (line items)
- new_debt_service_schedule
- flags: dscr_binding, ltv_binding, negative_cash_out, invalid_inputs

## GAAP Invariants
- Payoff reduces old debt; new debt recorded separately.
- Penalties/fees classification must follow policy (default: recognized in period incurred; configurable).
- Cash-out is financing cash flow; not income.

## Tests (Must Exist)
- Cases: no cash-out, cash-out positive, penalty on/off, IO period, DSCR binding reduces loan.
- Reconcile new schedule roll-forward.
- Validate flags trigger deterministically.

---

# Skill 3 — Funding & Tranche Engine (Equity + Management Company Funding Gates)
## Name
Finance.FundingTranchesEngine

## Purpose
Model equity funding events (property equity, opco tranches), enforce “cannot operate before funded” rules, and produce funding timelines.

## Allowed Scope
- Read/write: /calc/funding/**, /domain/types/**, /tests/funding/**
- Read-only: /engine/**, /statements/**, /analytics/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Required Behaviors
- Support scheduled and conditional tranches (date-based + trigger-based).
- Enforce gates:
  - OpCo operations cannot start before first eligible tranche.
  - Property activation cannot start before acquisition + required funding.
- Output structured violations (not silent fixes).

## Outputs
- funding_events[] with timestamps and entity targets
- equity_rollforward (begin, contributions, distributions, end)
- validation_errors[] (blocking) + warnings[]

## GAAP Invariants
- Equity contributions/distributions never hit IS.
- Equity roll-forward must tie to BS equity section each period.

## Tests
- Gate violations caught.
- Partial funding triggers shortfall flags.
- Equity roll-forward ties.

---

# Skill 4 — Statement Applier (Post Events into IS/CF/BS Safely)
## Name
Statements.EventApplier

## Purpose
Take calculator outputs (financing/refi/funding/ops events) and apply them to period statements through a controlled posting layer.

## Allowed Scope
- Read/write: /engine/posting/**, /statements/**, /domain/ledger/**, /tests/statements/**
- Read-only: /calc/**, /analytics/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Required Architecture
- Use a structured “journal delta” model:
  - Each event emits postings: {account, debit, credit, classification, cash_flow_bucket, memo}
- Statements are derived from postings; no ad-hoc statement edits.

## GAAP Invariants (Enforced by Code)
- Every journal entry balances (sum debits = sum credits).
- BS balances every period.
- CF ties cash movement from postings to cash account change.
- Classification follows accounting_policy_ref.

## Tests
- Journal balance tests.
- Period reconciliation: IS net income → retained earnings roll-forward (if modeled).
- CF tie-out: delta cash equals sum of CF sections.

---

# Skill 5 — FCF Model Builder (Unlevered + Levered, Portfolio + Entity)
## Name
Analytics.FCFBuilder

## Purpose
Produce FCFF/FCFE from statements consistently across properties, opco, and consolidated views.

## Allowed Scope
- Read/write: /analytics/fcf/**, /domain/types/**, /tests/analytics/**
- Read-only: /statements/**, /calc/**, /engine/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Required Outputs
- FCFE timeline per entity (property, opco, consolidated)
- FCFF timeline (optional, if you want enterprise-level valuation)
- Reconciliation view:
  - FCFE = Net Income + NonCash +/− Working Capital − CapEx + Net Borrowing (policy-defined)

## GAAP Invariants
- No double-counting:
  - Interest expense affects NI; debt principal affects net borrowing, not expense.
- Non-cash addbacks explicitly enumerated.

## Tests
- Cross-check FCFE against cash flow statement (financing + operating ties).
- Ensure portfolio aggregation equals sum of constituents (unless eliminations are modeled).

---

# Skill 6 — IRR & Returns Engine (Equity Waterfall-Ready)
## Name
Analytics.IRRAndReturns

## Purpose
Compute IRR, MOIC, DPI, RVPI (if desired), and scenario comparisons from FCFE/equity cash flows.

## Allowed Scope
- Read/write: /analytics/returns/**, /domain/types/**, /tests/returns/**
- Read-only: /analytics/fcf/**, /statements/**, /calc/**, /engine/**, /ui/**
- Forbidden: /infra/**, /.env, /auth/**

## Required Outputs
- IRR (periodic + annualized)
- MOIC / equity multiple
- Cash-on-cash (optional)
- Sensitivity hooks (cap rate, refi timing, rate shocks)

## Tests
- Known IRR cases (simple two-cashflow, multi-period).
- Numerical stability tests (near-zero, all-negative, no-positive returns).
- Consistent day-count/period convention explicitly stated.

---

## Cross-Skill “Stop the Line” Validations (Blocking)
These validations must be callable from CI and must fail the run if violated:
- BS balances every period for every entity and consolidated.
- Cash tie-out holds every period.
- No negative cash rule (unless an explicit “allow_overdraft” policy flag is set—default false).
- Funding gates satisfied (opco + property activation).
- Debt schedule roll-forward integrity.

## Recommended Skill Progression (Practical Use)
1) Finance.NewDebtCalculator
2) Finance.RefinanceCalculator
3) Finance.FundingTranchesEngine
4) Statements.EventApplier
5) Analytics.FCFBuilder
6) Analytics.IRRAndReturns
This keeps “math objects” separate from “posting,” and “posting” separate from “analytics,” which is how you prevent subtle GAAP drift.

## What I Need From You (Only If You Want This to Be Copy-Paste Exact)
- Your language/runtime (TypeScript vs Python) and test runner
- Your current folder layout (or confirm the paths above)
- Whether you want interest paid classified as Operating (typical US GAAP) or Financing (some models do this for lender-style views); we’ll encode it as a policy flag either way
```
