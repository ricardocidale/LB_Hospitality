Add a new configurable constant to the system:

1. Define the constant with a DEFAULT_ prefix in `client/src/lib/constants.ts`
2. Add the database column to `shared/schema.ts` in the appropriate table
3. Run the SQL migration: ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
4. Update both seed endpoints in `server/routes.ts` with the default value:
   - POST /api/admin/seed-production
   - POST /api/seed-production
5. Update `server/seed.ts` development seed data
6. Add UI controls to the appropriate assumptions page:
   - Global values: `client/src/pages/CompanyAssumptions.tsx`
   - Property values: `client/src/pages/PropertyEdit.tsx`
7. Update all consumers to use the fallback pattern:
   `const value = specificValue ?? globalValue ?? DEFAULT_CONSTANT`
8. If the value affects verification, update `server/calculationChecker.ts` independently
9. Run verification to confirm all 89 checks still pass
10. Update `.claude/rules/constants-and-config.md` with the new constant
