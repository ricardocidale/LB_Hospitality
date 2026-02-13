# Rule: Production Sync Must Be Fill-Only

## Mandate

The production database sync endpoint (`POST /api/admin/seed-production`) MUST operate in **fill-only mode**. It must NEVER overwrite values that a user has already set in the production environment.

## Prohibited Patterns

1. **No `syncMode` overwrite** — The old `syncMode` flag that overwrote all values has been removed. Do not reintroduce it.
2. **No unconditional `upsertGlobalAssumptions`** — Global assumptions must use `fillMissingFields()` to only fill null/undefined fields.
3. **No `updateProperty` with full seed data** — Properties must only receive updates for fields that are currently empty.
4. **No `updateFeeCategory` rate changes** — Fee categories may be created if missing, but existing category rates must never be changed by sync.

## Required Patterns

1. Use `isFieldEmpty()` from `server/syncHelpers.ts` to check if a field needs filling
2. Use `fillMissingFields()` to compute the minimal update set
3. Use `runFillOnlySync()` for the orchestrated sync flow
4. Zero (`0`) and `false` MUST be treated as valid user values (not empty)
5. The response shape must use `filled` (not `updated`) for partial fills

## Enforcement

- `tests/admin/fill-only-sync.test.ts` — Behavioral contract tests verifying fill-only semantics
- `tests/admin/database-sync.test.ts` — Golden-value tests anchoring seed constants
- Any PR that adds overwrite behavior to the sync endpoint must be rejected

## UI Requirements

- The "Populate Production" button must be in a separate card from "Database Status"
- The confirmation dialog must clearly state that only empty fields will be filled
- Button label must be "Fill Missing Values" (not "Sync Database" or "Overwrite")
