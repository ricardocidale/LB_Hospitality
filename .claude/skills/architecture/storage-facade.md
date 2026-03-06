---
name: Storage Facade
description: Documents the DatabaseStorage facade pattern — a single IStorage interface delegating to 6 specialized storage classes.
---

# Storage Facade Pattern

## Overview

`DatabaseStorage` implements `IStorage` as a thin facade that delegates all database operations to 6 specialized classes. This keeps each class focused (~100-200 lines) while presenting a single unified interface to route handlers.

## Architecture

```
IStorage (interface)
    |
    v
DatabaseStorage (facade) ── delegates to:
    ├── StorageUsers        — users, sessions, login_logs, user_groups
    ├── StorageProperties   — properties CRUD
    ├── StorageFinancial    — global_assumptions, scenarios, fee categories
    ├── StorageAdmin        — verification_runs, seeding, design_themes
    ├── StorageActivity     — activity_logs
    └── StorageResearch     — market_research, research_questions
```

## Key Files

| File | Purpose |
|------|---------|
| `server/storage.ts` | `IStorage` interface + `DatabaseStorage` facade |
| `server/storage/users.ts` | User/session/group CRUD |
| `server/storage/properties.ts` | Property CRUD |
| `server/storage/financial.ts` | Global assumptions, scenarios, fees |
| `server/storage/admin.ts` | Verification, themes, seeding |
| `server/storage/activity.ts` | Activity log queries |
| `server/storage/research.ts` | Market research, research questions |

## Conventions

- Route handlers receive `storage: IStorage` — never access specialized classes directly
- Each specialized class takes `db` (Drizzle instance) in constructor
- All queries use Drizzle ORM with the shared schema from `shared/schema.ts`
- Shared singleton rows (global_assumptions) use `ORDER BY id DESC` per `data-integrity.md`
- Properties use `userId IS NULL` for shared visibility per `portfolio-dynamics.md`

## Related Rules

- `.claude/rules/data-integrity.md` — singleton row uniqueness
- `.claude/rules/portfolio-dynamics.md` — shared property ownership
- `.claude/rules/database-seeding.md` — seed data conventions
