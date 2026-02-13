# Audit and Test Runs Must Verify Rules Compliance

## Rule

Every time the user requests a test run, audit, or code review, you must also check compliance with all rules in `.claude/rules/`. This is not optional — rule verification is part of every audit and test cycle.

## Rules to Check

On every test or audit request, verify the codebase against:

1. **`no-hardcoded-assumptions.md`** — No financial or operational assumption values appear as literals. All must come from `globalAssumptions` or named constants in `shared/constants.ts`.

2. **`no-hardcoded-admin-config.md`** — No admin-managed configuration values appear as literals. All must come from the database (logos, themes, asset descriptions, user groups, sidebar toggles, display settings).

3. **`recalculate-on-save.md`** — Every save mutation that affects financial data invalidates all downstream financial queries. No partial invalidation.

4. Any other rule files present in `.claude/rules/` at the time of the audit.

## When This Applies

- User says "run tests", "test", "audit", "check", "verify", or similar
- User asks for a code review or quality check
- Before marking any major feature as complete

## How to Check

1. Run the requested tests or audit workflows
2. Scan recently changed files for rule violations (grep for hardcoded literals, check mutation `onSuccess` handlers for proper invalidation)
3. Report any violations found alongside test/audit results
4. Fix violations before reporting success, or flag them clearly if the user needs to decide
