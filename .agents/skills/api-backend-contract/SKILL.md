---
name: api-backend-contract
description: The server-side architecture and API surface for the HBG Portal. Covers Express backend structure, route modules, storage interface, authentication middleware, rate limiting, SSE streaming, scenario system, multi-tenancy, and role-based access control. Use this skill when working on server routes, API endpoints, storage operations, or authentication.
---

# API & Backend Contract

Express 5 backend with domain-organized route modules. IStorage interface + Drizzle ORM against PostgreSQL. Session-based auth (bcrypt, 7-day cookies). Role-based access: admin/partner/checker/investor. Rate limiting on login + AI. SSE streaming for research. Scenario system with JSONB snapshots. Multi-tenancy via user groups with theme/logo cascade.

Key files: `server/index.ts`, `server/routes.ts`, `server/storage.ts`, `server/auth.ts`, `shared/schema.ts`.

**Canonical reference:** `.claude/skills/architecture/SKILL.md` and `.claude/skills/architecture/api-routes.md`

See also: `.claude/skills/proof-system/SKILL.md` (verification endpoints), `.claude/skills/marcela-ai/SKILL.md` (AI endpoints)
