---
name: database-environments
description: Database environment management for development and production PostgreSQL. Use when syncing data, running migrations, or debugging database issues.
---

# Database Environments

## Architecture
- **Development**: Local PostgreSQL via Replit's built-in database (DATABASE_URL env var)
- **Production**: Separate PostgreSQL database with distinct data
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`

## Key Commands
```bash
npm run db:push          # Push schema changes to dev database
npx drizzle-kit push     # Alternative direct push
npx drizzle-kit studio   # Open Drizzle Studio for visual DB management
```

## Schema Location
All Drizzle table definitions live in `shared/schema.ts`. When adding tables:
1. Define the table with `pgTable()`
2. Create insert schema with `createInsertSchema` from `drizzle-zod`
3. Export insert type via `z.infer<typeof insertSchema>`
4. Export select type via `typeof table.$inferSelect`
5. Run `npm run db:push` to apply

## Syncing Production Data
Manual process:
1. Identify differences between dev and prod data
2. Write SQL UPDATE/INSERT statements
3. Execute in the Production Database shell
4. Verify data consistency after sync

## Environment Variables
- `DATABASE_URL` — Connection string (auto-set by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — Individual connection params

## Storage Interface
All database operations go through `server/storage.ts` which implements `IStorage`.
Routes in `server/routes.ts` call storage methods — never raw SQL.

## Safety Rules
- Always use Drizzle ORM for migrations (never raw DDL)
- Use `execute_sql` tool for debugging only
- Never execute destructive SQL (DROP, DELETE, UPDATE) without explicit approval
- Use transactions for multi-table operations
