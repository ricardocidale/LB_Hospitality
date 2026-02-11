Seed or reseed the database with sample data:

1. Check current database state by querying existing properties and global assumptions
2. If database is empty, run the seed script: `npx tsx server/seed.ts`
3. If database has data and a fresh start is needed, use: `npx tsx server/seed.ts --force`
4. Verify the seeded data by checking:
   - Admin user exists and can login
   - Global assumptions are populated with defaults
   - Sample properties are created (The Hudson Estate, Eden Summit Lodge, Austin Hillside, Casa Medellín, Blue Ridge Manor)
5. Run verification after seeding to confirm all checks pass

For production seeding via API:
- Login as admin: POST /api/auth/login
- Call: POST /api/admin/seed-production
- This seeds users, user groups, global assumptions, properties, and design themes
- It is idempotent and skips existing records

Seeded users:
- admin (Ricardo Cidale, Norfolk Group, admin role)
- rosario@kitcapital.com (Rosario David, KIT Capital, user role)
- kit@kitcapital.com (Dov Tuzman, KIT Capital, user role)
- lemazniku@icloud.com (Lea Mazniku, KIT Capital, user role)
- checker@norfolkgroup.io (Checker, Norfolk AI, checker role)
- bhuvan@norfolkgroup.io (Bhuvan Agarwal, Norfolk Group, user role)
- reynaldo.fagundes@norfolk.ai (Reynaldo Fagundes, Norfolk AI, user role)

Seeded user groups:
- KIT Group (company: KIT Capital) → Rosario, Dov, Lea
- Norfolk Group (company: Norfolk Group) → Ricardo, Checker, Bhuvan, Reynaldo
