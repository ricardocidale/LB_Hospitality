# Data Integrity Invariants

## Shared Row Uniqueness

All portfolio-wide data must be stored as **shared rows** (userId = NULL). These invariants are enforced by `tests/proof/data-integrity.test.ts` and checked by the verification system.

### Global Assumptions

- There must be **exactly one** `global_assumptions` row with `userId IS NULL`.
- Queries for the shared row must always use `ORDER BY id DESC` to guarantee the newest row is returned if duplicates somehow appear.
- The `upsertGlobalAssumptions()` method reads-then-writes; if duplicates exist, it may silently update the wrong row.
- **Root cause (Feb 2025):** `getGlobalAssumptions()` had no `ORDER BY`, causing PostgreSQL to return an arbitrary row when duplicates existed.

### Properties — Shared Ownership

- All portfolio properties must have `userId = NULL` so every authenticated user can see them.
- The `getAllProperties(userId)` query uses `WHERE userId = :uid OR userId IS NULL`. A property with a non-null `userId` is invisible to all other users.
- **Root cause (Feb 2025):** Production seeding created Loch Sheldrake with `userId = 1` instead of `NULL`, making it invisible to all non-admin users.

### Defensive Patterns

```typescript
// CORRECT — always ORDER BY DESC for shared singleton rows
const [shared] = await db.select().from(globalAssumptions)
  .where(isNull(globalAssumptions.userId))
  .orderBy(desc(globalAssumptions.id))
  .limit(1);

// WRONG — no ORDER BY; PostgreSQL returns arbitrary row
const [shared] = await db.select().from(globalAssumptions)
  .where(isNull(globalAssumptions.userId))
  .limit(1);
```

```typescript
// CORRECT — shared property (all users see it)
await storage.createProperty({ ...data, userId: null });

// WRONG — owned property (only one user sees it)
await storage.createProperty({ ...data, userId: req.user.id });
```

### When Adding New Shared Singleton Tables

1. Ensure `ORDER BY id DESC` on all read queries.
2. Add a uniqueness check in `tests/proof/data-integrity.test.ts`.
3. Add a migration guard in `server/migrations/` to clean duplicates on deploy.

### Verification

These checks run as part of the financial verification pipeline (`npm run verify:summary`) under the "Data Integrity" phase. Failures produce an **ADVERSE** opinion.

### Checklist

- [ ] Does every shared singleton query include `ORDER BY id DESC`?
- [ ] Are all new properties created with `userId: null`?
- [ ] Is there a data-integrity test for the new table?
- [ ] Does the migration script handle duplicate cleanup?
