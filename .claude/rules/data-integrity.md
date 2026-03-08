# Data Integrity Invariants

## Rule

All portfolio-wide data must be stored as **shared rows** (`userId = NULL`). Violations make data invisible to other users.

## Two Invariants

**1. Global Assumptions** — Exactly one row with `userId IS NULL`. Always query with `ORDER BY id DESC` to guarantee newest row.

**2. Properties** — All properties must have `userId = NULL`. Query uses `WHERE userId = :uid OR userId IS NULL` — non-null userId makes the property invisible to everyone else.

## Defensive Patterns

```typescript
// CORRECT — ORDER BY DESC on shared singleton
const [shared] = await db.select().from(globalAssumptions)
  .where(isNull(globalAssumptions.userId))
  .orderBy(desc(globalAssumptions.id)).limit(1);

// CORRECT — shared property
await storage.createProperty({ ...data, userId: null });
// WRONG — owned property (invisible to others)
await storage.createProperty({ ...data, userId: req.user.id });
```

## Scenario Load Risk

`loadScenario()` must: restore properties with `userId: null`, update the shared global assumptions row (not create a user-specific one), delete only shared properties (`userId IS NULL`).

## When Adding New Shared Singleton Tables

1. Add `ORDER BY id DESC` to all read queries
2. Add uniqueness check in `tests/proof/data-integrity.test.ts`
3. Add migration guard in `server/migrations/` to clean duplicates

Failures produce an **ADVERSE** verification opinion.
