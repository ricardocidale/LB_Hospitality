# Rule: Database Sync Between Environments Must Use SQL Only

## Mandate

Synchronizing data between production and development databases (or vice versa) **MUST be done via direct SQL statements**, not through code endpoints, automated sync functions, or startup hooks.

## Why

We tried multiple code-based sync approaches and all failed or added fragile complexity:
- Auto-sync on server startup: overwrote user-set values silently
- Force-sync endpoints: caused data inconsistency between environments  
- Fill-only sync with overwrite mode: still had edge cases where values diverged

The only reliable method is to compare the two databases directly and run targeted SQL UPDATE statements.

## Prohibited Patterns

1. **No auto-sync on startup** — Server start must never compare or sync data between environments
2. **No "sync from dev to prod" endpoints** — Code cannot reliably determine which environment is the source of truth
3. **No overwrite mode on seed endpoints** — The seed/fill system is for initial setup only, not ongoing sync
4. **No code that reads from one database and writes to another** — Cross-database sync is a manual DBA task

## Allowed Patterns

1. **`/api/admin/seed-production`** — Fill-only seeding for initial database setup (never overwrites existing values)
2. **`runFillOnlySync()`** — Fills empty fields only, used by the seed endpoint above
3. **Direct SQL for corrections** — When a value is wrong in production, fix it with a targeted SQL UPDATE:
   ```sql
   UPDATE properties SET operating_reserve = 600000 WHERE name = 'Casa Medellín';
   ```

## Process for Syncing Databases

1. Identify the discrepancy (run verification, compare values)
2. Determine which environment has the correct value
3. Write a targeted SQL UPDATE for the incorrect environment
4. Run the SQL directly against the database
5. Verify the fix with the verification system

## Key Lesson

Database synchronization is a data management task, not a software feature. Treating it as code adds complexity that breaks silently. SQL is transparent, auditable, and reliable.
