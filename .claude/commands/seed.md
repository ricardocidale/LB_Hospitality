Seed or reseed the database with sample data:

1. Check current database state by querying existing properties and global assumptions
2. If database is empty, run the seed script: `npx tsx server/seed.ts`
3. If database has data and a fresh start is needed, use: `npx tsx server/seed.ts --force`
4. Verify the seeded data by checking:
   - Admin user exists and can login
   - Global assumptions are populated with defaults
   - Sample properties are created (The Hudson Estate, Hacienda Luna, The Pines, Casa Montaña)
5. Run verification after seeding to confirm all 89 checks pass

For production seeding via API:
- Login as admin: POST /api/auth/login
- Call: POST /api/admin/seed-production
- This seeds users, global assumptions, properties, and design themes
- It is idempotent and skips existing records
