Check data health and integrity:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/properties → list all properties with key fields (name, location, rooms, ADR, type)
3. GET /api/global-assumptions → current model configuration (projectionYears, rates, fees)
4. GET /api/admin/run-verification → run independent financial verification (98 checks)
5. Report: property count, assumption summary, verification result (opinion + pass/fail)
6. Flag any issues: missing fields, zero values, verification failures

Data management endpoints:
- POST /api/admin/seed-production → seed database with production data (idempotent)
- POST /api/properties → create property
- PATCH /api/properties/:id → update property
- POST /api/global-assumptions → create/update global assumptions

Seeding:
- npx tsx server/seed.ts → seed with dev data (5 sample properties)
- npx tsx server/seed.ts --force → force re-seed (clears and recreates)
- POST /api/admin/seed-production → production seed via API (admin only)

Database schema lives in shared/schema.ts. Apply changes with: npx drizzle-kit push

Key tables: users, sessions, global_assumptions, properties, scenarios, login_logs,
activity_logs, verification_runs, design_themes, market_research, prospective_properties, saved_searches

Notes:
- Financial engine runs client-side (client/src/lib/financialEngine.ts)
- Verification runs server-side (server/calculationChecker.ts) — completely independent
- Both must produce the same results (98/98 UNQUALIFIED expected)
